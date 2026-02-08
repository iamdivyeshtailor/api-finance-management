# Finance Manager — Backend API

RESTful API for the Finance Manager app. Handles salary settings, expense tracking, and monthly report generation.

## Tech Stack

- Node.js 20 + Express 4
- MongoDB (Mongoose 8)
- CORS, dotenv

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/settings` | Get budget settings |
| PUT | `/api/settings` | Update budget settings |
| GET | `/api/expenses?month=M&year=Y` | Get expenses for a month |
| POST | `/api/expenses` | Add new expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/reports/current` | Current month live report |
| GET | `/api/reports/monthly?month=M&year=Y` | Specific month report |
| GET | `/api/reports/history` | All monthly summaries |

## Key Business Logic

- **Budget Month Cycle:** Month is determined by `salaryCreditDate`, not calendar month. If today < creditDate, expenses belong to the previous month's cycle.
- **Envelope Budgeting:** Salary is split into categories with limits. Overspending is allowed but tracked.
- **Single-user:** No authentication — designed for personal use.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

## Setup

```bash
git clone https://github.com/iamdivyeshtailor/api-finance-management.git
cd api-finance-management
npm install
```

Create a `.env` file:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finance-management
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

## Development

```bash
npm run dev
```

Server runs at `http://localhost:5000`

## Production

```bash
npm start
```

## Database Collections

- **settings** — Singleton document with salary, credit date, deductions, categories
- **expenses** — Individual expense entries with budget month/year
- **monthly_summaries** — Cached monthly report snapshots

## Related

- **Frontend:** [finance-management](https://github.com/iamdivyeshtailor/finance-management)
