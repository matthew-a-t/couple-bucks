# Testing Guide - Couple Bucks

This document outlines the testing procedures and checklists for the Couple Bucks finance app.

## Accessibility Testing (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible (Tab/Shift+Tab)
- [ ] Focus indicators are visible on all focusable elements
- [ ] Modal dialogs trap focus and can be closed with Escape
- [ ] Form inputs can be navigated with Tab
- [ ] Dropdown menus can be operated with arrow keys
- [ ] Buttons can be activated with Space/Enter

### Screen Reader Compatibility
- [ ] All images have appropriate alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Success/failure toasts are announced
- [ ] Page titles are descriptive

### Color Contrast
- [ ] Body text meets 4.5:1 contrast ratio
- [ ] Large text (18px+) meets 3:1 contrast ratio
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators have 3:1 contrast
- [ ] Error states are not color-only (icons + text)

### Touch Targets
- [ ] All buttons are minimum 44x44px
- [ ] Adequate spacing between clickable elements
- [ ] Quick-add buttons are large enough for touch
- [ ] Bottom navigation buttons are appropriately sized

## Responsive Design Testing

### Mobile (320px - 767px)
- [ ] All pages render correctly on small screens
- [ ] Bottom navigation is accessible
- [ ] Forms are usable with on-screen keyboard
- [ ] Modals don't overflow viewport
- [ ] Tables/lists scroll horizontally if needed
- [ ] Text remains readable (minimum 16px)

### Tablet (768px - 1023px)
- [ ] Layout adapts to medium screens
- [ ] Cards use grid layouts appropriately
- [ ] Navigation remains usable
- [ ] Multi-column layouts render correctly

### Desktop (1024px+)
- [ ] Content is centered with max-width
- [ ] Grid layouts expand to use available space
- [ ] Bottom navigation considerations
- [ ] Hover states work on interactive elements

### Orientation
- [ ] Portrait mode works on all pages
- [ ] Landscape mode is functional
- [ ] Content reflows appropriately

## Browser Compatibility

### Minimum Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Test Each Browser
- [ ] Authentication flows work
- [ ] PWA installation works
- [ ] Service worker registers
- [ ] localStorage persists
- [ ] Real-time subscriptions work
- [ ] File uploads work (receipts)
- [ ] CSV export downloads correctly

## Critical User Flows

### 1. Sign Up & Onboarding
**Steps:**
1. Navigate to `/signup`
2. Enter email, password, full name
3. Submit form
4. Complete onboarding survey (3 questions)
5. Select permission tier
6. Choose quick-add buttons
7. Create or join couple
8. See dashboard

**Expected:**
- [ ] Form validation works
- [ ] Password strength indicator shows
- [ ] Survey responses are saved
- [ ] Quick-add buttons reflect selections
- [ ] Couple pairing works correctly
- [ ] Redirect to dashboard after completion

### 2. Login
**Steps:**
1. Navigate to `/login`
2. Enter credentials
3. Submit form

**Expected:**
- [ ] Valid credentials log in successfully
- [ ] Invalid credentials show error
- [ ] Remember me works (if implemented)
- [ ] Redirect based on onboarding status
- [ ] Session persists across page reloads

### 3. Log Expense (Quick Add)
**Steps:**
1. Go to Dashboard or Expenses page
2. Click quick-add button
3. Enter amount
4. Optionally add description
5. Select split type
6. Submit

**Expected:**
- [ ] Dialog opens correctly
- [ ] Amount validation works
- [ ] Category pre-filled from button
- [ ] Split type options render
- [ ] Expense appears in list immediately
- [ ] Real-time sync to partner
- [ ] Budget updates if applicable

### 4. Create Budget (Manager Only)
**Steps:**
1. Navigate to `/budgets`
2. Click "Add Budget"
3. Select category
4. Enter limit amount
5. Submit

**Expected:**
- [ ] Only managers can access
- [ ] Categories without budgets show in dropdown
- [ ] Current spending is calculated
- [ ] Progress bar shows correct percentage
- [ ] Color coding applies (green/yellow/red)
- [ ] Budget appears in list

### 5. Add Bill
**Steps:**
1. Navigate to `/bills`
2. Click "Add Bill"
3. Enter bill details (name, amount, due date, frequency)
4. Submit

**Expected:**
- [ ] Form validation works
- [ ] Date picker is accessible
- [ ] Frequency options render
- [ ] Bill appears in appropriate status section
- [ ] Status calculated correctly (overdue/due soon/upcoming)

### 6. View Reports (Manager Only)
**Steps:**
1. Navigate to `/reports`
2. Select date range
3. View spending breakdowns
4. Export CSV

**Expected:**
- [ ] Only managers can access
- [ ] Date filter updates data
- [ ] Category breakdown shows all categories
- [ ] Partner breakdown shows both partners
- [ ] Progress bars render correctly
- [ ] CSV export downloads with correct data

### 7. Update Settings
**Steps:**
1. Navigate to `/settings`
2. Update profile name
3. Toggle notification preferences
4. Copy invite code
5. Save changes

**Expected:**
- [ ] Profile updates persist
- [ ] Switches toggle correctly
- [ ] Invite code copies to clipboard
- [ ] Toast confirmation shows
- [ ] Changes reflect in other pages

### 8. Offline Mode
**Steps:**
1. Go offline (disable network)
2. Try to log expense
3. Go back online

**Expected:**
- [ ] Offline indicator appears
- [ ] Expenses are queued
- [ ] Queue count shows correctly
- [ ] When online, expenses sync automatically
- [ ] Success message shows after sync
- [ ] Expenses appear in list after sync

## Real-time Sync Testing

### Two-User Testing (requires 2 devices/browsers)
1. **Expense Sync**
   - [ ] User A logs expense
   - [ ] User B sees it immediately in their list
   - [ ] Dashboard totals update on both devices

2. **Budget Sync**
   - [ ] Manager updates budget
   - [ ] Changes reflect on partner's device
   - [ ] Spending updates when expenses are logged

3. **Bill Sync**
   - [ ] User A adds bill
   - [ ] User B sees it in their bill list
   - [ ] User A marks as paid
   - [ ] Status updates on User B's device

## Performance Testing

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Route transitions < 500ms
- [ ] API requests < 2 seconds
- [ ] Real-time updates < 1 second

### Bundle Size
- [ ] Main bundle < 500KB (gzipped)
- [ ] Code splitting is effective
- [ ] Lazy loading works for routes

### PWA Metrics
- [ ] Service worker installs correctly
- [ ] Offline cache works
- [ ] App installs successfully
- [ ] Install prompt appears

## Security Testing

### Authentication
- [ ] Protected routes redirect to login
- [ ] Session expires appropriately
- [ ] Password reset flow works
- [ ] Logout clears session

### Authorization
- [ ] Loggers cannot access manager-only routes
- [ ] Loggers cannot edit partner's expenses
- [ ] Budget operations restricted to managers
- [ ] Reports restricted to managers

### Data Privacy
- [ ] Users only see their couple's data
- [ ] RLS policies enforced
- [ ] No data leaks between couples
- [ ] Partner information is private

## Edge Cases & Error Handling

### Network Errors
- [ ] API failures show error messages
- [ ] Retry mechanisms work
- [ ] Offline mode activates correctly
- [ ] Stale data handling

### Validation Errors
- [ ] Form validation prevents invalid submissions
- [ ] Error messages are clear and helpful
- [ ] Server-side validation matches client-side

### Empty States
- [ ] No expenses: helpful empty state
- [ ] No budgets: CTA to create first budget
- [ ] No bills: CTA to add first bill
- [ ] No reports data: helpful message

### Error Boundaries
- [ ] Caught errors show friendly message
- [ ] User can recover (return to dashboard)
- [ ] Errors are logged for debugging

## Manual Test Scenarios

### Scenario 1: First-Time Couple Setup
User A creates account → Completes onboarding → Creates couple → Gets invite code
User B creates account → Completes onboarding → Joins with invite code
Both users should see each other as partners

### Scenario 2: Budget Overspending
Manager creates budget with $100 limit
Logger logs $80 expense (80% - yellow warning)
Logger logs $30 expense (110% - red over budget)
Both should see updated status and alerts

### Scenario 3: Bill Reminders
Add bill due in 2 days
App should show "Due Soon" status
Add bill due yesterday
App should show "Overdue" status with red styling

### Scenario 4: Leave Couple
User goes to Settings → Clicks "Leave Couple" → Confirms
User should be unpaired and redirected to couple setup
Partner should remain in couple (data intact)

## Regression Testing Checklist

Run after any significant changes:

- [ ] Authentication still works
- [ ] Real-time sync still functional
- [ ] All CRUD operations work
- [ ] Navigation works across all pages
- [ ] PWA installation works
- [ ] Offline mode works
- [ ] Export functionality works
- [ ] Permission system enforced

## Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies active
- [ ] Service worker updated
- [ ] Build completes without warnings
- [ ] Production build tested locally
- [ ] Analytics/monitoring configured

## Known Limitations

1. **Push Notifications**: Not fully implemented (placeholder UI only)
2. **Receipt Upload**: Backend configured but UI placeholder
3. **Category Editing**: Cannot modify quick-add buttons after onboarding
4. **Multi-Currency**: Not supported (USD only)
5. **Data Export**: CSV only (no PDF/JSON options)

## Future Testing Considerations

- Automated E2E tests (Playwright/Cypress)
- Unit tests for critical business logic
- Load testing for scale
- Automated accessibility testing (axe-core)
- Visual regression testing
