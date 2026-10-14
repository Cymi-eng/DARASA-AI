# DARASA-AI — Adaptive Learning & School Management System

A modern, AI-powered education platform built with **React**, **Vite**, **Django**, and **Django REST Framework**. DARASA-AI is designed to support Kenya's Competency-Based Curriculum (CBC) by streamlining school administration, tracking learner performance, and providing AI-powered learning and teaching assistance.

---

## Features

### Authentication

- Secure JWT authentication
- Protected routes
- Role-based access control
- User profile management

### Dashboard

- School overview
- Student and classroom statistics
- Learner performance summaries
- Notifications
- Role-specific dashboards

### Student Management

- Student records
- Admission number management
- Classroom assignments
- Student portal
- Personalized AI learning assistance

### Teacher Management

- Teacher profiles
- Classroom management
- Student assessment tracking
- Learner support identification
- AI-powered teaching recommendations

### CBC Assessment

- Competency tracking
- Mastery levels (EE, ME, AE, BE)
- Learning-area performance
- Learner progress analysis

### Fee Management

- Fee payment tracking
- Payment status monitoring
- Transaction references
- Payment history
- Fee ledger and receipt support

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- React Router DOM
- Axios
- Lucide React

### Backend

- Python
- Django
- Django REST Framework
- Simple JWT
- SQLite for local development
- Configurable production database support

### Integrations

- OpenAI API for AI-powered features
- M-Pesa integration for fee payment workflows

---

## Project Structure

```text
DARASA-AI/
│
├── backend/
│   ├── config/
│   ├── core/
│   │   ├── models/
│   │   ├── views/
│   │   ├── serializers.py
│   │   ├── permissions.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   └── ...
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd DARASA-AI
```




## User Roles
- School Administrator
- Teacher
- Student

---

## Development Roadmap

### Phase 1

- Project setup
- Authentication and authorization
- School and student management
- Dashboard implementation

### Phase 2

- CBC competency assessment
- Teacher and student portals
- AI-powered learning assistance
- Classroom performance insights

### Phase 3

- Fee management and receipts
- Enhanced analytics and reporting
- Performance and security improvements

---

## Design

The platform focuses on a clean, responsive, and user-friendly interface with:

- Role-specific dashboards
- Intuitive navigation
- Assessment summaries
- Interactive learning tools
- Responsive layouts
- Clear data presentation

---

## License

This project is distributed under the MIT license 

---

## Author

Ian Cymi
