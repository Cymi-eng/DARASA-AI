# DARASA-AI

### Smart Learning. Better Outcomes.

**Built for CBC Education | Kenya & East Africa**

DARASA-AI is a digital education platform designed to support Competency-Based Curriculum (CBC) implementation through adaptive learning, continuous assessment, learner progress tracking, and actionable educational insights.

The platform connects schools, teachers, learners, and school administrators through a unified system that helps monitor competency mastery, identify learning gaps, and improve learning outcomes.

---



## Overview

Education systems need reliable ways to monitor learner progress, support teachers, and manage school operations. DARASA-AI addresses these needs through a technology-driven platform designed around CBC learning and assessment.

The platform aims to reduce administrative workloads, improve visibility into learner performance, and help educators make informed decisions using learner data.

DARASA-AI is designed with the needs of Kenyan schools in mind, including the potential for offline-friendly workflows and integration with existing education systems.

## Vision

To empower every learner to reach their potential by making competency-based learning more measurable, accessible, and actionable.

## Key Features

### 1. CBC Learning and Assessment
- Organize learners around competency-based learning.
- Track competency assessments and mastery levels.
- Support learning areas relevant to the CBC framework.
- Identify competencies requiring additional attention.

### 2. Learner Progress Insights
- Monitor learner performance over time.
- Identify strengths and learning gaps.
- Present assessment information through dashboards.
- Support targeted intervention and personalized learning recommendations.

### 3. AI-Assisted Learning
- Provide an AI-assisted learning experience for learners.
- Help learners explore areas they find challenging.
- Support recommendations based on available learner assessment data.
- Provide a foundation for more personalized educational assistance.

*AI recommendations depend on the available data and configured AI services.*

### 4. Teacher Portal
- View learner and classroom information.
- Monitor competency mastery.
- Identify learners who may need additional support.
- Access assessment information to guide teaching decisions.

### 5. Student Portal
- Access a personalized learning dashboard.
- View available competency and progress information.
- Interact with the learning assistant when available.
- Review relevant school information and notifications.

### 6. School Administration
- Manage school-related records and learning operations.
- Support the management of students, teachers, classrooms, and competencies.
- Provide controlled access to school information based on user roles.

### 7. Fee Management
- Record and track school fee payments.
- Integrate with supported M-Pesa payment workflows.
- Track payment statuses, including pending, confirmed, and failed transactions.
- Maintain fee ledger information.
- Support payment history and receipts for eligible confirmed payments.

Payment confirmation and receipt availability depend on the configured payment integration and backend implementation.

### 8. Secure Authentication
- JWT-based authentication.
- Role-based access control.
- Protected API endpoints.
- School-scoped access to relevant records.
- Administrator-provisioned accounts for schools and learners.

---

## User Roles

DARASA-AI is designed to support role-specific experiences.

| Role | Purpose |
|---|---|
| Platform Administrator | Oversees supported platform-wide administration. |
| School Administrator | Manages school records and authorized users. |
| Teacher | Monitors learners, classrooms, assessments, and competency mastery. |
| Student | Accesses learning information, progress insights, and learning support. |
| Bursar | Manages fee payment records and financial information. |


The available screens and permissions depend on the current implementation and assigned user permissions.

### Account Registration Policy

DARASA-AI uses a controlled account provisioning model.

- Schools do not independently register through an unrestricted public registration flow.
- Student accounts are created by authorized school personnel or administrators.
- Users sign in using their assigned credentials.
- Access to protected resources is controlled by authentication and authorization rules.

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- Lucide React
- Axios

### Backend
- Python
- Django
- Django REST Framework
- Django REST Framework Simple JWT

### Database
- SQLite for local development where configured.
- Database connections can be configured using `DATABASE_URL`, including PostgreSQL-compatible deployments.

### Integrations
- M-Pesa payment services, where configured.
- OpenAI-powered assistance, where configured.
- REST APIs for frontend-backend communication.

### Deployment
- Frontend: compatible with platforms such as Vercel.
- Backend: compatible with platforms such as Render.
- Production database: PostgreSQL or another supported Django database configuration.

---

## Project Structure

```text
DARASA-AI/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── core/
│   │   ├── models/
│   │   ├── serializers/
│   │   ├── views/
│   │   ├── tests.py
│   │   └── ...
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── context/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

*The structure above is representative. Actual filenames may differ as the project evolves.*

---

## Getting Started

### Prerequisites

Install the following tools:

- Python 3.11 or another version supported by the project's dependencies.
- Node.js and npm.
- Git.
- A configured database.
- API credentials for external services you intend to enable.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd DARASA-AI
```

Replace `<YOUR_REPOSITORY_URL>` with your actual Git repository URL.

### 2. Set Up the Backend

Open a terminal in the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

If PowerShell blocks script activation, use the appropriate execution policy for your environment or invoke the virtual environment's Python directly.

### 3. Configure Backend Environment Variables

Create a local `.env` file or configure the variables in your deployment environment according to your settings implementation.

Typical configuration includes:

```env
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=replace-with-a-local-development-secret
DATABASE_URL=
OPENAI_API_KEY=
```

Additional variables may be required for M-Pesa credentials, allowed hosts, CORS, and production deployment.

**Never commit real secrets to Git.** Use a secret manager or environment variables in production.

### 4. Apply Database Migrations

```powershell
py manage.py migrate
```

### 5. Create an Administrator

```powershell
py manage.py createsuperuser
```

Follow the prompts to create an administrator account.

### 6. Check the Backend

```powershell
py manage.py check
py manage.py test core
```

Run these commands from the `backend` directory.

### 7. Start the Backend

```powershell
py manage.py runserver
```

The local development server normally runs at:

`http://127.0.0.1:8000/`

API routes may be available under `/api/`, depending on the configured URL patterns.

---

## Running the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
```

Create or update the frontend environment configuration as required by the API client.

For example, if the API client supports `VITE_API_BASE_URL`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Then start the development server:

```powershell
npm run dev
```

Vite will display the local URL in the terminal, commonly:

`http://localhost:5173/`

To validate the production frontend build:

```powershell
npm run build
```

The environment variable name must match the one actually read by the project's API configuration.



## Deployment

A typical deployment separates the frontend, backend, and database.

### Frontend
1. Connect the frontend repository to your hosting provider.
2. Configure the production API base URL.
3. Build the application using `npm run build`.
4. Deploy the generated production assets.

### Backend
1. Configure Python dependencies.
2. Set production environment variables.
3. Configure the production database.
4. Apply migrations.
5. Configure allowed hosts, CORS, HTTPS, and static files.
6. Start Django using a production-ready WSGI or ASGI server.

### Production Checklist

- [ ] `DEBUG=False`
- [ ] Secure production secret key configured
- [ ] Production database configured and backed up
- [ ] Migrations applied successfully
- [ ] CORS and allowed hosts restricted appropriately
- [ ] Frontend API URL points to the deployed backend
- [ ] Authentication tested with authorized accounts
- [ ] Role permissions verified
- [ ] Payment callbacks and transaction verification tested
- [ ] AI integrations configured or safely disabled
- [ ] Error monitoring and logging configured

---

## Future Improvements

Potential areas for continued development include:

- More advanced adaptive learning and personalized study plans.
- Expanded CBC competency analytics and reporting.
- Offline-first assessment capture and synchronization.
- Parent-facing learner progress reports.
- Improved school-level financial reporting.
- Additional payment reconciliation tools.
- Education-system integrations through documented APIs.
- Accessibility, localization, and low-bandwidth improvements.
- More comprehensive automated tests and deployment checks.

These are roadmap possibilities and should not be interpreted as features already delivered.

---

## Contributing

Contributions should follow the project's existing architecture and access-control requirements.

1. Create a feature branch.
2. Make a focused change.
3. Run relevant backend tests and frontend checks.
4. Review security and data-access implications.
5. Submit a pull request with a clear description of the change.

Example:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Describe your change"
git push -u origin feature/your-feature
```

---

## License

Add the applicable license and copyright information before distributing the project publicly.

Until a license is explicitly selected, all rights remain with the applicable copyright holder. Do not assume that the project is open-source merely because its source code is hosted in a Git repository.

---

**DARASA-AI — Smart Learning. Better Outcomes.**

*Advancing education through technology.*

## Author
#### Ian Cymi 
software developer
