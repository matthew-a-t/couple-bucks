# Couple Bucks

A mobile-first Progressive Web App (PWA) designed for couples to collaboratively manage household finances.

## Features

- Quick expense logging with customizable quick-add buttons
- Two-user architecture with real-time sync
- Role-based permissions (Logger vs Manager)
- Bills management with reminders
- Flexible financial models
- Budget tracking and reporting
- PWA support for offline use

## Tech Stack

- **Frontend:** React + TypeScript
- **UI Components:** ShadCN/UI + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Build Tool:** Vite
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/       # Feature-based components
├── pages/           # Route-level pages
├── services/        # Data operations (Supabase)
├── hooks/           # Custom React hooks
├── context/         # Global state management
├── lib/             # Utilities and helpers
├── types/           # TypeScript definitions
└── assets/          # Images, icons
```

## License

Private project - All rights reserved
