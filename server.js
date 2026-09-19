import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import { GoogleGenAI } from '@google/genai';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);

const db = new DatabaseSync(
  path.join(__dirname, 'kartaai.db')
);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

/* =====================================================
   PRODUCT DATA
===================================================== */

const productBlueprint = [
  ['Mustard Oil 1L', 'Cooking Oil', 180, 38, 12, 136, 24480, 18],
  ['Sunflower Oil 1L', 'Cooking Oil', 178, 24, 10, 101, 17978, 8],
  ['Soybean Oil 1L', 'Cooking Oil', 170, 19, 10, 73, 12410, -3],
  ['Basmati Rice 5kg', 'Rice', 360, 4, 10, 49, 17640, 10],
  ['Aashirvaad Flour 5kg', 'Flour', 270, 31, 12, 57, 15390, 6],
  ['Premium Tea 500g', 'Beverages', 245, 2, 9, 22, 5390, -14],
  ['Cola Cold Drink 750ml', 'Beverages', 45, 17, 15, 18, 810, -21],
  ['Marie Biscuits', 'Snacks', 35, 65, 20, 61, 2135, 24],
  ['Toor Dal 1kg', 'Pulses', 155, 28, 12, 36, 5580, 4],
  ['Fine Sugar 1kg', 'Grocery', 48, 36, 15, 42, 2016, 3],
  ['Fresh Soap Pack', 'Personal Care', 110, 12, 10, 26, 2860, 9],
  ['Dishwash Liquid', 'Household', 99, 8, 10, 19, 1881, -6]
];

/* =====================================================
   DEMO MERCHANTS
===================================================== */

const merchantSeed = [
  {
    id: 'merchant_001',
    name: 'Rahul Sharma',
    businessName: 'Sharma General Store',
    businessType: 'Grocery & Daily Essentials',
    location: 'Greater Noida',
    mobile: '98765 43210',
    email: 'rahul@sharmastore.demo',
    multiplier: 1,
    sales: 18450,
    orders: 126,
    customers: 94,
    growth: 12.4,
    weeklyGrowth: 8,
    regularCustomers: 47,
    insight:
      'Mustard oil sales are up 18%. A small promotion can help clear your slow beverage stock.'
  },

  {
    id: 'merchant_002',
    name: 'Priya Verma',
    businessName: 'Priya Daily Needs',
    businessType: 'Grocery & Household',
    location: 'Indirapuram',
    mobile: '98910 22334',
    email: 'priya@dailyneeds.demo',
    multiplier: 0.82,
    sales: 15280,
    orders: 101,
    customers: 79,
    growth: 7.6,
    weeklyGrowth: 5,
    regularCustomers: 39,
    insight:
      'Your household essentials are doing well. Two tea products need a little attention.'
  },

  {
    id: 'merchant_003',
    name: 'Amit Gupta',
    businessName: 'Amit Fresh Mart',
    businessType: 'Food & Grocery',
    location: 'Noida Sector 76',
    mobile: '98188 66770',
    email: 'amit@freshmart.demo',
    multiplier: 1.16,
    sales: 22890,
    orders: 148,
    customers: 117,
    growth: 15.2,
    weeklyGrowth: 11,
    regularCustomers: 63,
    insight:
      'Rice and cooking oil are your strongest categories this week. Keep tea stock replenished.'
  }
];

/* =====================================================
   DATABASE INITIALIZATION
===================================================== */

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      name TEXT,
      business_name TEXT,
      business_type TEXT,
      location TEXT,
      mobile TEXT UNIQUE,
      email TEXT,
      multiplier REAL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
      name TEXT,
      category TEXT,
      price REAL,
      stock INTEGER,
      reorder_level INTEGER,
      units INTEGER,
      revenue REAL,
      previous_sales REAL,
      growth REAL,
      supplier TEXT,
      last_restocked TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
      customer TEXT,
      products TEXT,
      amount REAL,
      date_text TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
      name TEXT,
      frequency INTEGER,
      orders INTEGER,
      spending REAL,
      favourite TEXT,
      last_purchase TEXT,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
      name TEXT,
      products TEXT,
      discount TEXT,
      start TEXT,
      end TEXT,
      status TEXT,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
      text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Done'
    );

    CREATE TABLE IF NOT EXISTS reorders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
      product_ids TEXT,
      status TEXT DEFAULT 'Requested',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      mobile TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user','model')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_chat_conversations_merchant
      ON chat_conversations(merchant_id);

    CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
      ON chat_messages(conversation_id);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      order_id TEXT,
      customer TEXT,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'UPI',
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_payments_merchant
      ON payments(merchant_id);

    CREATE INDEX IF NOT EXISTS idx_payments_date
      ON payments(payment_date);
  `);

  seed();
  seedPaymentsFromOrders();
  seedHackathonDemoMerchant();
}

/* =====================================================
   SEED DATABASE
===================================================== */

function seed() {
  const count =
    db.prepare(
      'SELECT COUNT(*) c FROM merchants'
    ).get().c;

  if (count) return;

  const addMerchant = db.prepare(`
    INSERT INTO merchants
    (id,name,business_name,business_type,location,mobile,email,multiplier)
    VALUES (?,?,?,?,?,?,?,?)
  `);

  const addProduct = db.prepare(`
    INSERT INTO products
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const addOrder = db.prepare(`
    INSERT INTO orders
    VALUES (?,?,?,?,?,?,?)
  `);

  const addCustomer = db.prepare(`
    INSERT INTO customers
    VALUES (?,?,?,?,?,?,?,?,?)
  `);

  const addOffer = db.prepare(`
    INSERT INTO offers
    VALUES (?,?,?,?,?,?,?,?,?)
  `);

  const addActivity = db.prepare(`
    INSERT INTO activity
    (merchant_id,text)
    VALUES (?,?)
  `);

  db.exec('BEGIN');

  try {
    for (const m of merchantSeed) {

      addMerchant.run(
        m.id,
        m.name,
        m.businessName,
        m.businessType,
        m.location,
        m.mobile,
        m.email,
        m.multiplier
      );

      productBlueprint.forEach(
        (
          [
            name,
            category,
            price,
            stock,
            reorderLevel,
            units,
            revenue,
            growth
          ],
          i
        ) => {

          const mult = m.multiplier;

          const id =
            `prod_${m.id.slice(-3)}_${i + 1}`;

          const adjStock =
            Math.max(
              1,
              Math.round(
                stock *
                  (
                    m.id === 'merchant_002' &&
                    i === 5
                      ? 2
                      : 1
                  )
              )
            );

          addProduct.run(
            id,
            m.id,
            name,
            category,
            price,
            adjStock,
            reorderLevel,
            Math.round(units * mult),
            Math.round(revenue * mult),
            Math.round(
              (revenue * mult) /
              (1 + growth / 100)
            ),
            growth,
            i < 3
              ? 'North India Foods'
              : i < 7
              ? 'Daily Goods Supply'
              : 'Metro Distributors',
            i % 3 === 0
              ? '8 Sep 2026'
              : '4 Sep 2026'
          );
        }
      );

      const names = [
        'Anita',
        'Rohit',
        'Sanjay',
        'Meena',
        'Kavita',
        'Arun',
        'Pooja',
        'Vikram'
      ];

      const products = [
        'Mustard Oil, Rice',
        'Biscuits, Tea',
        'Flour, Sugar',
        'Sunflower Oil',
        'Cold Drinks',
        'Pulses, Rice',
        'Soap Pack',
        'Mustard Oil'
      ];

      names.forEach((n, i) => {

        addOrder.run(
          `ORD-${m.id.slice(-3)}-${120 + i}`,
          m.id,
          n,
          products[i],
          Math.round(
            (220 + i * 135) *
            m.multiplier
          ),
          i < 4
            ? 'Today'
            : `${11 - i} Sep`,
          i === 2
            ? 'Pending'
            : 'Completed'
        );
      });

      [
        'Anita Gupta',
        'Rohit Singh',
        'Meena Kumari',
        'Sanjay Patel',
        'Kavita Jain'
      ].forEach((n, i) => {

        addCustomer.run(
          `CUST-${m.id.slice(-3)}-${i + 1}`,
          m.id,
          n,
          8 - i,
          17 - i * 2,
          Math.round(
            (6840 - i * 780) *
            m.multiplier
          ),
          [
            'Cooking Oil',
            'Grocery',
            'Snacks',
            'Rice',
            'Personal Care'
          ][i],
          i < 2
            ? 'Today'
            : `${i + 1} days ago`,
          i < 4
            ? 'Returning'
            : 'New'
        );
      });

      addOffer.run(
        `offer_${m.id.slice(-3)}_01`,
        m.id,
        'Festival Grocery Value Pack',
        'Rice, Flour & Pulses',
        '8% OFF',
        '8 Sep 2026',
        '15 Sep 2026',
        'Active',
        'You'
      );

      addOffer.run(
        `offer_${m.id.slice(-3)}_02`,
        m.id,
        'Tea Time Special',
        'Tea & Biscuits',
        '10% OFF',
        '15 Sep 2026',
        '22 Sep 2026',
        'Scheduled',
        'KartaAI'
      );

      addActivity.run(
        m.id,
        'Checked today’s sales'
      );

      addActivity.run(
        m.id,
        'Found 3 products with low stock'
      );

      addActivity.run(
        m.id,
        'Created Tea Time Special'
      );
    }

    db.exec('COMMIT');

  } catch (error) {

    db.exec('ROLLBACK');
    throw error;
  }
}

/* =====================================================
   PAYMENT SEED / MIGRATION
===================================================== */

function seedPaymentsFromOrders() {
  const orderRows = db.prepare(`
    SELECT id, merchant_id, customer, amount, date_text, status
    FROM orders
    ORDER BY rowid ASC
  `).all();

  if (!orderRows.length) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO payments
    (id, merchant_id, order_id, customer, amount, payment_method, transaction_id, status, payment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const methods = ['UPI', 'Card', 'Cash', 'Net Banking'];

  db.exec('BEGIN');
  try {
    orderRows.forEach((order, index) => {
      // Demo payments are seeded separately with richer statuses/methods.
      if (order.merchant_id === HACKATHON_DEMO_MERCHANT_ID) {
        return;
      }

      const status = order.status === 'Completed' ? 'Completed' : 'Pending';
      const method = methods[index % methods.length];
      const transactionId =
        status === 'Completed'
          ? `TXN-${String(order.id).replace(/[^A-Za-z0-9]/g, '')}`
          : null;

      let paymentDate = new Date().toISOString();
      const parsed = Date.parse(String(order.date_text || ''));
      if (!Number.isNaN(parsed)) {
        paymentDate = new Date(parsed).toISOString();
      }

      insert.run(
        `PAY-${order.id}`,
        order.merchant_id,
        order.id,
        order.customer,
        Number(order.amount || 0),
        method,
        transactionId,
        status,
        paymentDate
      );
    });

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}


/* =====================================================
   HACKATHON DEMO MERCHANT
===================================================== */

const HACKATHON_DEMO_MERCHANT_ID = 'merchant_9b8cd7d3';
const HACKATHON_DEMO_MOBILE = '9557388470';

function seedHackathonDemoMerchant() {
  const exists = db.prepare(`
    SELECT id FROM merchants WHERE id = ?
  `).get(HACKATHON_DEMO_MERCHANT_ID);

  if (!exists) {
    db.prepare(`
      INSERT INTO merchants
      (id,name,business_name,business_type,location,mobile,email,multiplier)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(
      HACKATHON_DEMO_MERCHANT_ID,
      'Rashi Rajput',
      'FreshKart',
      'Food & Grocery',
      'Bijnor',
      HACKATHON_DEMO_MOBILE,
      'demo@kartaai.local',
      1.18
    );
  } else {
    // Keep the demo account tied to the requested number.
    db.prepare(`
      UPDATE merchants
      SET mobile = ?, name = ?, business_name = ?,
          business_type = ?, location = ?, email = ?
      WHERE id = ?
    `).run(
      HACKATHON_DEMO_MOBILE,
      'Rashi Rajput',
      'FreshKart',
      'Food & Grocery',
      'Bijnor',
      'demo@kartaai.local',
      HACKATHON_DEMO_MERCHANT_ID
    );
  }

  // Seed demo products only once.
  const productCount = Number(
    db.prepare(`
      SELECT COUNT(*) c
      FROM products
      WHERE merchant_id = ?
    `).get(HACKATHON_DEMO_MERCHANT_ID).c || 0
  );

  if (!productCount) {
    const addProduct = db.prepare(`
      INSERT INTO products
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    productBlueprint.forEach(
      (
        [
          name,
          category,
          price,
          stock,
          reorderLevel,
          units,
          revenue,
          growth
        ],
        i
      ) => {
        addProduct.run(
          `prod_demo_${i + 1}`,
          HACKATHON_DEMO_MERCHANT_ID,
          name,
          category,
          price,
          Math.max(1, Math.round(stock * 1.18)),
          reorderLevel,
          Math.round(units * 1.18),
          Math.round(revenue * 1.18),
          Math.round(revenue / (1 + growth / 100)),
          growth,
          i < 3
            ? 'North India Foods'
            : i < 7
            ? 'Daily Goods Supply'
            : 'Metro Distributors',
          i % 3 === 0 ? '18 Sep 2026' : '15 Sep 2026'
        );
      }
    );
  }

  // Seed demo customers only once.
  const customerCount = Number(
    db.prepare(`
      SELECT COUNT(*) c
      FROM customers
      WHERE merchant_id = ?
    `).get(HACKATHON_DEMO_MERCHANT_ID).c || 0
  );

  if (!customerCount) {
    const demoCustomers = [
      ['CUST-DEMO-01', 'Aarav Sharma', 12, 24, 12840, 'Cooking Oil', 'Today', 'Returning'],
      ['CUST-DEMO-02', 'Priya Singh', 10, 19, 9640, 'Rice', 'Today', 'Returning'],
      ['CUST-DEMO-03', 'Rahul Verma', 9, 17, 8750, 'Snacks', '1 day ago', 'Returning'],
      ['CUST-DEMO-04', 'Neha Gupta', 8, 15, 7420, 'Personal Care', '2 days ago', 'Returning'],
      ['CUST-DEMO-05', 'Vikas Kumar', 7, 13, 6180, 'Grocery', '3 days ago', 'Returning'],
      ['CUST-DEMO-06', 'Ananya Jain', 6, 11, 5290, 'Beverages', '4 days ago', 'Returning'],
      ['CUST-DEMO-07', 'Rohit Yadav', 5, 9, 4110, 'Pulses', '5 days ago', 'New'],
      ['CUST-DEMO-08', 'Simran Kaur', 4, 7, 3280, 'Biscuits', '6 days ago', 'New']
    ];

    const addCustomer = db.prepare(`
      INSERT INTO customers
      VALUES (?,?,?,?,?,?,?,?,?)
    `);

    for (const row of demoCustomers) {
      addCustomer.run(
        row[0],
        HACKATHON_DEMO_MERCHANT_ID,
        row[1], row[2], row[3], row[4], row[5], row[6], row[7]
      );
    }
  }

  // Seed demo orders only once.
  const orderCount = Number(
    db.prepare(`
      SELECT COUNT(*) c
      FROM orders
      WHERE merchant_id = ?
    `).get(HACKATHON_DEMO_MERCHANT_ID).c || 0
  );

  if (!orderCount) {
    const demoOrders = [
      ['ORD-DEMO-101', 'Aarav Sharma', 'Mustard Oil, Rice', 1250, 'Today', 'Completed'],
      ['ORD-DEMO-102', 'Priya Singh', 'Biscuits, Tea', 780, 'Today', 'Completed'],
      ['ORD-DEMO-103', 'Rahul Verma', 'Flour, Sugar', 2450, 'Yesterday', 'Completed'],
      ['ORD-DEMO-104', 'Neha Gupta', 'Sunflower Oil', 1890, 'Yesterday', 'Completed'],
      ['ORD-DEMO-105', 'Vikas Kumar', 'Cold Drinks', 650, '17 Sep', 'Completed'],
      ['ORD-DEMO-106', 'Ananya Jain', 'Pulses, Rice', 3200, '17 Sep', 'Completed'],
      ['ORD-DEMO-107', 'Rohit Yadav', 'Soap Pack', 1560, '16 Sep', 'Completed'],
      ['ORD-DEMO-108', 'Simran Kaur', 'Mustard Oil', 2780, '16 Sep', 'Completed'],
      ['ORD-DEMO-109', 'Karan Mehta', 'Rice, Flour', 1100, 'Today', 'Pending'],
      ['ORD-DEMO-110', 'Pooja Agarwal', 'Tea, Biscuits', 2100, 'Yesterday', 'Pending'],
      ['ORD-DEMO-111', 'Arjun Malhotra', 'Grocery Pack', 950, 'Yesterday', 'Pending'],
      ['ORD-DEMO-112', 'Meera Joshi', 'Personal Care', 700, '15 Sep', 'Pending']
    ];

    const addOrder = db.prepare(`
      INSERT INTO orders
      VALUES (?,?,?,?,?,?,?)
    `);

    for (const row of demoOrders) {
      addOrder.run(
        row[0],
        HACKATHON_DEMO_MERCHANT_ID,
        row[1],
        row[2],
        row[3],
        row[4],
        row[5]
      );
    }
  }

  // Seed demo offers only once.
  const offerCount = Number(
    db.prepare(`
      SELECT COUNT(*) c
      FROM offers
      WHERE merchant_id = ?
    `).get(HACKATHON_DEMO_MERCHANT_ID).c || 0
  );

  if (!offerCount) {
    const addOffer = db.prepare(`
      INSERT INTO offers
      VALUES (?,?,?,?,?,?,?,?,?)
    `);

    addOffer.run(
      'offer_demo_01',
      HACKATHON_DEMO_MERCHANT_ID,
      'FreshKart Weekend Saver',
      'Rice, Flour & Pulses',
      '10% OFF',
      '19 Sep 2026',
      '22 Sep 2026',
      'Active',
      'You'
    );

    addOffer.run(
      'offer_demo_02',
      HACKATHON_DEMO_MERCHANT_ID,
      'Tea Time Special',
      'Tea & Biscuits',
      '15% OFF',
      '20 Sep 2026',
      '25 Sep 2026',
      'Scheduled',
      'KartaAI'
    );
  }

  // Seed demo activity only once.
  const activityCount = Number(
    db.prepare(`
      SELECT COUNT(*) c
      FROM activity
      WHERE merchant_id = ?
    `).get(HACKATHON_DEMO_MERCHANT_ID).c || 0
  );

  if (!activityCount) {
    const addActivity = db.prepare(`
      INSERT INTO activity
      (merchant_id,text)
      VALUES (?,?)
    `);

    [
      'Checked today’s sales',
      'Received 6 successful payments',
      'Found 3 products with low stock',
      'Created FreshKart Weekend Saver',
      'KartaAI prepared today’s business summary'
    ].forEach((message) => {
      addActivity.run(
        HACKATHON_DEMO_MERCHANT_ID,
        message
      );
    });
  }

  // Seed demo payments. Status names match the existing payment API:
  // Completed / Pending / Failed.
  const paymentCount = Number(
    db.prepare(`
      SELECT COUNT(*) c
      FROM payments
      WHERE merchant_id = ?
    `).get(HACKATHON_DEMO_MERCHANT_ID).c || 0
  );

  if (!paymentCount) {
    const demoPayments = [
      ['PAY-DEMO-001', 'ORD-DEMO-101', 'Aarav Sharma', 1250, 'UPI', 'DEMO-UPI-10001', 'Completed', 0],
      ['PAY-DEMO-002', 'ORD-DEMO-102', 'Priya Singh', 780, 'Paytm', 'DEMO-PAYTM-10002', 'Completed', 0],
      ['PAY-DEMO-003', 'ORD-DEMO-103', 'Rahul Verma', 2450, 'UPI', 'DEMO-UPI-10003', 'Completed', 1],
      ['PAY-DEMO-004', 'ORD-DEMO-104', 'Neha Gupta', 1890, 'Card', 'DEMO-CARD-10004', 'Completed', 1],
      ['PAY-DEMO-005', 'ORD-DEMO-105', 'Vikas Kumar', 650, 'Cash', 'DEMO-CASH-10005', 'Completed', 2],
      ['PAY-DEMO-006', 'ORD-DEMO-106', 'Ananya Jain', 3200, 'Paytm', 'DEMO-PAYTM-10006', 'Completed', 2],
      ['PAY-DEMO-007', 'ORD-DEMO-107', 'Rohit Yadav', 1560, 'Card', 'DEMO-CARD-10007', 'Completed', 3],
      ['PAY-DEMO-008', 'ORD-DEMO-108', 'Simran Kaur', 2780, 'UPI', 'DEMO-UPI-10008', 'Completed', 3],
      ['PAY-DEMO-009', 'ORD-DEMO-109', 'Karan Mehta', 1100, 'UPI', 'DEMO-UPI-10009', 'Pending', 0],
      ['PAY-DEMO-010', 'ORD-DEMO-110', 'Pooja Agarwal', 2100, 'Paytm', 'DEMO-PAYTM-10010', 'Pending', 1],
      ['PAY-DEMO-011', 'ORD-DEMO-111', 'Arjun Malhotra', 950, 'UPI', 'DEMO-UPI-10011', 'Failed', 1],
      ['PAY-DEMO-012', 'ORD-DEMO-112', 'Meera Joshi', 700, 'Card', 'DEMO-CARD-10012', 'Failed', 4]
    ];

    const insertPayment = db.prepare(`
      INSERT OR IGNORE INTO payments
      (id, merchant_id, order_id, customer, amount, payment_method, transaction_id, status, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const payment of demoPayments) {
      const date = new Date(
        Date.now() - payment[7] * 24 * 60 * 60 * 1000
      );

      insertPayment.run(
        payment[0],
        HACKATHON_DEMO_MERCHANT_ID,
        payment[1],
        payment[2],
        payment[3],
        payment[4],
        payment[5],
        payment[6],
        date.toISOString()
      );
    }
  }

  console.log(
    `✅ Hackathon demo merchant ready: FreshKart (${HACKATHON_DEMO_MOBILE})`
  );
}

/* =====================================================
   MERCHANT BUNDLE
===================================================== */

function merchantBundle(id) {

  const m =
    db.prepare(`
      SELECT
        id,
        name,
        business_name businessName,
        business_type businessType,
        location,
        mobile,
        email,
        multiplier
      FROM merchants
      WHERE id=?
    `).get(id);

  if (!m) return null;

  const products =
    db.prepare(`
      SELECT
        id,
        name,
        category,
        price,
        stock,
        reorder_level reorderLevel,
        units,
        revenue,
        previous_sales previousSales,
        growth,
        supplier,
        last_restocked lastRestocked
      FROM products
      WHERE merchant_id=?
    `).all(id);

  const orders =
    db.prepare(`
      SELECT
        id,
        customer,
        products,
        amount,
        date_text date,
        status
      FROM orders
      WHERE merchant_id=?
      ORDER BY rowid DESC
    `).all(id);

  const customers =
    db.prepare(`
      SELECT
        id,
        name,
        frequency,
        orders,
        spending,
        favourite,
        last_purchase lastPurchase,
        type
      FROM customers
      WHERE merchant_id=?
    `).all(id);

  const offers =
    db.prepare(`
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
      WHERE merchant_id=?
      ORDER BY rowid DESC
    `).all(id);

  const activity =
    db.prepare(`
      SELECT
        text,
        strftime(
          '%d %b %Y %H:%M',
          created_at
        ) time,
        status
      FROM activity
      WHERE merchant_id=?
      ORDER BY id DESC
      LIMIT 20
    `).all(id);

  const sales =
    m.id === HACKATHON_DEMO_MERCHANT_ID
      ? 32540
      : m.id === 'merchant_001'
      ? 18450
      : m.id === 'merchant_002'
      ? 15280
      : 22890;

  const ordersCount =
    m.id === HACKATHON_DEMO_MERCHANT_ID
      ? 186
      : m.id === 'merchant_001'
      ? 126
      : m.id === 'merchant_002'
      ? 101
      : 148;

  const customersCount =
    m.id === HACKATHON_DEMO_MERCHANT_ID
      ? 132
      : m.id === 'merchant_001'
      ? 94
      : m.id === 'merchant_002'
      ? 79
      : 117;

  const growth =
    m.id === HACKATHON_DEMO_MERCHANT_ID
      ? 18.6
      : m.id === 'merchant_001'
      ? 12.4
      : m.id === 'merchant_002'
      ? 7.6
      : 15.2;

  const salesHistory =
    Array.from(
      { length: 30 },
      (_, i) => {

        const wave =
          0.85 +
          ((i * 7) % 13) / 30 +
          (i > 22 ? 0.08 : 0);

        return {
          date: new Date(
            2026,
            8,
            i === 29
              ? 12
              : i + 1
          ),

          revenue:
            Math.round(
              sales * wave
            ),

          orders:
            Math.max(
              6,
              Math.round(
                ordersCount * wave
              )
            ),

          product:
            products[
              i % products.length
            ]?.name,

          category:
            products[
              i % products.length
            ]?.category,

          units:
            Math.max(
              4,
              Math.round(
                (
                  products[
                    i % products.length
                  ]?.units || 20
                ) / 6
              )
            )
        };
      }
    );

  return {
    ...m,

    initials:
      m.name
        .split(/\s+/)
        .slice(0, 2)
        .map(
          x => x[0]
        )
        .join('')
        .toUpperCase(),

    today: {
      sales,
      orders: ordersCount,
      customers: customersCount,
      growth
    },

    weeklyGrowth:
      m.id === HACKATHON_DEMO_MERCHANT_ID
        ? 13
        : m.id === 'merchant_001'
        ? 8
        : m.id === 'merchant_002'
        ? 5
        : 11,

    regularCustomers:
      m.id === HACKATHON_DEMO_MERCHANT_ID
        ? 74
        : m.id === 'merchant_001'
        ? 47
        : m.id === 'merchant_002'
        ? 39
        : 63,

    insight:
      m.id === HACKATHON_DEMO_MERCHANT_ID
        ? 'Rice and cooking oil are driving FreshKart sales. Three products are running low and two payments are pending.'
        : m.id === 'merchant_001'
        ? 'Mustard oil sales are up 18%. A small promotion can help clear your slow beverage stock.'
        : m.id === 'merchant_002'
        ? 'Your household essentials are doing well. Two tea products need a little attention.'
        : 'Rice and cooking oil are your strongest categories this week. Keep tea stock replenished.',

    products,
    orders,
    customers,
    offers,
    activity,
    salesHistory,

    momentum: {
      status: 'Ready',
      offerId: null,
      verifiedAt: null
    }
  };
}

init();

/* =====================================================
   GEMINI
===================================================== */

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  'gemini-3.5-flash-lite';

const gemini =
  process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey:
          process.env.GEMINI_API_KEY
      })
    : null;

async function callGeminiWithFallback(aiClient, options, preferredModel = GEMINI_MODEL) {
  const candidateModels = Array.from(
    new Set([
      preferredModel,
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash'
    ].filter(Boolean))
  );

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const res = await aiClient.models.generateContent({
        ...options,
        model
      });
      return { response: res, model };
    } catch (err) {
      console.warn(`Gemini model ${model} failed (${err.status || err.code || err.message}). Trying fallback model...`);
      lastError = err;
    }
  }
  throw lastError;
}

/* =====================================================
   ERROR HANDLER
===================================================== */

const sendError =
  (res, e) =>
    res
      .status(400)
      .json({
        error:
          e?.message ||
          'Request failed'
      });

/* =====================================================
   HEALTH
===================================================== */

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      ok: true,
      database: 'sqlite',
      ai: !!gemini,
      aiProvider: 'Gemini',
      aiModel: GEMINI_MODEL,
      geminiKeyLoaded:
        !!process.env.GEMINI_API_KEY,
      msg91:
        !!process.env.MSG91_WIDGET_TOKEN
    });
  }
);

/* =====================================================
   MSG91 CONFIG
===================================================== */

app.get(
  '/api/config',
  (req, res) => {

    res.json({
      msg91: {
        widgetId:
          process.env.MSG91_WIDGET_ID ||
          '36696d6767423735393533733734',

        tokenAuth:
          process.env.MSG91_WIDGET_TOKEN ||
          ''
      }
    });
  }
);

/* =====================================================
   MOBILE HELPERS
===================================================== */

function normalizeMobile(value) {

  const digits =
    String(value || '')
      .replace(/\D/g, '');

  if (!digits) return '';

  if (
    digits.length === 12 &&
    digits.startsWith('91')
  ) {
    return digits.slice(2);
  }

  if (digits.length === 10) {
    return digits;
  }

  return '';
}

function cleanupOtpVerifications() {

  db.prepare(`
    DELETE FROM otp_verifications
    WHERE expires_at < ?
  `).run(Date.now());
}

/* =====================================================
   MSG91 IDENTIFIER
===================================================== */

function extractVerifiedIdentifier(value) {

  if (!value) return '';

  if (typeof value === 'string') {
    return normalizeMobile(value);
  }

  if (
    typeof value !== 'object'
  ) {
    return '';
  }

  const wanted =
    new Set([
      'mobile',
      'phone',
      'mobileNumber',
      'mobile_number',
      'identifier',
      'user'
    ]);

  for (
    const [key, val]
    of Object.entries(value)
  ) {

    if (
      wanted.has(key) &&
      typeof val === 'string'
    ) {

      const mobile =
        normalizeMobile(val);

      if (mobile) {
        return mobile;
      }
    }

    if (
      val &&
      typeof val === 'object'
    ) {

      const nested =
        extractVerifiedIdentifier(
          val
        );

      if (nested) {
        return nested;
      }
    }
  }

  return '';
}

/* =====================================================
   VERIFY MSG91 ACCESS TOKEN
===================================================== */

async function verifyMsg91AccessToken(
  accessToken
) {

  if (!accessToken) {
    throw new Error(
      'MSG91 access token is missing.'
    );
  }

  const possibleUrls = [
    'https://control.msg91.com/api/v5/widget/verifyAccessToken',
    'https://control.msg91.com/api/v5/widget/verifyAccessToken/'
  ];

  let lastError = null;

  for (
    const url
    of possibleUrls
  ) {

    try {

      const response =
        await fetch(
          url,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json'
            },

            body:
              JSON.stringify({
                accessToken
              })
          }
        );

      const text =
        await response.text();

      let data;

      try {
        data =
          JSON.parse(text);
      } catch {
        data = {
          raw: text
        };
      }

      if (!response.ok) {

        lastError =
          new Error(
            data?.message ||
            data?.error ||
            `MSG91 token verification failed (${response.status})`
          );

        continue;
      }

      return data;

    } catch (error) {

      lastError =
        error;
    }
  }

  throw (
    lastError ||
    new Error(
      'MSG91 access token verification failed.'
    )
  );
}

/* =====================================================
   MSG91 LOGIN / SIGNUP
===================================================== */

app.post(
  '/api/auth/verify-msg91',
  async (req, res) => {

    try {

      cleanupOtpVerifications();

      const {
        accessToken,
        mobile: requestedMobile,
        purpose
      } = req.body;

      if (!accessToken) {

        throw new Error(
          'MSG91 access token is missing.'
        );
      }

      const verified =
        await verifyMsg91AccessToken(
          accessToken
        );

      const mobile =
        extractVerifiedIdentifier(
          verified
        ) ||
        normalizeMobile(
          requestedMobile || ''
        );

      if (!mobile) {

        throw new Error(
          'MSG91 verified the OTP, but no mobile number was returned. Please try again.'
        );
      }

      const merchant =
        db.prepare(`
          SELECT
            id,
            name,
            business_name businessName,
            business_type businessType,
            location,
            mobile,
            email
          FROM merchants
          WHERE REPLACE(mobile, ' ', '') = ?
        `).get(mobile);

      /* SIGNUP */

      if (
        purpose === 'signup'
      ) {

        if (merchant) {

          return res.json({
            exists: true,
            merchant,
            mobile
          });
        }

        const verificationId =
          crypto.randomUUID();

        db.prepare(`
          INSERT OR REPLACE INTO otp_verifications
          (id,mobile,purpose,expires_at)
          VALUES (?,?,?,?)
        `).run(
          verificationId,
          mobile,
          'signup',
          Date.now() +
            10 * 60 * 1000
        );

        return res.json({
          exists: false,
          mobile,
          verificationId
        });
      }

      /* LOGIN */

      if (!merchant) {

        throw new Error(
          'No merchant account found for this mobile number.'
        );
      }

      return res.json({
        exists: true,
        mobile,
        merchant
      });

    } catch (e) {

      console.error(
        'MSG91 verification error:',
        e
      );

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   MERCHANTS
===================================================== */

app.get(
  '/api/merchants/:id',
  (req, res) => {

    try {

      const m =
        merchantBundle(
          req.params.id
        );

      if (!m) {

        throw new Error(
          'Merchant not found'
        );
      }

      res.json(m);

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   CREATE MERCHANT
===================================================== */

app.post(
  '/api/merchants',
  (req, res) => {

    try {

      const {
        name,
        businessName,
        businessType,
        location,
        mobile,
        email
      } = req.body;

      const normalized =
        normalizeMobile(mobile);

      if (
        !name ||
        !businessName ||
        !normalized
      ) {

        throw new Error(
          'Name, business name and mobile are required.'
        );
      }

      const existing =
        db.prepare(`
          SELECT id
          FROM merchants
          WHERE REPLACE(mobile, ' ', '') = ?
        `).get(normalized);

      if (existing) {

        throw new Error(
          'A merchant with this mobile number already exists.'
        );
      }

      const id =
        `merchant_${crypto
          .randomUUID()
          .slice(0, 8)}`;

      db.prepare(`
        INSERT INTO merchants
        (id,name,business_name,business_type,location,mobile,email,multiplier)
        VALUES (?,?,?,?,?,?,?,?)
      `).run(
        id,
        name,
        businessName,
        businessType ||
          'Retail',
        location ||
          'India',
        normalized,
        email || '',
        1
      );

      productBlueprint.forEach(
        (
          [
            productName,
            category,
            price,
            stock,
            reorderLevel,
            units,
            revenue,
            growth
          ],
          i
        ) => {

          db.prepare(`
            INSERT INTO products
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
          `).run(
            `prod_${id.slice(-8)}_${i + 1}`,
            id,
            productName,
            category,
            price,
            stock,
            reorderLevel,
            units,
            revenue,
            revenue /
              (1 + growth / 100),
            growth,
            i < 3
              ? 'North India Foods'
              : i < 7
              ? 'Daily Goods Supply'
              : 'Metro Distributors',
            '13 Sep 2026'
          );
        }
      );

      db.prepare(`
        INSERT INTO activity
        (merchant_id,text)
        VALUES (?,?)
      `).run(
        id,
        'Merchant account created'
      );

      res.status(201).json(
        merchantBundle(id)
      );

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   ACTIVITY
===================================================== */

app.get(
  '/api/activity',
  (req, res) => {

    try {

      const merchantId =
        req.query.merchantId;

      const rows =
        db.prepare(`
          SELECT
            text,
            strftime(
              '%d %b %Y %H:%M',
              created_at
            ) time,
            status
          FROM activity
          WHERE merchant_id=?
          ORDER BY id DESC
          LIMIT 50
        `).all(
          merchantId
        );

      res.json(rows);

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   REORDERS
===================================================== */

app.get(
  '/api/reorders',
  (req, res) => {

    try {

      const rows =
        db.prepare(`
          SELECT
            id,
            product_ids productIds,
            status,
            created_at createdAt
          FROM reorders
          WHERE merchant_id=?
          ORDER BY id DESC
        `).all(
          req.query.merchantId
        );

      res.json(
        rows.map(row => ({
          ...row,

          productIds:
            JSON.parse(
              row.productIds ||
              '[]'
            )
        }))
      );

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   OFFERS
===================================================== */

app.get(
  '/api/offers',
  (req, res) => {

    try {

      const rows =
        db.prepare(`
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
          WHERE merchant_id=?
          ORDER BY rowid DESC
        `).all(
          req.query.merchantId
        );

      res.json(rows);

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   CREATE OFFER
===================================================== */

app.post(
  '/api/offers',
  (req, res) => {

    try {

      const {
        merchantId,
        name,
        products,
        discount,
        start,
        end,
        status,
        createdBy
      } = req.body;

      if (
        !merchantId ||
        !name
      ) {

        throw new Error(
          'Merchant ID and offer name are required.'
        );
      }

      const id =
        `offer_${crypto.randomUUID()}`;

      db.prepare(`
        INSERT INTO offers
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(
        id,
        merchantId,
        name,
        products || '',
        discount || '',
        start || '',
        end || '',
        status || 'Draft',
        createdBy || 'KartaAI'
      );

      db.prepare(`
        INSERT INTO activity
        (merchant_id,text)
        VALUES (?,?)
      `).run(
        merchantId,
        `Created offer: ${name}`
      );

      res.status(201).json(
        db.prepare(`
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
        `).get(id)
      );

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   PUBLISH OFFER
===================================================== */

app.post(
  '/api/offers/:id/publish',
  (req, res) => {

    try {

      db.prepare(`
        UPDATE offers
        SET status='Active'
        WHERE id=?
        AND merchant_id=?
      `).run(
        req.params.id,
        req.body.merchantId
      );

      const offer =
        db.prepare(`
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
        `).get(
          req.params.id
        );

      if (!offer) {

        throw new Error(
          'Offer not found'
        );
      }

      res.json(offer);

    } catch (e) {

      sendError(
        res,
        e
      );
    }
  }
);

/* =====================================================
   MARKET
===================================================== */

app.get(
  '/api/market/edible-oils',
  async (req, res) => {

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

      res.json({
        available: true,
        provider: 'World Bank',
        indicator:
          'Food Production Index (context signal)',

        latest:
          latest
            ? {
                year:
                  latest.date,
                value:
                  latest.value
              }
            : null,

        checkedAt:
          new Date().toISOString(),

        note:
          'This is a broad food-market context signal, not a retail edible-oil price.'
      });

    } catch (e) {

      res.json({
        available: false,

        checkedAt:
          new Date().toISOString(),

        error:
          e.message
      });
    }
  }
);

/* =====================================================
   CHAT HISTORY API
===================================================== */

app.post('/api/chats', (req, res) => {
  try {
    const { merchantId, title } = req.body || {};
    const merchant = merchantBundle(merchantId);

    if (!merchant) {
      throw new Error('Merchant not found.');
    }

    const id = crypto.randomUUID();
    const cleanTitle =
      String(title || 'New Chat').trim().slice(0, 80) || 'New Chat';

    db.prepare(`
      INSERT INTO chat_conversations
      (id, merchant_id, title)
      VALUES (?, ?, ?)
    `).run(id, merchantId, cleanTitle);

    res.json({
      id,
      merchantId,
      title: cleanTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    sendError(res, e);
  }
});

app.get('/api/chats', (req, res) => {
  try {
    const merchantId = String(req.query.merchantId || '');
    if (!merchantBundle(merchantId)) {
      throw new Error('Merchant not found.');
    }

    const chats = db.prepare(`
      SELECT
        c.id,
        c.title,
        c.created_at createdAt,
        c.updated_at updatedAt,
        (
          SELECT content
          FROM chat_messages cm
          WHERE cm.conversation_id = c.id
            AND cm.role = 'user'
          ORDER BY cm.id ASC
          LIMIT 1
        ) preview,
        (
          SELECT COUNT(*)
          FROM chat_messages cm2
          WHERE cm2.conversation_id = c.id
        ) messageCount
      FROM chat_conversations c
      WHERE c.merchant_id = ?
      ORDER BY datetime(c.updated_at) DESC, c.rowid DESC
    `).all(merchantId);

    res.json({ chats });
  } catch (e) {
    sendError(res, e);
  }
});

app.get('/api/chats/:chatId/messages', (req, res) => {
  try {
    const merchantId = String(req.query.merchantId || '');
    const chat = db.prepare(`
      SELECT id, title
      FROM chat_conversations
      WHERE id = ? AND merchant_id = ?
    `).get(req.params.chatId, merchantId);

    if (!chat) {
      throw new Error('Chat not found.');
    }

    const messages = db.prepare(`
      SELECT id, role, content, created_at createdAt
      FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY id ASC
    `).all(req.params.chatId);

    res.json({ chat, messages });
  } catch (e) {
    sendError(res, e);
  }
});

app.delete('/api/chats/:chatId', (req, res) => {
  try {
    const merchantId = String(req.query.merchantId || '');
    const result = db.prepare(`
      DELETE FROM chat_conversations
      WHERE id = ? AND merchant_id = ?
    `).run(req.params.chatId, merchantId);

    if (!result.changes) {
      throw new Error('Chat not found.');
    }

    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

app.delete('/api/chats', (req, res) => {
  try {
    const merchantId = String(req.query.merchantId || '');
    db.prepare(`
      DELETE FROM chat_conversations
      WHERE merchant_id = ?
    `).run(merchantId);

    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

/* =====================================================
   PAYMENT HISTORY API
===================================================== */

app.get('/api/payments', (req, res) => {
  try {
    const merchantId = String(req.query.merchantId || '');
    if (!merchantBundle(merchantId)) {
      throw new Error('Merchant not found.');
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();

    const where = ['merchant_id = ?'];
    const params = [merchantId];

    if (search) {
      where.push(`
        (
          id LIKE ?
          OR COALESCE(order_id, '') LIKE ?
          OR COALESCE(customer, '') LIKE ?
          OR COALESCE(transaction_id, '') LIKE ?
          OR COALESCE(payment_method, '') LIKE ?
        )
      `);
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
    }

    if (status && status !== 'All') {
      where.push('status = ?');
      params.push(status);
    }

    if (from) {
      where.push("date(payment_date) >= date(?)");
      params.push(from);
    }

    if (to) {
      where.push("date(payment_date) <= date(?)");
      params.push(to);
    }

    const whereSql = where.join(' AND ');

    const countRow = db.prepare(`
      SELECT COUNT(*) count
      FROM payments
      WHERE ${whereSql}
    `).get(...params);

    const summary = db.prepare(`
      SELECT
        COUNT(*) totalPayments,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END), 0) totalReceived,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) pendingAmount,
        COUNT(CASE WHEN status = 'Failed' THEN 1 END) failedPayments,
        COALESCE(SUM(CASE WHEN status = 'Refunded' THEN amount ELSE 0 END), 0) refundedAmount
      FROM payments
      WHERE ${whereSql}
    `).get(...params);

    const rows = db.prepare(`
      SELECT
        id,
        order_id orderId,
        customer,
        amount,
        payment_method paymentMethod,
        transaction_id transactionId,
        status,
        payment_date paymentDate
      FROM payments
      WHERE ${whereSql}
      ORDER BY datetime(payment_date) DESC, rowid DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = Number(countRow?.count || 0);

    res.json({
      payments: rows,
      summary: {
        totalPayments: Number(summary?.totalPayments || 0),
        totalReceived: Number(summary?.totalReceived || 0),
        pendingAmount: Number(summary?.pendingAmount || 0),
        failedPayments: Number(summary?.failedPayments || 0),
        refundedAmount: Number(summary?.refundedAmount || 0)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (e) {
    sendError(res, e);
  }
});

app.get('/api/payments/:paymentId', (req, res) => {
  try {
    const merchantId = String(req.query.merchantId || '');
    const payment = db.prepare(`
      SELECT
        id,
        order_id orderId,
        customer,
        amount,
        payment_method paymentMethod,
        transaction_id transactionId,
        status,
        payment_date paymentDate
      FROM payments
      WHERE id = ? AND merchant_id = ?
    `).get(req.params.paymentId, merchantId);

    if (!payment) {
      throw new Error('Payment not found.');
    }

    res.json({ payment });
  } catch (e) {
    sendError(res, e);
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const {
      merchantId,
      orderId = null,
      customer = '',
      amount,
      paymentMethod = 'UPI',
      transactionId = null,
      status = 'Pending',
      paymentDate = new Date().toISOString()
    } = req.body || {};

    if (!merchantBundle(merchantId)) {
      throw new Error('Merchant not found.');
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error('A valid payment amount is required.');
    }

    const allowedStatus = new Set(['Completed', 'Pending', 'Failed', 'Refunded']);
    if (!allowedStatus.has(status)) {
      throw new Error('Invalid payment status.');
    }

    const id = `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    db.prepare(`
      INSERT INTO payments
      (id, merchant_id, order_id, customer, amount, payment_method, transaction_id, status, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      merchantId,
      orderId,
      String(customer || ''),
      numericAmount,
      String(paymentMethod || 'UPI'),
      transactionId ? String(transactionId) : null,
      status,
      paymentDate
    );

    const payment = db.prepare(`
      SELECT
        id,
        order_id orderId,
        customer,
        amount,
        payment_method paymentMethod,
        transaction_id transactionId,
        status,
        payment_date paymentDate
      FROM payments
      WHERE id = ?
    `).get(id);

    res.status(201).json({ payment });
  } catch (e) {
    sendError(res, e);
  }
});

/* =====================================================
   KARTAAI AGENT TOOLS
===================================================== */

const agentTools = [

  {
    type: 'function',

    name: 'get_sales',

    description:
      'Get the merchant current sales, orders, customers, growth and recent sales history.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'get_inventory',

    description:
      'Inspect all products and identify low-stock, slow-moving and fast-moving products.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'get_orders',

    description:
      'Get recent customer orders and their statuses.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'get_payments',

    description:
      'Get payment history, payment totals, pending amounts and failed payment counts for the merchant.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'get_customers',

    description:
      'Get customer frequency, orders, spending, favourites and customer type.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'get_offers',

    description:
      'Get current and scheduled offers for the merchant.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'get_market_context',

    description:
      'Get the latest available World Bank food-market context signal. Use only when the user asks about market trends.',

    parameters: {
      type: 'object',
      properties: {}
    }
  },

  {
    type: 'function',

    name: 'create_offer',

    description:
      'Prepare a promotional offer. This changes merchant data, so it ALWAYS requires merchant approval before execution.',

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
        'discount',
        'start',
        'end'
      ]
    }
  },

  {
    type: 'function',

    name: 'create_reorder',

    description:
      'Prepare a reorder for selected products. This changes merchant data, so it ALWAYS requires merchant approval before execution.',

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
      ]
    }
  }
];

/* =====================================================
   GEMINI TOOL SCHEMA CLEANER
===================================================== */

function cleanGeminiSchema(
  schema
) {

  if (
    !schema ||
    typeof schema !== 'object'
  ) {
    return schema;
  }

  const cleaned = {};

  if (schema.type) {
    cleaned.type =
      schema.type;
  }

  if (schema.description) {
    cleaned.description =
      schema.description;
  }

  if (
    Array.isArray(
      schema.required
    )
  ) {
    cleaned.required =
      schema.required;
  }

  if (
    Array.isArray(
      schema.enum
    )
  ) {
    cleaned.enum =
      schema.enum;
  }

  if (schema.items) {

    cleaned.items =
      cleanGeminiSchema(
        schema.items
      );
  }

  if (schema.properties) {

    cleaned.properties = {};

    for (
      const [
        key,
        value
      ]
      of Object.entries(
        schema.properties
      )
    ) {

      cleaned.properties[key] =
        cleanGeminiSchema(
          value
        );
    }
  }

  return cleaned;
}

/* =====================================================
   GEMINI TOOLS
===================================================== */

const geminiTools = [
  {
    functionDeclarations:
      agentTools.map(
        ({
          name,
          description,
          parameters
        }) => ({

          name,

          description,

          parameters:
            cleanGeminiSchema(
              parameters
            )
        })
      )
  }
];

/* =====================================================
   BUSINESS CONTEXT
===================================================== */

function agentBusinessContext(m) {

  return {

    business: {
      name:
        m.businessName,

      type:
        m.businessType,

      location:
        m.location
    },

    today:
      m.today,

    products:
      m.products.map(
        p => ({

          id:
            p.id,

          name:
            p.name,

          category:
            p.category,

          price:
            p.price,

          stock:
            p.stock,

          reorderLevel:
            p.reorderLevel,

          units:
            p.units,

          revenue:
            p.revenue,

          growth:
            p.growth,

          supplier:
            p.supplier
        })
      ),

    orders:
      m.orders.slice(
        0,
        12
      ),

    customers:
      m.customers,

    offers:
      m.offers,

    insight:
      m.insight
  };
}

/* =====================================================
   RUN AGENT TOOL
===================================================== */

async function runAgentTool(
  name,
  args,
  merchantId
) {

  const m =
    merchantBundle(
      merchantId
    );

  if (!m) {

    throw new Error(
      'Merchant not found'
    );
  }

  if (
    name ===
    'get_sales'
  ) {

    return {

      today:
        m.today,

      salesHistory:
        m.salesHistory.slice(
          -14
        ),

      insight:
        m.insight
    };
  }

  if (
    name ===
    'get_inventory'
  ) {

    const low =
      m.products.filter(
        p =>
          p.stock <=
          p.reorderLevel
      );

    const slow =
      m.products.filter(
        p =>
          p.growth < 0
      );

    const fast =
      [...m.products]
        .sort(
          (a, b) =>
            b.units -
            a.units
        )
        .slice(
          0,
          5
        );

    return {

      products:
        m.products,

      lowStock:
        low,

      slowMoving:
        slow,

      topProducts:
        fast
    };
  }

  if (
    name ===
    'get_orders'
  ) {

    return {
      orders:
        m.orders.slice(
          0,
          20
        )
    };
  }

  if (
    name ===
    'get_payments'
  ) {
    const payments = db.prepare(`
      SELECT
        id,
        order_id orderId,
        customer,
        amount,
        payment_method paymentMethod,
        transaction_id transactionId,
        status,
        payment_date paymentDate
      FROM payments
      WHERE merchant_id = ?
      ORDER BY datetime(payment_date) DESC, rowid DESC
      LIMIT 50
    `).all(merchantId);

    const summary = db.prepare(`
      SELECT
        COUNT(*) totalPayments,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END), 0) totalReceived,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) pendingAmount,
        COUNT(CASE WHEN status = 'Failed' THEN 1 END) failedPayments,
        COUNT(CASE WHEN status = 'Refunded' THEN 1 END) refundedPayments
      FROM payments
      WHERE merchant_id = ?
    `).get(merchantId);

    return {
      payments,
      summary
    };
  }

  if (
    name ===
    'get_customers'
  ) {

    return {
      customers:
        m.customers
    };
  }

  if (
    name ===
    'get_offers'
  ) {

    return {
      offers:
        m.offers
    };
  }

  if (
    name ===
    'get_market_context'
  ) {

    const url =
      'https://api.worldbank.org/v2/country/IND/indicator/AG.PRD.FOOD.XD?format=json&per_page=5';

    const response =
      await fetch(url);

    const data =
      await response.json();

    const latest =
      Array.isArray(data) &&
      data[1]?.find(
        x =>
          x.value !== null
      );

    return {

      available:
        true,

      provider:
        'World Bank',

      indicator:
        'Food Production Index (context signal)',

      latest:
        latest
          ? {
              year:
                latest.date,

              value:
                latest.value
            }
          : null,

      checkedAt:
        new Date().toISOString(),

      note:
        'Broad food-market context signal, not a retail edible-oil price.'
    };
  }
if (name === 'create_offer') {
  return {
    approvalRequired: true,
    action: 'create_offer',
    message:
      'Merchant approval required before creating this offer.',
    proposal: {
      name: args.name,
      products: args.products,
      discount: args.discount,
      start: args.start,
      end: args.end
    }
  };
}
if (name === 'create_reorder') {
  const products =
    m.products.filter(
      p =>
        Array.isArray(args.productIds) &&
        args.productIds.includes(p.id)
    );

  return {
    approvalRequired: true,
    action: 'create_reorder',
    message:
      'Merchant approval required before creating this reorder.',
    proposal: {
      productIds: args.productIds,
      products
    }
  };
}

  throw new Error(
    `Unknown agent tool: ${name}`
  );
}

/* =====================================================
   ACTUAL ACTION FUNCTIONS
===================================================== */

function createOfferNow(
  merchantId,
  args
) {

  const id =
    `offer_${crypto.randomUUID()}`;

  db.prepare(`
    INSERT INTO offers
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(

    id,

    merchantId,

    args.name,

    args.products,

    args.discount,

    args.start,

    args.end,

    'Draft',

    'KartaAI'
  );

  db.prepare(`
    INSERT INTO activity
    (merchant_id,text)
    VALUES (?,?)
  `).run(

    merchantId,

    `KartaAI created offer: ${args.name}`
  );

  return db
    .prepare(`
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
    `)
    .get(id);
}

function createReorderNow(
  merchantId,
  productIds
) {

  const result =
    db.prepare(`
      INSERT INTO reorders
      (merchant_id,product_ids)
      VALUES (?,?)
    `).run(

      merchantId,

      JSON.stringify(
        productIds
      )
    );

  db.prepare(`
    INSERT INTO activity
    (merchant_id,text)
    VALUES (?,?)
  `).run(

    merchantId,

    `KartaAI created reorder request for ${productIds.length} products`
  );

  return {

    id:
      result.lastInsertRowid,

    status:
      'Requested',

    productIds
  };
}

/* =====================================================
   KARTA AI - GEMINI BUSINESS ASSISTANT
===================================================== */

app.post('/api/ai/chat', async (req, res) => {

  try {

    const {
      merchantId,
      message,
      conversationId
    } = req.body;

    const userMessage =
      String(message || '').trim();

    console.log(
      'KartaAI request:',
      userMessage
    );

    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (!userMessage) {
      throw new Error(
        'Please enter a message.'
      );
    }

    const m =
      merchantBundle(merchantId);

    if (!m) {
      throw new Error(
        'Merchant not found.'
      );
    }

    if (!gemini) {
      throw new Error(
        'Gemini AI is not configured. Check GEMINI_API_KEY in .env.'
      );
    }

    const GEMINI_CHAT_MODEL =
      process.env.GEMINI_MODEL ||
      'gemini-3.8-flash';

    /* =============================================
       PERSISTED CHAT CONTEXT
    ============================================= */

    let activeConversationId = String(conversationId || '').trim();

    if (activeConversationId) {
      const chat = db.prepare(`
        SELECT id
        FROM chat_conversations
        WHERE id = ? AND merchant_id = ?
      `).get(activeConversationId, merchantId);

      if (!chat) {
        throw new Error('Conversation not found for this merchant.');
      }
    } else {
      activeConversationId = crypto.randomUUID();

      db.prepare(`
        INSERT INTO chat_conversations
        (id, merchant_id, title)
        VALUES (?, ?, ?)
      `).run(
        activeConversationId,
        merchantId,
        userMessage.slice(0, 60) || 'New Chat'
      );
    }

    const previousMessages = db.prepare(`
      SELECT role, content
      FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY id ASC
      LIMIT 30
    `).all(activeConversationId);

    db.prepare(`
      INSERT INTO chat_messages
      (conversation_id, role, content)
      VALUES (?, 'user', ?)
    `).run(activeConversationId, userMessage);

    db.prepare(`
      UPDATE chat_conversations
      SET
        title = CASE
          WHEN title = 'New Chat' THEN ?
          ELSE title
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userMessage.slice(0, 60) || 'New Chat', activeConversationId);


    /* =============================================
       KARTA AI BUSINESS INTELLIGENCE PROMPT
    ============================================= */

    const instructions = `

You are KartaAI, an AI business assistant for
small and medium-sized businesses in India.

Your job is to help merchants:

- understand their business
- make business decisions
- analyze their existing business data
- plan new businesses
- create practical business roadmaps
- improve sales
- manage inventory
- understand customers
- plan marketing
- estimate costs and revenue
- identify risks
- plan business growth

You are NOT just a normal chatbot.

You are a practical business planning assistant.

--------------------------------------------------
LANGUAGE
--------------------------------------------------

Answer in the same language style as the user.

If the user speaks:
- English → English
- Hindi → Hindi
- Hinglish → Hinglish

Do not unnecessarily switch languages.

--------------------------------------------------
IMPORTANT DATA RULE
--------------------------------------------------

NEVER invent real business data.

Never make up:

- sales
- inventory
- customers
- orders
- prices
- profits
- competitors
- market statistics
- supplier information

If the information is not available:

1. Clearly say that it is an estimate or assumption.
2. Ask the user for the missing information when necessary.

--------------------------------------------------
BUSINESS ROADMAP MODE
--------------------------------------------------

If the user asks for:

- business idea
- business plan
- how to start a business
- roadmap
- startup plan
- new business
- business model
- investment plan
- business strategy
- shop/business setup
- "I have ₹X, what business should I start?"
- "I want to start a bakery/grocery/cafe/etc."
- "make a complete plan"

then activate BUSINESS ROADMAP MODE.

The goal is to create a practical step-by-step roadmap.

--------------------------------------------------
STEP 1 — COLLECT REQUIRED INFORMATION
--------------------------------------------------

Before creating a detailed roadmap, determine whether
you know these important inputs:

1. Business type
2. Location/city
3. Available budget
4. Business model
   - physical shop
   - online
   - home-based
   - service
   - manufacturing
   - hybrid
5. Target customer
6. User's experience/skills if relevant

If the user has already provided these details,
DO NOT ask for them again.

If important information is missing, ask only the
minimum necessary questions.

Example:

"Great. I can build the roadmap. I just need:

1. City/location?
2. Approximate budget?
3. Shop, online, or home-based?"

Do not ask 10 questions at once.

--------------------------------------------------
BUSINESS ROADMAP OUTPUT
--------------------------------------------------

Once enough information is available, create:

# 🚀 BUSINESS ROADMAP

## 1. Business Concept

Explain:

- What the business does
- Main customer problem
- How the business makes money
- Suggested business model

## 2. Target Customers

Identify:

- Primary customers
- Secondary customers
- Customer needs
- Buying behavior

## 3. Market Opportunity

Explain:

- likely demand drivers
- relevant customer segments
- important local considerations

Do not claim exact market size unless reliable
data is available.

Clearly label assumptions.

## 4. Competition Strategy

Explain:

- common competitors/business alternatives
- how the user can differentiate
- possible USP

Never invent specific competitors.

If actual competitor information is unavailable,
say:

"Local competitor research is required."

## 5. Startup Investment

Create an estimated budget.

Example format:

| Category | Estimated Amount |
|----------|------------------|
| Setup | ₹XX,XXX |
| Equipment | ₹XX,XXX |
| Initial Inventory | ₹XX,XXX |
| Marketing | ₹XX,XXX |
| Licenses/Compliance | ₹XX,XXX |
| Working Capital | ₹XX,XXX |

Always clearly label these as:

"Estimated starting budget"

unless the user supplied exact numbers.

The total must remain within the user's stated budget
when creating a suggested allocation.

## 6. Products / Services

Recommend:

- core products/services
- optional products
- high-demand possibilities
- possible premium offerings

Do not claim that a product is guaranteed to sell.

## 7. Pricing Strategy

Explain:

- cost-based pricing
- competitor-aware pricing
- introductory pricing
- premium options where appropriate

If actual costs are unknown,
give formulas and example assumptions.

## 8. Revenue Model

Explain:

- how money will be generated
- average transaction assumption
- estimated customers/orders
- revenue calculation

Use formulas.

Example:

Daily revenue =
Average order value × Orders per day

Monthly revenue =
Daily revenue × Operating days

Clearly label all assumptions.

## 9. Monthly Expenses

Consider:

- rent
- salaries
- electricity
- inventory
- delivery
- marketing
- software
- maintenance
- other operating expenses

Do not invent exact costs without user inputs.

Use estimates or ask for missing information.

## 10. Break-Even Analysis

Explain:

Break-even point =
Fixed Costs ÷ Contribution Margin

If exact numbers are unavailable,
show an example calculation using clearly labelled
assumptions.

Never present an estimate as guaranteed.

## 11. Marketing Strategy

Create:

### Pre-launch
- branding
- social media
- local awareness
- customer research

### Launch
- opening campaign
- introductory offer
- customer acquisition

### After launch
- referrals
- WhatsApp marketing
- social media
- loyalty program
- repeat purchases

## 12. Operations Plan

Explain:

- suppliers
- inventory
- daily operations
- order management
- customer service
- payment methods
- delivery if applicable

## 13. Legal / Compliance Checklist

Mention relevant categories such as:

- business registration
- GST where applicable
- local permissions
- FSSAI for applicable food businesses
- shop/trade permissions where applicable

Do not claim a specific license is required unless
the business/location information supports it.

## 14. Risk Analysis

Create:

| Risk | Possible Impact | Mitigation |
|------|-----------------|------------|

Include realistic business risks.

## 15. 30-Day Roadmap

Break the first month into weekly actions.

### Week 1
Research + validation

### Week 2
Setup + suppliers

### Week 3
Marketing + preparation

### Week 4
Launch + measurement

Make actions specific.

## 16. 60-Day Roadmap

Focus on:

- improving operations
- measuring sales
- identifying best-selling products
- improving customer acquisition
- reducing unnecessary costs

## 17. 90-Day Roadmap

Focus on:

- optimization
- repeat customers
- profitability
- expansion opportunities
- automation
- scaling

## 18. KPIs

Recommend measurable KPIs such as:

- daily sales
- monthly revenue
- average order value
- customer acquisition
- repeat customer rate
- gross margin
- inventory turnover
- stock-outs
- customer retention

## 19. Growth Strategy

Give possible stages:

START
↓
VALIDATE
↓
LAUNCH
↓
FIRST CUSTOMERS
↓
OPTIMIZE
↓
PROFITABILITY
↓
SCALE

Only recommend expansion after sufficient evidence.

## 20. Immediate Next Steps

End with:

### "What you should do next"

Give the first 3-5 actions the user should take.

Make them practical and executable.

--------------------------------------------------
FINANCIAL SAFETY
--------------------------------------------------

Never promise:

- guaranteed profit
- guaranteed revenue
- guaranteed customers
- guaranteed success

Use:

- estimate
- assumption
- scenario
- example
- potential

when appropriate.

--------------------------------------------------
EXISTING MERCHANT MODE
--------------------------------------------------

If the user asks about their EXISTING business,
use the available KartaAI tools.

Available tools include:

- get_sales
- get_inventory
- get_orders
- get_payments
- get_customers
- get_offers
- get_market_context

Use tools when the question requires actual
merchant data.

Do not invent merchant information.

--------------------------------------------------
ACTIONS
--------------------------------------------------

Creating offers or reorders changes merchant data.

Therefore:

NEVER claim that an offer or reorder was created
unless the server actually executed it.

For create_offer and create_reorder:

prepare a proposal and clearly tell the merchant
that approval is required.

--------------------------------------------------
MARKET INFORMATION
--------------------------------------------------

Use market tools only when relevant.

If using broad World Bank market information,
clearly state that it is a broad market context signal
and NOT a direct local retail price.

--------------------------------------------------
ANSWER STYLE
--------------------------------------------------

Be:

- practical
- structured
- concise
- friendly
- business-focused

Use headings, bullets and tables where useful.

Do not write huge walls of text.

For a detailed roadmap, however, provide enough
information for the user to actually execute it.

--------------------------------------------------
CURRENT MERCHANT DATA
--------------------------------------------------

${JSON.stringify(agentBusinessContext(m))}

`;


    /* =============================================
       GEMINI INITIAL REQUEST
    ============================================= */

    const historyContents = previousMessages.map((item) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(item.content || '') }]
    }));

    historyContents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    let contents = historyContents;


    let response =
      await gemini.models.generateContent({

        model:
          GEMINI_CHAT_MODEL,

        contents,

        config: {

          systemInstruction:
            instructions,

          tools:
            geminiTools

        }

      });


    /* =============================================
       TOOL LOOP
    ============================================= */

    let toolsUsed = 0;

    for (
      let round = 0;
      round < 4;
      round++
    ) {

      const calls =
        Array.isArray(
          response.functionCalls
        )
          ? response.functionCalls
          : [];

      if (!calls.length) {
        break;
      }


      const modelContent =
        response.candidates?.[0]?.content;

      if (modelContent) {

        contents.push(
          modelContent
        );

      }


      const functionResponses = [];


      for (
        const call of calls
      ) {

        const args =
          call.args &&
          typeof call.args === 'object'
            ? call.args
            : {};


        console.log(
          'Gemini tool:',
          call.name,
          args
        );


        const result =
          await runAgentTool(
            call.name,
            args,
            merchantId
          );


        toolsUsed++;


        functionResponses.push({

          functionResponse: {

            name:
              call.name,

            response:
              result,

            ...(call.id
              ? {
                  id:
                    call.id
                }
              : {})

          }

        });

      }


      contents.push({

        role:
          'user',

        parts:
          functionResponses

      });


      response =
        await gemini.models.generateContent({

          model:
            GEMINI_CHAT_MODEL,

          contents,

          config: {

            systemInstruction:
              instructions,

            tools:
              geminiTools

          }

        });

    }


    /* =============================================
       FINAL RESPONSE
    ============================================= */

    const text =
      typeof response.text === 'string'
        ? response.text.trim()
        : 'I could not generate a response.';


    if (!text) {

      throw new Error(
        'Gemini returned an empty response.'
      );

    }


    /* =============================================
       SAFE HTML
    ============================================= */

    const html =
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
          /\n/g,
          '</p><p>'
        );


    db.prepare(`
      INSERT INTO chat_messages
      (conversation_id, role, content)
      VALUES (?, 'model', ?)
    `).run(activeConversationId, text);

    db.prepare(`
      UPDATE chat_conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(activeConversationId);

    console.log(
      'KartaAI Gemini response received.'
    );


    res.json({

      conversationId: activeConversationId,

      text,

      html:
        `<p>${html}</p>`,

      agent:
        true,

      provider:
        'Gemini',

      model:
        GEMINI_CHAT_MODEL,

      toolsUsed

    });


  } catch (e) {

    console.error(
      '========== KARTA AI GEMINI ERROR =========='
    );

    console.error(
      'Message:',
      e?.message
    );

    console.error(
      'Full error:',
      e
    );

    console.error(
      'Gemini key loaded:',
      !!process.env.GEMINI_API_KEY
    );

    console.error(
      'Gemini model:',
      process.env.GEMINI_MODEL ||
      'gemini-3.8-flash'
    );

    console.error(
      '============================================'
    );


    res.status(500).json({

      error:
        e?.message ||
        'Gemini AI request failed.'

    });

  }

});

/* =====================================================
   FALLBACK
===================================================== */

app.use(
  (req, res) =>
    res.sendFile(
      path.join(
        __dirname,
        'index.html'
      )
    )
);

/* =====================================================
   START SERVER
===================================================== */

app.listen(
  PORT,
  () =>
    console.log(
      `KartaAI running at http://localhost:${PORT}`
    )
);