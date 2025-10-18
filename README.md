# Couple Bucks 💰

A mobile-first Progressive Web App (PWA) for couples to collaboratively manage household finances.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Supabase](https://img.shields.io/badge/Supabase-2.39-3ecf8e)

## 🎉 Status: Complete - Ready for Testing!

All 10 development phases are complete! The app is fully functional and ready for comprehensive testing and deployment.

### ✅ Implemented Features

- **Authentication & Onboarding**: Complete signup/login flow with 5-step onboarding
- **Expense Management**: Quick-add buttons, expense tracking, real-time sync
- **Budget Tracking**: Visual progress indicators with color-coded status (Manager only)
- **Bill Management**: Recurring bill tracking with status indicators
- **Reports & Analytics**: Spending by category/partner, CSV export (Manager only)
- **Settings**: Profile management, couple pairing, notification preferences
- **PWA Features**: Offline support, install prompt, background sync
- **Real-time Sync**: Instant updates between partners via Supabase subscriptions

---

## ✨ Key Features

### Permission System
- **Logger (Tier 1)**: Log expenses, view summaries, manage bills
- **Manager (Tier 2)**: All Logger features + budgets, reports, full settings access

### Progressive Web App
- **Installable**: Add to home screen on mobile/desktop
- **Offline Mode**: Queue expenses offline, auto-sync when reconnected
- **Service Workers**: Fast loading with intelligent caching

### Real-time Collaboration
- Changes sync instantly between partners
- Live expense updates
- Budget progress reflects immediately
- Bill status updates in real-time

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- Modern browser with PWA support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/couple-bucks-finance-app.git
   cd couple-bucks-finance-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these values from your Supabase project dashboard at https://app.supabase.com

4. **Set up the database**

   Run the migration in Supabase SQL Editor:
   - Copy contents of `supabase/migrations/20250118000000_initial_schema.sql`
   - Paste into Supabase SQL Editor
   - Execute the migration

5. **Enable real-time subscriptions** (in Supabase dashboard)
   - Go to Database → Replication
   - Enable for tables: `expenses`, `budgets`, `bills`

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📁 Project Structure

```
couple-bucks-finance-app/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication & ProtectedRoute
│   │   ├── budgets/        # Budget management UI
│   │   ├── bills/          # Bill tracking UI
│   │   ├── expenses/       # Expense logging UI
│   │   ├── shared/         # Reusable components (BottomNav, etc.)
│   │   └── ui/             # ShadCN UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities
│   │   ├── supabase.ts    # Supabase client
│   │   ├── utils.ts       # Helper functions
│   │   └── offlineQueue.ts # Offline sync manager
│   ├── pages/              # Page components
│   │   ├── auth/          # Login, Signup, Reset Password
│   │   ├── onboarding/    # 5-step onboarding flow
│   │   ├── dashboard/     # Main dashboard
│   │   ├── expenses/      # Expense management
│   │   ├── budgets/       # Budget tracking
│   │   ├── bills/         # Bill management
│   │   ├── reports/       # Analytics & CSV export
│   │   └── settings/      # User settings & profile
│   ├── services/           # API service layer
│   │   ├── auth.ts        # Authentication operations
│   │   ├── expenses.ts    # Expense CRUD
│   │   ├── budgets.ts     # Budget operations
│   │   ├── bills.ts       # Bill management
│   │   ├── couples.ts     # Couple pairing
│   │   └── storage.ts     # File uploads
│   ├── store/              # Zustand state management
│   │   ├── authStore.ts   # Auth state with persistence
│   │   └── coupleStore.ts # Couple data with real-time sync
│   ├── types/              # TypeScript types
│   │   ├── database.ts    # Database types
│   │   ├── schemas.ts     # Zod validation schemas
│   │   └── index.ts       # Shared types
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Entry point with ErrorBoundary
│   └── index.css           # Global styles & brand colors
├── supabase/
│   └── migrations/         # Database migrations
├── CLAUDE.md               # Development guidelines
├── TESTING.md              # Comprehensive testing guide
├── README.md               # This file
├── vite.config.ts          # Vite + PWA configuration
└── package.json            # Dependencies
```

---

## 🛠️ Development

### Available Commands

```bash
npm run dev      # Start development server
npm run build    # Type check + production build
npm run preview  # Preview production build
npm run lint     # Run ESLint (zero warnings policy)
npm run format   # Format code with Prettier
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript (strict mode)
- Vite for blazing-fast builds
- Tailwind CSS for styling
- ShadCN/UI component library (Radix UI)
- React Router v6 for navigation
- Zustand for state management
- React Hook Form + Zod for forms

**Backend:**
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- Row Level Security (RLS) for data privacy
- Real-time subscriptions for live sync

**PWA:**
- vite-plugin-pwa
- Workbox for service workers
- Background sync for offline mode
- Install prompt handling

### Architecture Patterns

**Service Layer:** All database operations go through `/src/services/` for easy future API integrations

**State Management:**
- Auth Store: Session, profile, partner info (persisted)
- Couple Store: Expenses, budgets, bills (real-time subscriptions)

**Code Style:**
- TypeScript strict mode
- ESLint with zero warnings
- Prettier for formatting
- Path aliases: `@/` for `src/`

---

## 🧪 Testing

See **[TESTING.md](./TESTING.md)** for comprehensive testing procedures including:
- ✅ Accessibility testing (WCAG 2.1 AA)
- ✅ Responsive design testing (mobile/tablet/desktop)
- ✅ Browser compatibility checklist
- ✅ Critical user flows
- ✅ Real-time sync testing
- ✅ Offline mode testing
- ✅ Security testing
- ✅ Pre-deployment checklist

### Quick Manual Test

1. Sign up two accounts in separate browsers/devices
2. Complete onboarding for both users
3. Have one create couple, other join with invite code
4. Log expense on one device → verify it appears on other instantly
5. Test offline mode by disabling network
6. Test PWA installation

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=your_production_url
   VITE_SUPABASE_ANON_KEY=your_production_key
   ```
4. Deploy

Vercel automatically handles:
- Production builds
- PWA configuration
- HTTPS
- Auto-deployments on push

### Post-Deployment

- Test PWA installation on mobile devices
- Verify real-time sync works
- Check offline mode functionality
- Test all critical user flows

---

## 📱 PWA Installation

### iOS (Safari)
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (3 dots)
3. Tap "Install app"

### Desktop (Chrome/Edge)
1. Click install icon in address bar
2. Or: Menu → Install Couple Bucks

---

## 🔐 Security

- **Authentication**: Supabase Auth with secure JWT tokens
- **Authorization**: Two-tier permission system (Logger/Manager)
- **Row Level Security**: All tables enforce RLS policies
- **Data Privacy**: Each couple's data is completely isolated
- **HTTPS**: Required in production

---

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Complete development guidelines, brand system, architecture
- **[TESTING.md](./TESTING.md)**: Testing procedures and checklists
- **[initial-app-idea.md](./initial-app-idea.md)**: Original product requirements
- **[couple-bucks-brand-guide.md](./couple-bucks-brand-guide.md)**: Brand & design specifications

---

## 🐛 Known Limitations

1. **Push Notifications**: UI implemented, backend integration pending
2. **Receipt Upload**: Storage configured, OCR not implemented
3. **Quick-Add Customization**: Cannot change buttons after onboarding
4. **Currency**: USD only (no multi-currency)
5. **Reports**: CSV export only (no PDF/Excel)

---

## 🗺️ Roadmap

### Future Enhancements
- [ ] Push notification backend integration
- [ ] Receipt OCR and image management
- [ ] PDF export for reports
- [ ] Multi-currency support
- [ ] Recurring expense templates
- [ ] Savings goals tracking
- [ ] Bank/credit card integration (Plaid)
- [ ] Dark mode theme
- [ ] Budget history/trends
- [ ] Category editing post-onboarding

---

## 💻 Development Phases (All Complete)

- [x] **Phase 1**: Foundation & Database Setup
- [x] **Phase 2**: Authentication & Onboarding
- [x] **Phase 3**: Expense Management
- [x] **Phase 4**: Budget Management
- [x] **Phase 5**: Bills Management
- [x] **Phase 6**: Dashboard & Navigation
- [x] **Phase 7**: Reports & Export
- [x] **Phase 8**: Settings & Profile
- [x] **Phase 9**: PWA Enhancement
- [x] **Phase 10**: Polish & Testing

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Follow existing code style (ESLint + Prettier)
4. Write clear commit messages
5. Test thoroughly (see TESTING.md)
6. Submit pull request

---

## 📄 License

MIT License - see LICENSE file

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- Powered by [Supabase](https://supabase.com)
- UI from [ShadCN/UI](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

## 💬 Support

- **Issues**: Open an issue on GitHub
- **Documentation**: See CLAUDE.md and TESTING.md
- **Troubleshooting**: Check TESTING.md for common issues

---

Made with ❤️ for couples managing finances together
