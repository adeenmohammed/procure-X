# Procure-X 🌾

### Smart Farmer Procurement & Queue Management System

Procure-X is a web application concept designed to streamline agricultural procurement by helping farmers manage their visits to procurement centres and helping centre staff coordinate daily operations.

The goal is to make procurement more transparent, reduce unnecessary waiting, and provide better visibility into queue status.

## 🚜 The Problem

Farmers visiting procurement centres may face long queues, uncertain waiting times, and limited visibility into the number of farmers ahead of them. Procurement staff also need a convenient way to manage arrivals, inspections, and procurement records.

## 💡 Our Solution

Procure-X aims to connect farmers and procurement-centre staff through a centralized platform with role-based access and queue visibility.

## ✨ Key Features

- **Farmer Portal** — Access farmer-facing procurement services.
- **Live Queue Visibility** — View queue information and farmers ahead in the queue, subject to live backend integration.
- **Token and Slot Management** — Organize procurement visits and queue entries.
- **Inspection Workspace** — Support inspection and quality-grading workflows.
- **Procurement Tracking** — View procurement status and relevant records.
- **Role-Based Access** — Separate experiences for farmers, field agents, procurement officers, and administrators.
- **Backend API** — Centralize application data and business logic.
- **Containerized Setup** — Use Docker Compose to simplify local development.

> Feature availability depends on the current implementation and configuration. See the project issues and documentation for known limitations.

## 🧰 Technology Stack

Update this list to match the actual dependencies in the repository.

- **Frontend:** React, TypeScript, Vite
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **API Documentation:** OpenAPI / Swagger UI
- **Authentication:** JWT-based authentication and role-based authorization
- **Real-time Updates:** WebSockets, where configured
- **Deployment / Development:** Docker and Docker Compose

## 🏗️ Architecture

```text
Farmer / Procurement Staff
            |
            v
     React Frontend
            |
            v
       FastAPI API
        /       \
       v         v
 PostgreSQL   WebSockets
```

The frontend communicates with the backend API. The backend handles application workflows and data persistence, while WebSockets can be used to deliver real-time updates.

## 🚀 Getting Started

### Prerequisites

- Git
- Docker Engine
- Docker Compose plugin

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/procure-x.git
cd procure-x
```

### 2. Configure environment variables

If the project includes an `.env.example` file, copy it:

```bash
cp .env.example .env
```

Edit `.env` and configure the required values. Never commit production secrets or real credentials.

### 3. Start the application

From the directory containing `compose.yaml` or `docker-compose.yml`, run:

```bash
docker compose up --build -d
```

Check the container status:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs -f
```

### 4. Open the application

For the default local configuration:

- Frontend: http://localhost:5173
- Backend API documentation: http://localhost:8001/docs

These addresses may differ if your Compose configuration uses different ports.

### 5. Stop the application

```bash
docker compose down
```

This stops and removes the Compose containers and network. Persistent database volumes are retained unless explicitly removed.

## 🔐 Demo Accounts

If demo accounts are enabled in your local configuration, the following accounts may be available:

| Role                | Login identifier | Password |
| ------------------- | ---------------- | -------- |
| Farmer              | `9000000001`     | `123456` |
| Field Agent         | `9000000002`     | `123456` |
| Procurement Officer | `9000000003`     | `123456` |
| Admin               | `9000000006`     | `123456` |

**Important:** Verify these credentials against the current backend before publishing. They are for local demonstration only and must never be used as production credentials.

## 🗂️ Project Structure

The repository may contain the following components; adjust this section to match the actual folder layout.

```text
procure-x/
├── frontend/
├── backend/
├── compose.yaml
├── .env.example
├── .gitignore
└── README.md
```

## 🛣️ Future Improvements

- More comprehensive automated tests
- Production-grade authentication and account management
- Improved audit trails and procurement reporting
- Notifications for queue changes
- Deployment with HTTPS and production configuration
- Stronger validation and error handling
- Performance and accessibility improvements

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request describing the changes.

## 📄 License

This project is intended for educational, hackathon, and portfolio use. See the repository's `LICENSE` file for the applicable terms.

## 👨‍💻 Project

**Procure-X — Smart Farmer Procurement & Queue Management System**

Built to explore how software can improve visibility, coordination, and efficiency in agricultural procurement.
