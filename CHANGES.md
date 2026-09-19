# KartaAI — Updated Build

## Added
- Persistent server-side Chat History using SQLite.
- New Chat creates a separate conversation.
- Chat History page with open/delete/clear actions.
- Gemini receives the selected conversation history.
- Payment History page with search, status/date filters, pagination and summary cards.
- Payments table linked to merchants and orders.
- Demo payment records are automatically created from existing demo orders.
- KartaAI Gemini tool `get_payments` for payment summaries/history.

## Run
1. Open this project folder in VS Code.
2. Run `npm install` if dependencies are not already installed.
3. Start with `node server.js`.
4. Open `http://localhost:3000`.

Do not commit or publish `.env` because it contains private API configuration.
