const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const serverPath = path.join(ROOT, 'server.js');
const appPath = path.join(ROOT, 'app.js');

if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js not found.');
  process.exit(1);
}

if (!fs.existsSync(appPath)) {
  console.error('❌ app.js not found.');
  process.exit(1);
}

let server = fs.readFileSync(serverPath, 'utf8');
let app = fs.readFileSync(appPath, 'utf8');

/* =========================================================
   SERVER.JS — PHASE 2
========================================================= */

/* 1. Add pending_actions table */
const oldOtpTable =
  "CREATE TABLE IF NOT EXISTS otp_verifications (id TEXT PRIMARY KEY, mobile TEXT NOT NULL, purpose TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`;

const newTables =
  "CREATE TABLE IF NOT EXISTS otp_verifications (id TEXT PRIMARY KEY, mobile TEXT NOT NULL, purpose TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);" +
  "\n  CREATE TABLE IF NOT EXISTS pending_actions (" +
  "\n    id TEXT PRIMARY KEY," +
  "\n    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE," +
  "\n    action TEXT NOT NULL," +
  "\n    payload TEXT NOT NULL," +
  "\n    status TEXT DEFAULT 'pending'," +
  "\n    created_at TEXT DEFAULT CURRENT_TIMESTAMP" +
  "\n  );";

if (server.includes(oldOtpTable) && !server.includes('CREATE TABLE IF NOT EXISTS pending_actions')) {
  server = server.replace(oldOtpTable, newTables);
}

/* 2. Fix current widget ID fallback */
server = server.replace(
  "process.env.MSG91_WIDGET_ID||'36696d676742373539353374'",
  "process.env.MSG91_WIDGET_ID||'36696d6767423735393533733734'"
);

/* 3. Add AI agent helpers before AI chat */
if (!server.includes('function agentBusinessContext')) {

const agentCode = `

/* =========================================================
   KARTAAI PHASE 2 — AI AGENT
========================================================= */

function agentBusinessContext(m) {
  return {
    business: {
      id: m.id,
      name: m.businessName,
      type: m.businessType,
      location: m.location
    },
    today: m.today,
    products: m.products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      units: p.units,
      revenue: p.revenue,
      growth: p.growth,
      supplier: p.supplier
    })),
    orders: m.orders.slice(0, 10),
    customers: m.customers,
    offers: m.offers,
    activity: m.activity
  };
}

function createOfferNow(merchantId, payload) {
  const id =
    payload.id ||
    \`offer_\${Date.now()}_\${crypto.randomUUID().slice(0, 8)}\`;

  const name =
    payload.name ||
    'KartaAI Smart Offer';

  const products =
    payload.products ||
    'Selected products';

  const discount =
    payload.discount ||
    '10% OFF';

  const start =
    payload.start ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

  const end =
    payload.end ||
    new Date(Date.now() + 7 * 86400000)
      .toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

  db.prepare(\`
    INSERT INTO offers
    (id, merchant_id, name, products, discount, start, end, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', 'KartaAI')
  \`).run(
    id,
    merchantId,
    name,
    products,
    discount,
    start,
    end
  );

  db.prepare(\`
    INSERT INTO activity
    (merchant_id, text)
    VALUES (?, ?)
  \`).run(
    merchantId,
    \`KartaAI created offer: \${name}\`
  );

  return db.prepare(\`
    SELECT
      id,
      name,
      products,
      discount,
      start,
      end,
      status,
      created_by createdBy
    FROM offers
    WHERE id=?
  \`).get(id);
}

function createReorderNow(merchantId, productIds) {
  const ids =
    Array.isArray(productIds)
      ? productIds
      : [];

  if (!ids.length) {
    throw new Error(
      'No products were selected for reorder.'
    );
  }

  const r =
    db.prepare(\`
      INSERT INTO reorders
      (merchant_id, product_ids, status)
      VALUES (?, ?, 'Requested')
    \`).run(
      merchantId,
      JSON.stringify(ids)
    );

  db.prepare(\`
    INSERT INTO activity
    (merchant_id, text)
    VALUES (?, ?)
  \`).run(
    merchantId,
    \`KartaAI created reorder request for \${ids.length} products\`
  );

  return {
    id: r.lastInsertRowid,
    status: 'Requested',
    productIds: ids
  };
}

async function runAgentTool(
  name,
  args,
  merchantId
) {
  const m =
    merchantBundle(merchantId);

  if (!m) {
    throw new Error(
      'Merchant not found'
    );
  }

  if (name === 'get_sales') {
    return {
      today: m.today,
      history: m.salesHistory.slice(-10)
    };
  }

  if (name === 'get_inventory') {
    return {
      products: m.products,
      lowStock:
        m.products.filter(
          p =>
            p.stock <=
            p.reorderLevel
        )
    };
  }

  if (name === 'get_orders') {
    return {
      orders: m.orders
    };
  }

  if (name === 'get_customers') {
    return {
      customers: m.customers
    };
  }

  if (name === 'get_offers') {
    return {
      offers: m.offers
    };
  }

  if (name === 'get_market_context') {
    try {
      const url =
        'https://api.worldbank.org/v2/country/IND/indicator/AG.PRD.FOOD.XD?format=json&per_page=5';

      const response =
        await fetch(url);

      const data =
        await response.json();

      const latest =
        Array.isArray(data) &&
        data[1]?.find(
          x => x.value !== null
        );

      return {
        available: true,
        provider: 'World Bank',
        indicator:
          'Food Production Index',
        latest: latest
          ? {
              year: latest.date,
              value: latest.value
            }
          : null,
        note:
          'This is broad food-market context, not a retail edible-oil price.'
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  if (name === 'create_offer') {
    const actionId =
      \`action_\${crypto.randomUUID()}\`;

    const payload = {
      name:
        args.name ||
        'Slow Stock Saver',

      products:
        args.products ||
        'Slow-moving products',

      discount:
        args.discount ||
        '10% OFF',

      start:
        args.start || '',

      end:
        args.end || '',

      merchantId
    };

    db.prepare(\`
      INSERT INTO pending_actions
      (id, merchant_id, action, payload, status)
      VALUES (?, ?, ?, ?, 'pending')
    \`).run(
      actionId,
      merchantId,
      'create_offer',
      JSON.stringify(payload)
    );

    return {
      approvalRequired: true,
      action: 'create_offer',
      actionId,
      message:
        'The offer is ready for merchant approval.',
      preview: payload
    };
  }

  if (name === 'create_reorder') {
    const productIds =
      Array.isArray(args.productIds)
        ? args.productIds
        : [];

    const products =
      m.products.filter(
        p =>
          productIds.includes(
            p.id
          )
      );

    const actionId =
      \`action_\${crypto.randomUUID()}\`;

    const payload = {
      productIds,
      products,
      merchantId
    };

    db.prepare(\`
      INSERT INTO pending_actions
      (id, merchant_id, action, payload, status)
      VALUES (?, ?, ?, ?, 'pending')
    \`).run(
      actionId,
      merchantId,
      'create_reorder',
      JSON.stringify(payload)
    );

    return {
      approvalRequired: true,
      action: 'create_reorder',
      actionId,
      message:
        'The reorder is ready for merchant approval.',
      preview: payload
    };
  }

  throw new Error(
    \`Unknown AI tool: \${name}\`
  );
}

/* =========================================================
   AI ACTION APPROVAL
========================================================= */

app.post(
  '/api/ai/approve',
  (req, res) => {
    try {
      const {
        merchantId,
        actionId
      } = req.body;

      if (
        !merchantId ||
        !actionId
      ) {
        throw new Error(
          'Merchant ID and action ID are required.'
        );
      }

      const pending =
        db.prepare(\`
          SELECT
            id,
            merchant_id merchantId,
            action,
            payload,
            status
          FROM pending_actions
          WHERE id=?
          AND merchant_id=?
        \`).get(
          actionId,
          merchantId
        );

      if (!pending) {
        throw new Error(
          'Approval request not found.'
        );
      }

      if (
        pending.status !==
        'pending'
      ) {
        throw new Error(
          'This action has already been processed.'
        );
      }

      const payload =
        JSON.parse(
          pending.payload
        );

      let result;

      if (
        pending.action ===
        'create_offer'
      ) {
        result =
          createOfferNow(
            merchantId,
            payload
          );
      }

      else if (
        pending.action ===
        'create_reorder'
      ) {
        result =
          createReorderNow(
            merchantId,
            payload.productIds
          );
      }

      else {
        throw new Error(
          'Unsupported AI action.'
        );
      }

      db.prepare(\`
        UPDATE pending_actions
        SET status='approved'
        WHERE id=?
      \`).run(actionId);

      res.json({
        success: true,
        action:
          pending.action,
        result
      });

    } catch (error) {
      console.error(
        'AI approval error:',
        error
      );

      sendError(
        res,
        error
      );
    }
  }
);
`;

  const marker =
    "app.post('/api/ai/chat'";

  server =
    server.replace(
      marker,
      agentCode + "\\n" + marker
    );
}

/* 4. Replace the basic AI chat route */
const aiStart =
  "app.post('/api/ai/chat'";

const aiIndex =
  server.indexOf(aiStart);

if (aiIndex !== -1) {

  const afterAi =
    server.indexOf(
      "app.use((req,res)=>res.sendFile",
      aiIndex
    );

  if (afterAi !== -1) {

    const newAI = `
app.post(
  '/api/ai/chat',
  async (req, res) => {
    try {
      const {
        merchantId,
        message
      } = req.body;

      const m =
        merchantBundle(
          merchantId
        );

      if (!m) {
        throw new Error(
          'Merchant not found'
        );
      }

      if (!openai) {
        return res.json({
          text:
            'AI API is not configured. ' +
            m.insight,
          html:
            \`<p><strong>AI API not configured.</strong></p>
             <p>\${m.insight}</p>\`
        });
      }

      const tools = [
        {
          type: 'function',
          name: 'get_sales',
          description:
            'Get the merchant sales and recent sales history.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'get_inventory',
          description:
            'Check all inventory and identify low-stock products.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'get_orders',
          description:
            'Get recent customer orders.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'get_customers',
          description:
            'Get merchant customer information.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'get_offers',
          description:
            'Get current offers.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'get_market_context',
          description:
            'Get broad current Indian food-market context from the World Bank.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'create_offer',
          description:
            'Prepare an offer for approval. Never execute without approval.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              products: {
                type: 'string'
              },
              discount: {
                type: 'string'
              },
              start: {
                type: 'string'
              },
              end: {
                type: 'string'
              }
            },
            required: [
              'name',
              'products',
              'discount'
            ],
            additionalProperties: false
          }
        },

        {
          type: 'function',
          name: 'create_reorder',
          description:
            'Prepare a reorder request for approval.',
          parameters: {
            type: 'object',
            properties: {
              productIds: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            },
            required: [
              'productIds'
            ],
            additionalProperties: false
          }
        }
      ];

      const input = [
        {
          role: 'user',
          content:
            message
        }
      ];

      let response =
        await openai.responses.create({
          model:
            process.env.OPENAI_MODEL ||
            'gpt-5.6-luna',

          instructions:
            \`
You are KartaAI — an autonomous AI teammate for a small Indian retailer.

Your job is:

1. Understand the merchant's request.
2. Inspect business data using tools when necessary.
3. Find useful patterns.
4. Recommend a practical action.
5. When the user asks you to create an offer or reorder stock, prepare the action using the appropriate tool.
6. NEVER claim that an action was executed unless the approval API has actually executed it.
7. All data-changing actions require explicit merchant approval.
8. Answer in English, Hindi, or Hinglish based on the user's language.
9. Keep answers concise and practical.
10. Never invent sales, stock, orders, prices, customers, or market facts.
11. For market information, clearly distinguish public market context from merchant business data.

Merchant context:

\${JSON.stringify(
  agentBusinessContext(m)
)}
\`,

          tools,

          input
        });

      const toolOutputs = [];

      while (
        response.output.some(
          item =>
            item.type ===
            'function_call'
        )
      ) {

        const calls =
          response.output.filter(
            item =>
              item.type ===
              'function_call'
          );

        for (
          const call of calls
        ) {

          let args = {};

          try {
            args =
              JSON.parse(
                call.arguments ||
                '{}'
              );
          } catch (_) {
            args = {};
          }

          let result;

          try {
            result =
              await runAgentTool(
                call.name,
                args,
                merchantId
              );
          } catch (
            toolError
          ) {
            result = {
              error:
                toolError.message
            };
          }

          toolOutputs.push({
            type:
              'function_call_output',

            call_id:
              call.call_id,

            output:
              JSON.stringify(
                result
              )
          });
        }

        response =
          await openai.responses.create({
            model:
              process.env.OPENAI_MODEL ||
              'gpt-5.6-luna',

            instructions:
              \`
Continue acting as KartaAI.

Use the tool results to answer the merchant.

If a tool returned approvalRequired=true,
explain that the action is ready and requires
merchant approval.

Do not say an action has been completed
unless the merchant has approved it through
the approval endpoint.
\`,

            tools,

            previous_response_id:
              response.id,

            input:
              toolOutputs
          });
      }

      const text =
        response.output_text ||
        'I could not generate a response.';

      const safeText =
        text
          .replace(
            /&/g,
            '&amp;'
          )
          .replace(
            /</g,
            '&lt;'
          )
          .replace(
            />/g,
            '&gt;'
          )
          .replace(
            /\\n/g,
            '</p><p>'
          );

      const approvals = [];

      for (
        const output
          of toolOutputs
      ) {
        try {
          const parsed =
            JSON.parse(
              output.output
            );

          if (
            parsed.approvalRequired &&
            parsed.actionId
          ) {
            approvals.push({
              actionId:
                parsed.actionId,

              action:
                parsed.action,

              preview:
                parsed.preview,

              message:
                parsed.message
            });
          }
        } catch (_) {}
      }

      res.json({
        text,
        html:
          \`<p>\${safeText}</p>\`,
        agent: true,
        approvals,
        toolsUsed:
          toolOutputs.length
      });

    } catch (error) {
      console.error(
        'KartaAI AI error:',
        error
      );

      sendError(
        res,
        error
      );
    }
  });

`;

    server =
      server.slice(
        0,
        aiIndex
      ) +
      newAI +
      server.slice(
        afterAi
      );
  }
}

/* =========================================================
   APP.JS — PHASE 2
========================================================= */

/* 5. Fix access-token extraction */
const oldExtractor =
`function extractAccessToken(value) {
  const wanted = new Set(['access_token','access-token','accessToken','token','jwt']);
  const walk = (node) => {
    if (!node || typeof node !== 'object') return '';
    for (const [key, val] of Object.entries(node)) {
      if (wanted.has(key) && typeof val === 'string' && val.length > 20) return val;
      const nested = walk(val);
      if (nested) return nested;
    }
    return '';
  };
  return walk(value);
}`;

const newExtractor =
`function extractAccessToken(value) {
  if (
    typeof value === 'string' &&
    value.length > 20
  ) {
    return value;
  }

  if (
    !value ||
    typeof value !== 'object'
  ) {
    return '';
  }

  if (
    typeof value.message === 'string' &&
    value.message.length > 20
  ) {
    return value.message;
  }

  const wanted = new Set([
    'access_token',
    'access-token',
    'accessToken',
    'token',
    'jwt'
  ]);

  const walk = (node) => {
    if (
      !node ||
      typeof node !== 'object'
    ) {
      return '';
    }

    for (
      const [key, val]
      of Object.entries(node)
    ) {
      if (
        wanted.has(key) &&
        typeof val === 'string' &&
        val.length > 20
      ) {
        return val;
      }

      const nested =
        walk(val);

      if (nested) {
        return nested;
      }
    }

    return '';
  };

  return walk(value);
}`;

if (
  app.includes(
    oldExtractor
  )
) {
  app =
    app.replace(
      oldExtractor,
      newExtractor
    );
}

/* 6. Add approval card */
if (
  !app.includes(
    'function approvalCard('
  )
) {

const approvalCard = `

function approvalCard(approval) {
  const preview =
    approval.preview || {};

  if (
    approval.action ===
    'create_offer'
  ) {
    return \`
      <div class="result-card" style="margin-top:14px;border:1px solid #d9e5ef">

        <div class="result-kicker">
          ACTION READY
        </div>

        <strong>
          KartaAI wants to create this offer
        </strong>

        <div class="result-rows">

          <div class="result-row">
            <span>Offer</span>
            <span>
              \${escapeHTML(
                preview.name || ''
              )}
            </span>
          </div>

          <div class="result-row">
            <span>Products</span>
            <span>
              \${escapeHTML(
                preview.products || ''
              )}
            </span>
          </div>

          <div class="result-row">
            <span>Discount</span>
            <span>
              \${escapeHTML(
                preview.discount || ''
              )}
            </span>
          </div>

          <div class="result-row">
            <span>Duration</span>
            <span>
              \${escapeHTML(
                preview.start || ''
              )}
              –
              \${escapeHTML(
                preview.end || ''
              )}
            </span>
          </div>

        </div>

        <p>
          Review this action before KartaAI
          creates the offer.
        </p>

        <button
          class="primary"
          data-action="approve-ai"
          data-action-id="\${approval.actionId}">
          ✓ Approve & Create Offer
        </button>

      </div>
    \`;
  }

  if (
    approval.action ===
    'create_reorder'
  ) {

    const products =
      Array.isArray(
        preview.products
      )
        ? preview.products
        : [];

    return \`
      <div class="result-card" style="margin-top:14px;border:1px solid #d9e5ef">

        <div class="result-kicker">
          ACTION READY
        </div>

        <strong>
          KartaAI wants to create a reorder
        </strong>

        <div class="result-rows">

          \${products
            .map(
              p => \`
                <div class="result-row">
                  <span>
                    \${escapeHTML(
                      p.name
                    )}
                  </span>

                  <span class="warning">
                    \${p.stock} left
                  </span>
                </div>
              \`
            )
            .join('')}

        </div>

        <p>
          Review the products before approving
          the reorder.
        </p>

        <button
          class="primary"
          data-action="approve-ai"
          data-action-id="\${approval.actionId}">
          ✓ Approve Reorder
        </button>

      </div>
    \`;
  }

  return '';
}
`;

  app =
    app.replace(
      "function messagesHTML()",
      approvalCard +
      "\\nfunction messagesHTML()"
    );
}

/* 7. Modify ask() to render approval buttons */
const oldAskLine =
`last.html = result.html || escapeHTML(result.text || 'I could not generate a response.');`;

const newAskLine =
`last.html =
      result.html ||
      escapeHTML(
        result.text ||
        'I could not generate a response.'
      );

    if (
      Array.isArray(
        result.approvals
      ) &&
      result.approvals.length
    ) {
      last.html +=
        result.approvals
          .map(
            approval =>
              approvalCard(
                approval
              )
          )
          .join('');
    }`;

if (
  app.includes(
    oldAskLine
  )
) {
  app =
    app.replace(
      oldAskLine,
      newAskLine
    );
}

/* 8. Add approval execution function */
if (
  !app.includes(
    'async function approveAIAction('
  )
) {

const approvalFunction = `

async function approveAIAction(
  actionId
) {
  try {

    const result =
      await api(
        '/ai/approve',
        {
          method: 'POST',

          body: {
            merchantId:
              merchant().id,

            actionId
          }
        }
      );

    if (
      !result.success
    ) {
      throw new Error(
        'The AI action could not be completed.'
      );
    }

    await refreshMerchantFromAPI();

    if (
      result.action ===
      'create_offer'
    ) {

      state.toast =
        'KartaAI created the offer successfully.';

      state.messages.push({
        who: 'bot',

        html: \`
          <div class="result-card">

            <div class="result-kicker">
              ACTION COMPLETED
            </div>

            <strong>
              ✓ Offer created successfully
            </strong>

            <p>
              KartaAI completed your approved
              action and updated the business data.
            </p>

            <button
              class="primary"
              data-nav="offers">
              View Offers
            </button>

          </div>
        \`
      );
    }

    else if (
      result.action ===
      'create_reorder'
    ) {

      state.toast =
        'KartaAI created the reorder request.';

      state.messages.push({
        who: 'bot',

        html: \`
          <div class="result-card">

            <div class="result-kicker">
              ACTION COMPLETED
            </div>

            <strong>
              ✓ Reorder request created
            </strong>

            <p>
              The approved reorder has been
              added to your business activity.
            </p>

          </div>
        \`
      });
    }

    render();

  } catch (error) {

    state.toast =
      error.message ||
      'Could not complete the AI action.';

    render();
  }
}
`;

  app =
    app.replace(
      "async function createOffer()",
      approvalFunction +
      "\\nasync function createOffer()"
    );
}

/* 9. Add button event */
if (
  !app.includes(
    "action === 'approve-ai'"
  )
) {

  const old =
    "if (action === 'approve-offer') createOffer();";

  const replacement =
`if (action === 'approve-offer') createOffer();

    if (
      action === 'approve-ai'
    ) {
      await approveAIAction(
        el.dataset.actionId
      );
    }`;

  app =
    app.replace(
      old,
      replacement
    );
}

/* =========================================================
   WRITE FILES
========================================================= */

fs.copyFileSync(
  serverPath,
  serverPath + '.phase1-backup'
);

fs.copyFileSync(
  appPath,
  appPath + '.phase1-backup'
);

fs.writeFileSync(
  serverPath,
  server
);

fs.writeFileSync(
  appPath,
  app
);

console.log('');
console.log('======================================');
console.log('   KartaAI PHASE 2 INSTALLED ✓');
console.log('======================================');
console.log('');
console.log('Updated: server.js');
console.log('Updated: app.js');
console.log('');
console.log('Backups created:');
console.log('server.js.phase1-backup');
console.log('app.js.phase1-backup');
console.log('');
console.log('Next:');
console.log('1. Run: node --check server.js');
console.log('2. Run: node --check phase2-install.js');
console.log('3. Run: npm start');
console.log('');