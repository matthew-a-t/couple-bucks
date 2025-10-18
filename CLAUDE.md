# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Couple Bucks is a mobile-first Progressive Web App (PWA) for couples to collaboratively manage household finances. The app emphasizes quick expense logging, real-time sync between partners, and role-based permissions (Logger vs Manager tiers).

## Brand & Design System

### Color Palette
Use these exact colors throughout the app. They are defined as CSS variables in `src/index.css`:

**Primary Colors**
- Primary Purple: `#667eea` - Primary actions, links, logo "Couple"
- Secondary Violet: `#764ba2` - Secondary actions, accents, logo "Bucks"
- Accent Lavender: `#a78bfa` - Highlights, dividers, progress indicators

**Neutral Colors**
- Text Dark: `#2d3748` - Body text, headings
- Text Medium: `#4a5568` - Secondary text
- Text Light: `#718096` - Tertiary text, placeholders
- Border: `#e2e8f0` - Borders, dividers
- Background: `#f7fafc` - Page backgrounds
- White: `#ffffff` - Cards, modals, surfaces

**Semantic Colors** (Budget Status)
- Success Green: `#48bb78` - Budget <75%, positive actions
- Warning Yellow: `#ecc94b` - Budget 75-100%, caution states
- Error Red: `#f56565` - Budget >100%, errors, destructive actions
- Info Blue: `#4299e1` - Informational messages, tips

**Primary Gradient**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
Use for marketing headers, hero sections, CTAs, splash screens.

### Typography
**Font**: Inter (with system font fallback)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Type Scale**
- H1 Page Title: 2.5rem (40px), weight 700, line-height 1.2, letter-spacing -0.02em
- H2 Section Title: 2rem (32px), weight 600, line-height 1.3, letter-spacing -0.01em
- H3 Subsection: 1.5rem (24px), weight 600, line-height 1.4
- H4 Card Title: 1.25rem (20px), weight 600, line-height 1.4
- Body Regular: 1rem (16px), weight 400, line-height 1.6
- Body Small: 0.875rem (14px), weight 400, line-height 1.5
- Caption: 0.75rem (12px), weight 500, line-height 1.4, letter-spacing 0.02em
- Button: 1rem (16px), weight 600, line-height 1

**Guidelines**
- Headings: weights 600-700 only
- Body text: weight 400 (regular)
- Emphasis: weight 500-600, avoid bold (700)
- Minimum body text: 16px (1rem)

### Brand Voice & Copy Guidelines
**Tone**: Warm • Clear • Supportive • Team-Oriented

**Voice Principles**
1. Use "we" language: "Let's build your budget" not "Build your budget"
2. Be conversational: Write like talking to a friend
3. Offer choices: "Maybe a cozy night in?" not "Stop spending"
4. Celebrate wins: Acknowledge progress and smart decisions
5. No shame: Money is neutral; focus on goals, not mistakes

**Writing Examples**
- Welcome: "Welcome to Couple Bucks! Let's manage money together."
- Budget Alert: "Heads up! You're at 85% of your dining budget."
- Empty State: "No expenses yet. Ready to log your first one?"
- Error: "Oops! Check that amount and try again."
- Success: "Nice! Expense logged and synced to your partner."

**Avoid**
- Corporate jargon or overly technical language
- Judgmental tones about spending
- Creating anxiety or financial shame
- Gendered stereotypes about money management

### UI Component Styling

**Buttons**
- Primary: bg `#667eea`, text white, padding 12px 24px, border-radius 8px, weight 600
- Secondary: bg transparent, border 2px `#667eea`, text `#667eea`, padding 12px 24px, border-radius 8px, weight 600
- Destructive: bg `#f56565`, text white, padding 12px 24px, border-radius 8px, weight 600

**Input Fields**
- Border: 1px solid `#e2e8f0`, border-radius 8px, padding 12px 16px
- Focus: border-color `#667eea`, box-shadow 0 0 0 3px rgba(102, 126, 234, 0.1)

**Cards**
- Background: white, border-radius 12px, padding 24px
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)

**Quick-Add Expense Buttons**
- Default: bg `#f7fafc`, border 2px `#e2e8f0`, padding 16px, border-radius 12px
- Active: border `#667eea`, bg `#f0f4ff`, text `#667eea`

### Spacing System (8px base unit)
```
4px (0.25rem)   - Tight spacing (within components)
8px (0.5rem)    - Small spacing
16px (1rem)     - Default spacing
24px (1.5rem)   - Medium spacing
32px (2rem)     - Large spacing
48px (3rem)     - Section spacing
64px (4rem)     - Page spacing
```

### Border Radius
```
4px  - Small (tags, badges)
8px  - Medium (buttons, inputs)
12px - Large (cards, modals)
16px - XL (featured elements)
```

### Icons
- **Library**: Lucide Icons (https://lucide.dev/)
- **Style**: 2px stroke weight, 2px corner radius
- **Size**: 24x24px default (scale proportionally)
- **Color**: Match text color or use Primary Purple for emphasis

**Common Icons**
- Add Expense: `plus-circle`
- Budget: `wallet`
- Bills: `calendar`
- Reports: `bar-chart-2`
- Profile: `user`
- Settings: `settings`
- Notification: `bell`

### Accessibility Requirements
- **Color Contrast**: WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text)
- **Focus Indicators**: All interactive elements must have visible focus states
  ```css
  outline: 2px solid #667eea;
  outline-offset: 2px;
  ```
- **Minimum text size**: 16px (1rem)
- **Tap targets**: 44px minimum on mobile

**See `couple-bucks-brand-guide.md` for complete brand specifications, logo usage, and design examples.**

## Development Commands

```bash
npm run dev      # Start dev server (Vite)
npm run build    # Type check + build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint with zero warnings policy
npm run format   # Format code with Prettier
```

## Architecture Overview

### Two-User Architecture
- Each couple account = exactly 2 linked users with individual auth
- Real-time sync via Supabase subscriptions
- Permission-based UI rendering (Tier 1: Logger, Tier 2: Manager)

### Service Layer Pattern
All database operations MUST go through service layers in `/src/services/`:
- `expenses.ts` - All expense CRUD operations
- `budgets.ts` - All budget operations
- `bills.ts` - All bill operations
- `auth.ts` - Authentication logic

**Critical**: Never call Supabase directly from components. Always use service layer abstractions to enable future API integrations (Plaid, bank connections) without refactoring components.

### State Management Strategy
- **Zustand** for global state (user session, couple data)
- **Supabase real-time subscriptions** for live data sync between partners
- **Local state** for component-specific UI only
- **Optimistic updates**: Update UI immediately, sync in background for better UX

### Component Organization (Feature-Based)
Components in `/src/components/` are organized by feature domain:
- `/expenses` - Expense logging, list, details
- `/budgets` - Budget creation, display, editing
- `/bills` - Bill management, reminders
- `/auth` - Login, signup, password reset
- `/onboarding` - Survey flows, couple pairing
- `/shared` - Reusable UI (buttons, modals, navigation, layouts)

### Permission System
- **Tier 1 (Logger)**: Can log expenses, view summaries, see bills. Cannot edit partner's expenses.
- **Tier 2 (Manager)**: All Tier 1 + create/edit budgets, edit any expense, manage categories, export data, full settings access.

Components must check permission tier and render appropriate UI. Use progressive disclosure - show only what's needed per tier.

### Database Schema (Supabase)
- **users**: profiles, permission tiers, preferences
- **couples**: pair relationship (exactly 2 users), financial settings, custom categories
- **expenses**: transactions with split info (50/50, custom %, single-payer)
- **budgets**: ongoing spending limits (NO time periods), color-coded progress
- **bills**: recurring bills with reminders

**Row Level Security (RLS)**: ALL tables must enforce RLS policies to ensure users only access their couple's data.

### Real-time Sync Requirements
Expenses, budgets, and bills MUST have real-time subscriptions so both partners see updates instantly. Use Supabase real-time subscriptions in service layers.

## Important Technical Details

### Path Aliases
Use `@/` prefix for all src imports (configured in vite.config.ts and tsconfig.json):
```typescript
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/shared/button'
```

### Environment Variables
Supabase credentials are in `.env` (gitignored):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Type definitions in `src/vite-env.d.ts` for auto-completion.

### ShadCN/UI Components
This project uses ShadCN/UI (Radix UI + Tailwind). When adding new UI components:
- Follow ShadCN/UI patterns
- Use `cn()` utility from `@/lib/utils` for className merging
- Place in `/src/components/shared/` or feature-specific folders

### Styling System
**See "Brand & Design System" section above for complete color palette, typography, and component styles.**

**Implementation**
- **Tailwind CSS** with custom theme in `tailwind.config.js` aligned to brand colors:
  ```javascript
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#a78bfa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  }
  ```
- **CSS variables** for theming in `src/index.css`:
  ```css
  :root {
    --color-primary: #667eea;
    --color-secondary: #764ba2;
    --color-accent: #a78bfa;
    --color-success: #48bb78;
    --color-warning: #ecc94b;
    --color-error: #f56565;
    /* ...see brand guide for complete variable list */
  }
  ```
- **Mobile-first**: All designs must be mobile-first, min tap target 44px
- **Budget status colors**: Green (<75%), Yellow (75-100%), Red (>100%) per brand guide semantic colors

### PWA Configuration
PWA manifest and service worker config in `vite.config.ts`:
- Offline mode: Queue transactions when offline, sync when back online
- Supabase requests cached with NetworkFirst strategy (24hr expiration)
- Push notifications for bill reminders

### Forms & Validation
- **react-hook-form** for form state
- **zod** for schema validation
- Always validate on both client and server (Supabase functions)

### Receipt Storage
- Supabase Storage for receipt images
- Compress images client-side BEFORE upload
- Associate image URLs with expense records

## Key Business Rules

### Expense Splitting
ALL expenses are splitable by default. Options:
- 50/50 split
- Custom percentage (based on income proportion)
- Single-payer (one partner pays 100%)

Default split is configured during onboarding survey.

### Budget Structure
- Budgets are **ongoing spending limits** (NO monthly/time periods)
- 10 predefined categories (editable): Groceries, Dining Out, Transportation, Utilities, Entertainment, Shopping, Healthcare, Household, Pets, Other
- Each budget shows: limit, spent, remaining, progress bar with color indicator

### Bills vs Expenses
Bills are SEPARATE from expenses:
- Bills = recurring scheduled payments with reminders
- Marking bill as paid can optionally create an expense
- Bill reminders trigger 1, 3, or 7 days before due date (user configurable)

### Onboarding Survey (Critical)
3 questions determine app configuration:
1. Account type (joint/separate/mix)
2. Expense split method (50/50/proportional/custom/single-payer)
3. Income tracking (yes/no)

Responses configure default split percentages and UI terminology.

## Development Approach

### Iterative Feature Development
Build one complete vertical feature at a time (backend + frontend + real-time sync). Each feature must be fully functional before moving to next.

### Type Safety
TypeScript strict mode enabled. All new code must:
- Define TypeScript types in `/src/types/`
- Use proper typing (no `any` without justification)
- Export shared types for reuse

### Deployment
- **Hosting**: Vercel with automatic deployments
- **Environments**: Development (local + Supabase dev) and Production (Vercel + Supabase prod)

## Reference Documentation

See `initial-app-idea.md` for complete product requirements, user flows, and feature specifications.
