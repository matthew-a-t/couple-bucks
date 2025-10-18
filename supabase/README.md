# Supabase Database Setup

This folder contains the database schema and migrations for Couple Bucks.

## Initial Setup

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Update Environment Variables**
   - Copy the `.env.example` to `.env` if not already done
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run the Initial Migration**

   Option A: Using Supabase Dashboard (Easiest)
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `migrations/20250118000000_initial_schema.sql`
   - Paste and run the SQL

   Option B: Using Supabase CLI
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Push migrations
   supabase db push
   ```

4. **Set up Storage Bucket for Receipts**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `receipts`
   - Set it to Public (or Private with signed URLs)
   - Add policy to allow authenticated users to upload/view their receipts

## Database Schema Overview

### Tables

- **profiles** - User profiles extending Supabase auth.users
- **couples** - Couple relationships (exactly 2 users)
- **expenses** - Expense transactions with split information
- **budgets** - Ongoing budget limits per category
- **bills** - Recurring bill tracking

### Row Level Security

All tables have RLS policies enforcing:
- Users can only access their own couple's data
- Permission tier restrictions (Logger vs Manager)
- Appropriate CRUD permissions per role

### Enums

- `permission_tier`: 'logger' | 'manager'
- `split_type`: 'fifty_fifty' | 'proportional' | 'custom' | 'single_payer'
- `account_type`: 'joint' | 'separate' | 'mixed'
- `bill_frequency`: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'

## Real-time Setup

To enable real-time subscriptions:

1. Go to Database → Replication in Supabase dashboard
2. Enable replication for these tables:
   - expenses
   - budgets
   - bills

## Future Migrations

When creating new migrations:
1. Name them with timestamp: `YYYYMMDDHHMMSS_description.sql`
2. Place them in the `migrations/` folder
3. Apply them in order using the SQL Editor or CLI
