# Phase One Web Application

This project is a freelance web application initialized with a full-stack structure similar to the AiCon 2026 conference portal. It provides standard configuration boilerplate for frontend and backend development.

## 🚀 Setup & Local Development

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Database Synchronization
Set up your PostgreSQL database connection in a local `.env` file (see `.env.example` for details) and run the following command to sync your database schema:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to your database
npm run db:push
```

### 3. Running Development Server
Start the development server:
```bash
npm run dev
```

The web application runs locally at `http://localhost:5173`.

## 📁 Directory Structure

```
├── api/                   # Backend Serverless API routes (for hosting platforms like Vercel)
│   ├── ad/                # Admin authentication & data management routes
│   └── register/          # Registration endpoint handlers
├── lib/                   # Shared backend utility libraries
│   ├── auth.js            # JWT verification & header authentication helpers
│   └── prisma.js          # Shared Prisma database client instance
├── prisma/                # Prisma configuration & SQLite/PostgreSQL schemas
│   └── schema.prisma      # Central model definition
├── public/                # Public assets (images, icons, etc.)
└── src/                   # React Frontend source
    ├── components/        # Reusable component files grouped by context
    │   ├── admin/         # Components specific to Admin views
    │   ├── layout/        # Site-wide layouts (Navbar, Footer, etc.)
    │   ├── registration/  # Multi-step forms & inputs
    │   └── ui/            # UI kit primitives (Button, Card, inputs, etc.)
    ├── data/              # Static mock data, pricing configs, & text constants
    ├── hooks/             # Custom React Hooks
    ├── pages/             # Route-level views (Home, About, Admin, Contact)
    ├── styles/            # Tailwind base & global styles
    ├── types/             # Common TypeScript interfaces & type aliases
    └── utils/             # Frontend helper utilities (Axios API configuration, Auth session helpers)
```