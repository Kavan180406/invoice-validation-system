# InvoiceGuard
### Invoice Validation & Duplicate Detection System

InvoiceGuard is a full-stack web application designed to streamline invoice management through automated validation, duplicate detection, vendor management, and activity tracking.

## Key Features

- **Dashboard:** Centralized overview of invoice activities and system status.
- **Invoice Management:** Create, view, update, and delete invoices.
- **Vendor Management:** Manage vendor records and their status.
- **Invoice Validation:** Risk-based validation using predefined business rules.
- **Duplicate Detection:** Identify potential duplicate invoices using similarity scoring.
- **Review Workflow:** Allow administrators to confirm or dismiss duplicate matches.
- **Authentication:** JWT-based authentication with Admin and Staff roles.
- **Audit Trail:** Track important system activities using MongoDB.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Audit Logging | MongoDB |
| Authentication | JWT |
| API Documentation | Swagger UI |

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kavan180406/invoice-validation-system.git
cd invoice-validation-system
```

### 2. Start the Frontend

```bash
npm install
npm run dev
```

### 3. Start the Backend

Open a separate terminal:

```bash
cd backend
uvicorn app.main:app --reload
```

### Application URLs

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

> **Note:** Ensure PostgreSQL, MongoDB, and the required environment variables are configured before starting the application.

## System Workflow

1. Manage vendors and create invoices.
2. Validate invoice details and calculate risk scores.
3. Detect potential duplicates through similarity matching.
4. Review duplicate records through administrator actions.
5. Maintain an audit trail of important activities.

## Contributors

| Contributor | Responsibilities |
|---|---|
| **Kavan** | Frontend development, Next.js UI, dashboard design, invoice management pages, and frontend integration. |
| **Gokul** | Backend development, PostgreSQL database design, FastAPI APIs, and database integration. |

## Repository

**GitHub:** [Kavan180406/invoice-validation-system](https://github.com/Kavan180406/invoice-validation-system)

---

*InvoiceGuard — Bringing reliability, validation, and accountability to invoice management.*
