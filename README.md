# FinSaathi

**An AI-Powered Personal Financial Planning and Decision Support System**

Your AI Financial Companion. A responsive, INR-first final-year AI/ML project with Next.js, Python Flask, MongoDB Atlas, explainable expense prediction and a Groq financial assistant.

## Overview and problem statement

Disconnected transaction lists make it difficult to connect daily spending with long-term plans. FinSaathi combines transparent financial calculations, statistical estimates and conversational explanations in one application. Every authenticated record belongs to one user. New accounts start empty; optional fictional demo data supports project demonstrations.

## Features and application modules

| Module | Capabilities |
| --- | --- |
| Public site | Product overview, features, how it works, privacy and terms |
| Authentication | Registration, login/logout, scrypt password hashes, HTTP-only JWT cookies, password changes |
| Onboarding | Profile, financial position, multiple debts/goals, investment preferences |
| Dashboard | Recorded cash flow, expense breakdown, budgets, goals, health, obligations and transactions |
| Transactions | CRUD, search, date/category/type filters, sorting, pagination, safe CSV export |
| Expense analyzer | Category, monthly, weekly and weekday/weekend totals, calculated insights |
| Expense prediction | Python least-squares regression or a labelled recent-average baseline |
| Budgets | Total/category limits, statuses, historical suggestions, copy previous month |
| Goals | Progress, required monthly savings, contributions, completion and overdue status |
| Debt Escape | Debt inventory, ratios, snowball/avalanche simulation, extra payment comparison |
| Investments | Holdings, declared monthly contributions, allocation and educational guidance |
| Financial health | Transparent reweighted factors, improvement actions, monthly snapshots |
| Alerts | Current-data thresholds, read/dismiss state and unread count |
| FinSaathi AI | Groq answers from the current user's financial summary, graceful unavailable state |
| Reports | Month/custom date range, financial summaries, charts, CSV and print/save-as-PDF |
| Settings | Profile/onboarding values, appearance, security, demo controls and financial-data reset |

Light, dark and system themes, responsive navigation, labelled forms, native modal focus handling, toasts and loading/empty/error states are included.

## Architecture

```text
Browser → Next.js / React / TypeScript
        → same-origin /api/*
        → Python Flask serverless function
          ├─ Authentication, validation and ownership filters
          ├─ Deterministic financial analytics
          ├─ Pandas aggregation + NumPy regression
          ├─ MongoDB Atlas (reused connection pool)
          └─ Groq (summary only, on demand)
```

One repository and one Vercel project host the frontend and Python API. No local persistence, background worker, paid authentication provider or bank integration is required.

## Technology stack

- Next.js 16, React 19, TypeScript, Tailwind CSS 4 and custom design tokens
- Recharts, Lucide, next-themes and Sonner
- Python 3.11+, Flask, PyMongo, PyJWT and Werkzeug scrypt
- Pandas and NumPy; ordinary least squares via `numpy.linalg.lstsq`
- MongoDB Atlas free cluster, Groq free-tier text API, Vercel Hobby
- npm, pytest, ESLint and TypeScript validation

## AI/ML components

1. **Deterministic analytics:** cash flow, ratios, shares, budget utilization, goals and debt amortization in `backend/analytics.py`.
2. **Statistical prediction:** monthly time-index regression using real expense records, with an honest recent-average fallback.
3. **Rule-based recommendations:** budget suggestions, score actions, investment considerations and alerts. These are not trained AI models.
4. **LLM assistant:** `backend/insights.py` calls Groq with a concise authenticated summary. Profile identifiers and raw transaction descriptions are excluded. Chat messages are sent as entered.

The default model is `openai/gpt-oss-20b`, verified available during implementation. Override `GROQ_MODEL` when availability changes. No paid fallback is configured.

## Financial Health Score

An educational indicator, not a credit score. It is unavailable without recorded income or expenses. Unavailable factors are excluded; applicable weights normalize to 100.

| Factor | Base weight | Formula (clamped to 0–1) |
| --- | ---: | --- |
| Savings rate | 25 | `(income − expenses) / income / 0.20` |
| Budget discipline | 20 | `1 − max(0, expenses − budget) / budget` |
| Debt management | 20 | `1 − monthly payments / income`; debt-free earns full credit |
| Emergency fund | 15 | `emergency fund / (6 × recorded monthly expenses)` |
| Goal progress | 10 | Average saved / target across recorded goals |
| Investment contributions | 10 | Declared monthly contributions / stated capacity |

Investment contributions are a declared-plan proxy, not verified payment consistency. Current-month snapshots update as records change; previous snapshots remain. Current balance/profile factors are not historical balances.

## Expense prediction

Pandas aggregates complete calendar months. The partial current month is excluded from training. Missing months between first records and the last completed month count as zero. Up to 24 months are used.

With at least four complete months, NumPy fits `expense = intercept + slope × month_index`. Otherwise, the mean of up to three recent complete months is a labelled baseline. The next month after the selected month is estimated, with nonnegative bounds. Results include history, method, sufficiency, category estimates and explanation.

No calibrated confidence interval, deep learning, guaranteed result or fabricated accuracy is claimed. Independent category clipping/rounding may differ from the total forecast.

## Local installation

Requirements: Node.js 22+ (tested on 24), npm, Python 3.11+ and MongoDB Atlas. Use an isolated Python environment.

```sh
git clone https://github.com/sathwiknagavelli9/FinSaathi.git
cd FinSaathi
npm ci
python -m venv .venv
```

```powershell
# Activate on Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```sh
# Activate on macOS / Linux
source .venv/bin/activate
```

```sh
python -m pip install -r requirements-dev.txt
```

Copy `.env.example` to `.env.local` and supply your values. Keep the virtual environment active when running development/Python test commands.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Server-only Atlas connection string with database name |
| `JWT_SECRET` | Server-only strong random signing secret, at least 32 bytes |
| `GROQ_API_KEY` | Server-only key; unavailable AI does not break other modules |
| `GROQ_MODEL` | Optional text model ID, default `openai/gpt-oss-20b` |

Never use `NEXT_PUBLIC_` for secrets. Never commit local environment files. `.env.example` contains placeholders only. Vercel's `VERCEL` flag enables secure cookies.

## MongoDB Atlas configuration

Use a free cluster, a database-scoped application user and network access permitting development and deployed Vercel connections. Choose network settings appropriate to your account; the app does not change Atlas rules. Include the database name in the URI.

First use creates unique email/month-category budget/alert-key indexes, per-user and transaction-date indexes, monthly score/prediction indexes and TTL-based rate-limit expiry. Serverless instances reuse a bounded connection pool.

## Running locally

```sh
npm run dev
```

Open `http://localhost:3000`. A development-only rewrite proxies `/api/*` to Flask on port 5328. Production uses Vercel same-origin routing, never localhost. `npm start` alone serves the built frontend; use `npm run dev` for the complete local stack.

## Tests and checks

```sh
npm run lint
npm run typecheck
npm run test:python
npm run build
python -m scripts.integration_check
```

The integration script creates disposable Atlas accounts, exercises major flows and user isolation, and deletes only its own test records. It separately reports live Groq availability.

```sh
python -m scripts.integration_check https://YOUR-PROJECT.vercel.app
```

For deployed tests, the local URI must target the same database so cleanup succeeds.

## Vercel deployment

Use an existing **Hobby** account. No paid integrations are required.

```sh
vercel link
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add GROQ_API_KEY production
vercel env add GROQ_MODEL production
vercel --prod
```

Enter secrets through stdin/the secure prompt. Configure Preview similarly. Connect the existing GitHub repository for `main` deployments. The Next.js rewrite maps API requests to `api/index.py`; `requirements.txt` defines Python dependencies.

## Project structure

```text
app/                 Public pages, onboarding and authenticated routes
components/          UI, charts, forms and financial screens
lib/                 API client, currency utilities and TypeScript types
api/index.py         Vercel Python function entry point
backend/
  app.py             Flask app and sanitized errors
  auth.py            JWT, cookies, passwords, origin checks, rate limits
  db.py              Connection reuse, indexes, serialization
  validation.py      Numeric/date/enum/input validation
  records.py         Owned CRUD, contributions, CSV, budget copying
  analytics.py       Financial mathematics and statistical prediction
  insights.py        Summaries, alerts, score history and Groq
  demo.py            Explicit demo loading and reset controls
tests/               Calculation, validation and authentication tests
scripts/             Real-database integration checks
```

## Security

- Scrypt password hashes; HTTP-only, SameSite=Lax cookies, Secure on Vercel.
- JWT expiry, issuer, audience and auth-version checks. Password changes/logout invalidate earlier sessions.
- JSON-only mutations and cross-origin browser request rejection.
- Authenticated user ID in every owned query; browser-supplied ownership is ignored.
- Validated ObjectIds, amounts, dates, enums and lengths; compare-and-set goal contributions.
- MongoDB-backed authentication/AI rate limits with TTL expiry.
- CSV formula-injection escaping; no-cache API responses and sanitized errors.
- Secrets only in ignored local environment files and Vercel environment variables.

## Demo data

Settings → **Load demo data** adds seven months of fictional income/expenses, budgets, goals, debts and investments to an empty workspace. Every record has `demo: true` and the current user ID. Profile values are preserved. Remove demo records separately, or type `RESET` to clear all financial records/chat history while preserving account/profile.

## Limitations

- Educational prototype, not a regulated advisory or banking service.
- Manual entry/CSV export; CSV import, OCR, government schemes and family accounts are intentionally absent.
- No email verification/password-reset email service or administrator console.
- INR is currently supported; the formatting utility accepts a future currency parameter.
- Recurring records are labelled, not automatically posted.
- Debt simulation assumes fixed APR, monthly interest and constant payment capacity; fees and changing rates are excluded.
- Profile estimates are not silently treated as recorded assets or cash flow.
- Goal contributions do not automatically create transactions.
- PDF export uses the browser print dialog's “Save as PDF”.
- Free-tier limits/provider outages can interrupt AI while other tools remain available.
- No bank feeds, trades, guaranteed predictions or live market prices.

## Future improvements

Verified email recovery, transaction-to-goal linking, forecast backtesting, verified investment contribution history, more currencies and a reviewed CSV import flow.

## Financial disclaimer

**FinSaathi provides educational financial insights and does not provide professional investment advice.** Verify records and assumptions and consult a qualified professional for consequential decisions. Forecasts, scores and simulations are estimates, not guarantees.
