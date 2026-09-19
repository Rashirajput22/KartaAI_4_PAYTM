# KartaAI — Full-stack hackathon build

KartaAI now uses a lightweight production-style architecture:

**Browser UI → Express REST API → SQLite database → OpenAI Responses API + external market service**

## What is connected

- REST API for MSG91 OTP verification and merchant onboarding
- SQLite persistence for merchants, products, orders, customers, offers, activity and reorder requests
- AI chat through the server-side OpenAI SDK (API key never goes into browser code)
- External World Bank market-context API
- Offer creation + publishing persisted in the database
- Reorder requests persisted in the database
- New merchant onboarding persisted in the database
- `/api/health` endpoint for deployment checks
- Existing UI retained; if the AI key is missing, the app gracefully falls back to built-in demo answers

## Run locally (Node.js 22+)

```powershell
npm install
copy .env.example .env
# edit .env and add OPENAI_API_KEY
npm start
```

Open **http://localhost:3000**.

Authentication uses real MSG91 OTP. Demo OTP login is no longer used.

## Environment variables

```env
PORT=3000
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.5
MSG91_AUTHKEY=your_msg91_authkey
MSG91_WIDGET_ID=36696d676742373539353374
MSG91_WIDGET_TOKEN=your_msg91_widget_token
```

The OpenAI JavaScript SDK is used only on the backend. The official SDK documents the Responses API as its primary API and warns against exposing secret API keys in browser code. See the official OpenAI Node library documentation for deployment/API details.

## Suggested deployment

- Backend + static frontend: Render, Railway, Fly.io, or a VPS
- Database: keep SQLite for the hackathon/demo; move to PostgreSQL when multiple production instances are needed
- Secrets: configure `OPENAI_API_KEY` in the host's environment settings, never in `app.js`

## API routes

- `POST /api/auth/login`
- `GET /api/merchants/:id`
- `POST /api/merchants`
- `POST /api/ai/chat`
- `POST /api/offers`
- `POST /api/offers/:id/publish`
- `POST /api/reorders`
- `POST /api/activity`
- `GET /api/market/edible-oils`
- `GET /api/health`

## Real SMS OTP with MSG91

KartaAI now supports real mobile OTP authentication through the MSG91 OTP Widget.

### MSG91 values
- Widget ID: `36696d676742373539353374`
- Put the MSG91 Authkey **only** in `.env` as `MSG91_AUTHKEY`.
- Put the OTP Widget token in `.env` as `MSG91_WIDGET_TOKEN`.
- `MSG91_WIDGET_TOKEN` is intentionally delivered to the browser because the MSG91 Web SDK requires it; the account Authkey is never sent to the browser.

### Before testing
1. In MSG91, keep the widget on SMS + India restriction.
2. For this web custom UI integration, disable **Invisible OTP** in the widget settings. MSG91's current widget docs note Invisible OTP is for mobile integration, while the web custom UI exposes `sendOtp` / `verifyOtp` methods.
3. Keep Captcha enabled. KartaAI renders the widget captcha into the login form.
4. In `.env`, fill in your real `MSG91_AUTHKEY` and the token you selected/created for the widget.

### Run
```bash
npm install
npm start
```
Then open `http://localhost:3000`.

### Auth flow
`Mobile number -> MSG91 Send OTP -> Verify OTP -> MSG91 access token -> KartaAI backend verifies access token -> existing merchant logs in / new merchant completes onboarding.`

The old demo OTP `1234` and demo merchant login have been removed from the authentication flow.
