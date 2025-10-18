\# Couple Bucks - Project Brief



\## Executive Summary



\*\*Couple Bucks\*\* is a mobile-first Progressive Web App (PWA) designed for couples to collaboratively manage household finances. It emphasizes quick expense logging, flexible financial models, and role-based permissions to accommodate different levels of involvement between partners.



---



\## Problem Statement \& Market Opportunity



\*\*Current challenges:\*\*

\- Existing budgeting apps aren't designed for the unique dynamics of committed couples sharing finances

\- Most apps are either too complex (overwhelming for casual users) or too simple (lacking features for the "financial manager" partner)

\- Traditional apps don't account for asymmetric involvement - where one partner manages while the other just needs to log expenses



\*\*Target users:\*\* Couples (married, long-term partners, cohabitating) who share expenses and want financial transparency without friction.



---



\## Core Features \& Functionality



\### 1. Quick Expense Logging

\- \*\*Fast-tap buttons\*\* for common expenses (groceries, gas, dining out, utilities, etc.)

\- Custom expense categories configurable per couple

\- Manual amount entry (no auto-population)

\- Receipt photo capture (optional)

\- Note field for additional context

\- \*\*All expenses splitable by default\*\* - choose between 50/50, custom percentage, or single-payer



\### 2. Two-User Architecture

\- Each couple account = exactly 2 linked users

\- Real-time sync between partners

\- Individual login credentials

\- Shared financial dashboard



\### 3. Permission Tiers (Role-Based UI)

Based on onboarding survey, users select their involvement level:



\*\*Tier 1: Logger\*\* (Low involvement)

\- Log expenses only

\- View spending summaries

\- Receive notifications about budget status

\- View bills and due dates

\- Minimal UI clutter



\*\*Tier 2: Manager\*\* (High involvement)

\- All Tier 1 features

\- Create/edit budgets

\- View detailed reports

\- Categorize and edit transactions

\- Create/edit bills and reminders

\- Manage expense categories

\- Export data (CSV format)

\- Full account settings access



\*\*Permission implications:\*\*

\- Tier 1 users cannot edit expenses logged by their partner

\- Tier 2 users can edit any expense in the account

\- Only Tier 2 users can modify budgets and account settings

\- Both tiers can always edit their own expenses



\### 4. Bills Management (Separate from Expenses)

\- Create recurring bills with:

  - Name, amount, due date, frequency (monthly, quarterly, annual, custom)

  - Split type (50/50, custom percentage, or assigned to one partner)

  - Category assignment

\- Push notifications before bills are due (configurable lead time: 1, 3, 7 days)

\- Mark bills as paid (optionally create expense from bill payment)

\- Separate "Bills" tab in navigation



\### 5. Flexible Financial Models

The onboarding survey determines the couple's financial structure:



\*\*Question 1: "How do you manage finances?"\*\*

\- Joint accounts only

\- Separate accounts with shared expenses

\- Mix of joint and separate accounts



\*\*Question 2: "How do you split expenses?"\*\*

\- 50/50 on everything

\- Proportional to income

\- Custom per expense

\- One person pays everything



\*\*Question 3: "Do you track income?"\*\*

\- Yes, we want to track both partner incomes

\- No, expenses only



Based on responses, the app configures:

\- Default split percentages

\- Income tracking fields (visible/hidden)

\- Budget terminology adjustments



\### 6. Budget Structure

\- \*\*No time periods\*\* - budgets are ongoing spending limits

\- Predefined category list (editable):

  - Groceries, Dining Out, Transportation, Utilities, Entertainment, Shopping, Healthcare, Household, Pets, Other

\- Users can add, rename, or delete categories

\- Each budget displays:

  - Category name, spending limit, amount spent, remaining balance

  - Visual progress bar with color indicators:

    - Green: <75% spent

    - Yellow: 75-100% spent

    - Red: >100% spent



---



\## Technical Architecture



\### Tech Stack

\- \*\*Frontend:\*\* React + TypeScript

\- \*\*UI Components:\*\* ShadCN/UI

\- \*\*Backend:\*\* Supabase (PostgreSQL + Auth + Storage + Real-time)

\- \*\*Hosting:\*\* Vercel

\- \*\*Code Review:\*\* CodeRabbit (automated PR reviews)

\- \*\*PWA:\*\* Service workers for offline support and installability



\### Architecture Principles



\*\*Modular Component Structure\*\*

Organize by feature modules for clear separation of concerns:

```

/components

\&nbsp; /expenses (expense logging, list, details)

\&nbsp; /budgets (budget creation, display, editing)

\&nbsp; /bills (bill management, reminders)

\&nbsp; /auth (login, signup, password reset)

\&nbsp; /onboarding (survey flows, couple pairing)

\&nbsp; /shared (buttons, modals, navigation, layouts)

```



\*\*State Management\*\*

\- React Context or Zustand for global state (user session, couple data)

\- Supabase real-time subscriptions for live data sync

\- Local state for component-specific UI



\*\*Routing\*\*

\- React Router for navigation

\- Protected routes based on authentication

\- Role-based rendering based on permission tier



\*\*Data Layer\*\*

\- Supabase client for all database operations

\- Real-time subscriptions for expenses, budgets, and bills

\- Optimistic updates for better UX (update UI immediately, sync in background)



\*\*API Integration Readiness\*\*

Structure data operations through service layers:

\- `/services/expenses.ts` - All expense CRUD operations

\- `/services/budgets.ts` - All budget operations

\- `/services/bills.ts` - All bill operations

\- `/services/auth.ts` - Authentication logic



This abstraction allows future API integrations (Plaid, bank connections) without refactoring components.



\*\*Database Schema Considerations\*\*

\- Users table (profiles, permission tiers, preferences)

\- Couples table (pair relationship, financial settings, categories)

\- Expenses table (transactions with split information)

\- Budgets table (category limits and tracking)

\- Bills table (recurring bill information and reminders)

\- Supabase Row Level Security (RLS) policies to ensure users only access their couple's data



\*\*File Storage\*\*

\- Supabase Storage for receipt images

\- Compress images client-side before upload

\- Associate image URLs with expense records



\*\*Authentication\*\*

\- Supabase Auth for email/password login

\- Partner invitation system via unique codes

\- Session management and protected routes



\*\*Notifications\*\*

\- Browser push notifications (Web Push API)

\- Supabase Edge Functions to trigger notification events

\- User preferences stored per user



---



\## User Flows



\### Onboarding Flow

1\. \*\*User 1 (Initiator)\*\*

   - Visit app → Create account (email + password)

   - Complete financial survey (3 questions)

   - Select permission tier (Logger or Manager)

   - Customize quick-add expense buttons

   - Generate partner invite code

   - Share code with partner



2\. \*\*User 2 (Partner)\*\*

   - Receive invite link → Create account

   - Complete permission survey

   - Review financial setup

   - Account activated for both users



\### Daily Expense Logging

1\. Open app → Tap quick-add button or "Add Expense"

2\. Enter amount

3\. Confirm/change category

4\. Select split type

5\. Optional: Add note, attach receipt

6\. Submit → Real-time sync to partner



\### Budget Creation (Tier 2)

1\. Navigate to Budgets → Add Budget

2\. Select category, enter limit

3\. Submit → Partner notified



\### Bill Management (Tier 2)

1\. Navigate to Bills → Add Bill

2\. Enter bill details (name, amount, due date, frequency, split)

3\. Set reminder preference

4\. Submit → Both partners receive reminders

5\. Mark as paid or create expense from bill



\### Viewing Reports (Tier 2)

1\. Navigate to Reports

2\. View spending by category, partner, timeline

3\. Apply filters (date, category, partner)

4\. Export as CSV



---



\## UX/UI Design



\### Navigation Structure

\- \*\*Tier 1:\*\* Home | Expenses | Bills | Profile

\- \*\*Tier 2:\*\* Home | Expenses | Bills | Budgets | Reports | Profile



\### Key Screens



\*\*Home Dashboard\*\*

\- Monthly spending total

\- Budget progress bars (top categories)

\- Quick-add expense buttons (4-6 customizable)

\- Upcoming bills widget (next 3)

\- Recent expenses (last 5)



\*\*Expenses List\*\*

\- Chronological feed

\- Show: Amount, category, description, who logged it, split type

\- Filter by date, category, partner

\- Tap to view/edit (based on permissions)



\*\*Bills Tab\*\*

\- Grouped: Overdue | Due Soon | Upcoming

\- Show: Name, amount, due date, frequency, split

\- Mark as paid (Tier 2 only)



\*\*Budgets Tab (Tier 2)\*\*

\- List of budget categories

\- Progress bars with color indicators

\- Tap to edit limits



\*\*Reports Tab (Tier 2)\*\*

\- Spending overview charts

\- Filters and date selectors

\- Export functionality



\*\*Profile / Settings\*\*

\- User details and permission tier

\- Partner information

\- Notification preferences

\- Manage categories (Tier 2)

\- Manage quick-add buttons

\- Export data (Tier 2)



\### Design Principles

\- Mobile-first responsive design

\- Large tap targets (min 44px)

\- Progressive disclosure (show only what's needed per tier)

\- Color coding for budget status

\- Icons for categories

\- Clear split indicators

\- Partner attribution on transactions

\- "We" language throughout (couple-centric)



---



\## Feature Requirements Summary



\### MVP Must-Haves



\*\*Authentication \& Onboarding\*\*

\- Email/password signup and login

\- Financial survey (3 questions)

\- Permission tier selection

\- Partner invite system (unique codes)

\- Quick-add button customization



\*\*Expense Management\*\*

\- Create expense (amount, category, split, note, receipt)

\- View expense list (chronological, filterable)

\- Edit own expenses (all users)

\- Edit any expense (Tier 2 only)

\- Real-time sync between partners

\- Receipt photo upload



\*\*Budget Management (Tier 2)\*\*

\- Create/edit budgets (category + limit)

\- View budget progress

\- Automatic spending calculation

\- Color-coded status indicators



\*\*Bill Management (Tier 2)\*\*

\- Create/edit recurring bills

\- Due date and frequency tracking

\- Bill reminders (push notifications)

\- Mark bills as paid

\- Create expense from bill payment



\*\*Reports \& Export (Tier 2)\*\*

\- Spending by category visualization

\- Spending by partner breakdown

\- Date range filtering

\- CSV export



\*\*Settings\*\*

\- Notification preferences

\- Manage expense categories

\- Manage quick-add buttons

\- View partner information

\- Account management



\*\*PWA Features\*\*

\- Installable on mobile/desktop

\- Offline mode (queue transactions)

\- Push notification support



---



\## Development Workflow (Claude Code Optimized)



\### Project Structure

```

couple-bucks/

├── src/

│   ├── components/       # Feature-based components

│   ├── pages/           # Route-level pages

│   ├── services/        # Data operations (Supabase)

│   ├── hooks/           # Custom React hooks

│   ├── context/         # Global state management

│   ├── lib/             # Utilities and helpers

│   ├── types/           # TypeScript definitions

│   └── assets/          # Images, icons

├── public/              # Static assets, PWA manifest

└── supabase/            # Database migrations, policies

```



\### Development Approach

\- \*\*Iterative feature development:\*\* Build one complete feature at a time

\- \*\*Component isolation:\*\* Each feature module is self-contained

\- \*\*Clear acceptance criteria:\*\* Each feature has defined behavior

\- \*\*Type safety:\*\* TypeScript throughout for reliability

\- \*\*Code review:\*\* CodeRabbit for automated PR feedback



\### Deployment Pipeline

\- \*\*Version control:\*\* Git (GitHub recommended)

\- \*\*CI/CD:\*\* Vercel automatic deployments on push

\- \*\*Environments:\*\*

  - Development: Local + Supabase dev project

  - Production: Vercel + Supabase production project



---



\## Testing \& Quality



\### Testing Strategy

\- Manual testing for MVP

\- Focus on critical user paths:

  - Onboarding flow (both users)

  - Expense logging and sync

  - Budget creation and tracking

  - Bill reminders

  - Permission tier restrictions



\### Quality Checklist

\- \[ ] Both users can complete onboarding independently

\- \[ ] Expenses sync in real-time between partners

\- \[ ] Permission tiers correctly restrict features

\- \[ ] Budget calculations are accurate

\- \[ ] Bill reminders trigger at correct times

\- \[ ] PWA installs correctly on mobile/desktop

\- \[ ] Offline mode queues transactions

\- \[ ] Receipt uploads work reliably

\- \[ ] CSV export contains complete data

\- \[ ] Responsive design works on all screen sizes



---



\## Predefined Expense Categories (Editable)



1\. Groceries 🛒

2\. Dining Out 🍽️

3\. Transportation 🚗

4\. Utilities 💡

5\. Entertainment 🎬

6\. Shopping 🛍️

7\. Healthcare 🏥

8\. Household 🏠

9\. Pets 🐾

10\. Other 📦



---



\## Out of Scope (Post-MVP)



\- Bank account linking (Plaid integration)

\- Automatic transaction imports

\- AI-powered categorization

\- Savings goals tracking

\- Debt management features

\- Multi-currency support

\- Integration with accounting software (QuickBooks)

\- Advanced analytics and forecasting

\- Shared document vault

