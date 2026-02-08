# CLAUDE.md

## Project
api-finance-management — Backend API for personal finance tracker (INR)

## Repositories (Separate)
- **Frontend:** https://github.com/iamdivyeshtailor/finance-management
- **Backend (this repo):** https://github.com/iamdivyeshtailor/api-finance-management

## Tech Stack
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4
- **ODM:** Mongoose 8
- **Database:** MongoDB Atlas (free M0 cluster)
- **Hosting:** Render (free tier)

## Commands
```bash
npm install          # Install dependencies
npm run dev          # Start with nodemon (port 5000)
npm start            # Production start
```

## Code Style
- CommonJS modules (`require` / `module.exports`)
- camelCase filenames
- RESTful API routes, prefixed with `/api/`
- MVC pattern: Routes → Controllers → Models

## API Endpoints
- `GET/PUT /api/settings` — Budget configuration
- `GET/POST/PUT/DELETE /api/expenses` — Expense CRUD
- `GET /api/reports/current|monthly|history` — Financial reports
