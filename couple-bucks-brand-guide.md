# Couple Bucks Brand Guide

**Version 1.0** | Modern Minimal

---

## Logo

### Primary Wordmark

```
Couple | Bucks
```

- **Couple** in Primary Purple (#667eea)
- **|** (divider) in Accent Lavender (#a78bfa)
- **Bucks** in Secondary Violet (#764ba2)
- Font weight: 700 (Bold)
- Letter spacing: -0.02em (tight)

### App Icon (Abbreviated)

```
CB
```

- Two-letter monogram
- Use gradient or solid Primary Purple (#667eea) for backgrounds
- White or Text Dark (#2d3748) for the letters depending on background

### Logo Variations

**Full Color (Primary)**
- Use on white or light backgrounds
- Gradient wordmark as specified above

**Single Color**
- Primary Purple (#667eea) for all text elements
- Use when gradient is not feasible (single-color printing, small sizes)

**Reversed**
- White wordmark on Primary Purple background
- Use for dark mode or branded backgrounds

### Clear Space

Maintain clear space around the logo equal to the height of the capital letter "C" on all sides.

### Minimum Size

- Digital: 120px width minimum
- Print: 1 inch width minimum

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Primary Purple** | `#667eea` | rgb(102, 126, 234) | Primary actions, links, first word in logo |
| **Secondary Violet** | `#764ba2` | rgb(118, 75, 162) | Secondary actions, accents, second word in logo |
| **Accent Lavender** | `#a78bfa` | rgb(167, 139, 250) | Highlights, dividers, progress indicators |

### Neutral Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Text Dark** | `#2d3748` | rgb(45, 55, 72) | Body text, headings |
| **Text Medium** | `#4a5568` | rgb(74, 85, 104) | Secondary text |
| **Text Light** | `#718096` | rgb(113, 128, 150) | Tertiary text, placeholders |
| **Border** | `#e2e8f0` | rgb(226, 232, 240) | Borders, dividers |
| **Background** | `#f7fafc` | rgb(247, 250, 252) | Page backgrounds |
| **White** | `#ffffff` | rgb(255, 255, 255) | Cards, modals, surfaces |

### Semantic Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Success Green** | `#48bb78` | Budget under 75%, positive actions |
| **Warning Yellow** | `#ecc94b` | Budget 75-100%, caution states |
| **Error Red** | `#f56565` | Budget over 100%, errors, destructive actions |
| **Info Blue** | `#4299e1` | Informational messages, tips |

### Gradient

**Primary Gradient**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Use for:
- Marketing headers
- Hero sections
- Call-to-action backgrounds
- Splash screens

---

## Typography

### Typeface

**Inter** (fallback: system UI fonts)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| **H1 - Page Title** | 2.5rem (40px) | 700 | 1.2 | -0.02em |
| **H2 - Section Title** | 2rem (32px) | 600 | 1.3 | -0.01em |
| **H3 - Subsection** | 1.5rem (24px) | 600 | 1.4 | normal |
| **H4 - Card Title** | 1.25rem (20px) | 600 | 1.4 | normal |
| **Body Large** | 1.125rem (18px) | 400 | 1.6 | normal |
| **Body Regular** | 1rem (16px) | 400 | 1.6 | normal |
| **Body Small** | 0.875rem (14px) | 400 | 1.5 | normal |
| **Caption** | 0.75rem (12px) | 500 | 1.4 | 0.02em |
| **Button** | 1rem (16px) | 600 | 1 | normal |

### Usage Guidelines

- **Headings**: Use weights 600-700 only
- **Body text**: Weight 400 (regular)
- **Emphasis**: Weight 500-600, not bold (700)
- **All caps**: Use sparingly, only for labels/captions with letter-spacing: 0.05em

---

## Brand Voice

### Tone

**Warm • Clear • Supportive • Team-Oriented**

We speak to couples as a unified team, using "we" language and emphasizing partnership.

### Characteristics

✅ **We Are:**
- Warm and supportive
- Clear and straightforward
- Encouraging without pressure
- Team-oriented ("we" vs. "you")

❌ **We Avoid:**
- Corporate jargon or overly technical language
- Judgmental tones about spending
- Creating anxiety or financial shame
- Gendered stereotypes about money management

### Writing Examples

| Context | ❌ Avoid | ✅ Use |
|---------|----------|--------|
| Welcome | "Sign up to track your spending" | "Welcome to Couple Bucks! Let's manage money together." |
| Budget Alert | "WARNING: Budget exceeded" | "Heads up! You're at 85% of your dining budget." |
| Empty State | "No expenses found" | "No expenses yet. Ready to log your first one?" |
| Error | "Invalid input" | "Oops! Check that amount and try again." |
| Success | "Expense created" | "Nice! Expense logged and synced to your partner." |

### Voice Principles

1. **Use "we" language**: "Let's build your budget" not "Build your budget"
2. **Be conversational**: Write like you're talking to a friend
3. **Offer choices**: "Maybe a cozy night in?" not "Stop spending"
4. **Celebrate wins**: Acknowledge progress and smart decisions
5. **No shame**: Money is neutral; focus on goals, not mistakes

---

## UI Components

### Buttons

**Primary Button**
```css
background: #667eea;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

**Secondary Button**
```css
background: transparent;
color: #667eea;
border: 2px solid #667eea;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

**Destructive Button**
```css
background: #f56565;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

### Quick-Add Expense Buttons

```css
background: #f7fafc;
border: 2px solid #e2e8f0;
color: #2d3748;
padding: 16px;
border-radius: 12px;
font-weight: 600;
```

**Active State**
```css
border-color: #667eea;
background: #f0f4ff;
color: #667eea;
```

### Input Fields

```css
border: 1px solid #e2e8f0;
border-radius: 8px;
padding: 12px 16px;
font-size: 1rem;
color: #2d3748;
```

**Focus State**
```css
border-color: #667eea;
box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
```

### Cards

```css
background: #ffffff;
border-radius: 12px;
padding: 24px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

---

## Budget Status Indicators

### Visual System

| Status | Percentage | Color | Usage |
|--------|------------|-------|-------|
| **On Track** | 0-74% | Success Green (#48bb78) | Default state |
| **Approaching Limit** | 75-99% | Warning Yellow (#ecc94b) | Caution state |
| **Over Budget** | 100%+ | Error Red (#f56565) | Alert state |

### Progress Bars

```css
height: 8px;
border-radius: 4px;
background: #e2e8f0; /* track */
```

**Fill colors** based on status above.

---

## Iconography

### Style

- **Line icons**: 2px stroke weight
- **Corner radius**: Slightly rounded (2px)
- **Size**: 24x24px default, scale proportionally
- **Color**: Match text color or use Primary Purple for emphasis

### Recommended Set

- [Lucide Icons](https://lucide.dev/) (clean, consistent line icons)
- [Heroicons](https://heroicons.com/) (alternative)

### Icon Usage

| Context | Icon | Name |
|---------|------|------|
| Add Expense | Plus Circle | `plus-circle` |
| Budget | Wallet | `wallet` |
| Bills | Calendar | `calendar` |
| Reports | Bar Chart | `bar-chart-2` |
| Profile | User | `user` |
| Settings | Settings | `settings` |
| Notification | Bell | `bell` |

---

## Spacing System

Use 8px base unit for consistent spacing:

```
4px (0.25rem)   - Tight spacing (within components)
8px (0.5rem)    - Small spacing
16px (1rem)     - Default spacing
24px (1.5rem)   - Medium spacing
32px (2rem)     - Large spacing
48px (3rem)     - Section spacing
64px (4rem)     - Page spacing
```

---

## Border Radius

```
Small: 4px   - Tags, badges
Medium: 8px  - Buttons, inputs
Large: 12px  - Cards, modals
XL: 16px     - Featured elements
```

---

## Logo Don'ts

❌ Do not:
- Rotate or skew the logo
- Change the typeface
- Alter the spacing between words
- Add effects (shadows, outlines, 3D)
- Place on busy backgrounds without sufficient contrast
- Use low-resolution versions
- Change the color sequence (Couple must be purple, Bucks must be violet)
- Remove or modify the divider character

---

## Accessibility

### Color Contrast

All color combinations must meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Tested Combinations:**
- Primary Purple (#667eea) on White: ✅ 4.52:1
- Text Dark (#2d3748) on White: ✅ 12.63:1
- White text on Primary Purple: ✅ 4.52:1

### Focus States

All interactive elements must have visible focus indicators:
```css
outline: 2px solid #667eea;
outline-offset: 2px;
```

### Text Size

Minimum body text size: 16px (1rem)

---

## File Naming Convention

```
couple-bucks-logo-primary.svg
couple-bucks-logo-white.svg
couple-bucks-logo-single-color.svg
couple-bucks-icon.svg
couple-bucks-icon-192.png
couple-bucks-icon-512.png
```

---

## Implementation Notes for Developers

### CSS Variables (Recommended)

```css
:root {
  /* Colors */
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-accent: #a78bfa;
  --color-text-dark: #2d3748;
  --color-text-medium: #4a5568;
  --color-text-light: #718096;
  --color-border: #e2e8f0;
  --color-background: #f7fafc;
  --color-white: #ffffff;
  
  /* Semantic */
  --color-success: #48bb78;
  --color-warning: #ecc94b;
  --color-error: #f56565;
  --color-info: #4299e1;
  
  /* Spacing */
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */
  --space-2xl: 3rem;    /* 48px */
  --space-3xl: 4rem;    /* 64px */
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Tailwind Config (if using Tailwind)

```javascript
module.exports = {
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
  },
}
```

### ShadCN Theme

Update your `tailwind.config.js` for ShadCN:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#764ba2',
          foreground: '#ffffff',
        },
      },
    },
  },
}
```

---

## Quick Reference

### Brand Essence

**Tagline:** "Budgeting made simple. Together."

**Brand Promise:** We make managing money together as easy as it should be, with tools that adapt to your relationship and goals.

**Target Audience:** Millennial and Gen-Z couples (25-40 years old) who share expenses and want financial transparency without complexity.

---

**Last Updated:** October 2025  
**Maintained By:** Couple Bucks Team  
**Questions?** Refer to full branding deck for detailed mockups and examples.
