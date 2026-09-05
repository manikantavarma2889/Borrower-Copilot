# Borrower Copilot

## Project Name
Borrower Copilot — Lokta Build Challenge

## Problem
Indian borrowers often don't understand the difference between what a lender may sanction and what they can safely afford. This leads to over-borrowing, financial stress, and poor negotiation outcomes. Most borrowers accept the lender's maximum sanction as their target, which is financially dangerous.

**The core problem:** A lender's maximum is NOT the same as the borrower's safe maximum. This application bridges that gap with transparent, rules-based calculations.

## Solution
A personal assistant that helps Indian borrowers answer four questions before approaching a lender:

1. **Should I borrow at all?** — Explicit decision: BORROW / BORROW LESS / DON'T BORROW
2. **How much am I really eligible for?** — Two separate numbers: lender likely sanction vs. borrower-safe amount, with clear recommendation
3. **What is a fair interest rate for me?** — Rate range (not a single rate), with confidence level and explicit uncertainty handling
4. **What EMI should I agree to?** — Recommended maximum EMI, tenure trade-offs, total repayment/interest, stress test

Plus: A one-page Negotiation Card the borrower can use when speaking with a lender.

**Key distinction:** This is NOT a credit scoring system and NOT a lender underwriting system. It is a transparent borrower-side self-assessment tool.

## Key Features

- **No login, no backend, no data storage** — Everything runs locally in the browser
- **Mobile-first, responsive design** — Works on phones and tablets
- **India-focused** — INR, Indian loan terminology, Indian borrower scenarios
- **Transparent assumptions** — Every rule and threshold documented, distinguished from RBI regulations
- **Ranges, not single rates** — "Unknown is NEVER zero" — wider ranges when information is missing
- **Adaptive questionnaire** — Different questions for salaried, self-employed, and informal borrowers
- **Borrower-safe ceiling** — Independently calculated from lender ceiling
- **Honest confidence model** — Rule-based, not ML, based on data completeness
- **Stress test on every result** — Normal vs stress scenario (income drop, rate increase)
- **Three reproducible demo borrowers** — Priya, Ravi, Anita
- **Negotiation Card** — One-screen summary with key recommendations and checklist

## Demo Borrowers

The application reproduces three required scenarios:

### Priya (Salaried, Strong Profile)
- Age: 29, Bengaluru, Software Engineer at MNC
- Net monthly income: ₹1,10,000, Existing EMI: ₹14,000
- Credit score: 780, Emergency savings: ₹2,00,000
- Loan purpose: Wedding, Requested: ₹8,00,000
- **Expected:** BORROW with recommended amount ~₹16.8 lakh (borrower-safe ceiling). High confidence. Personal loan product.

### Ravi (Self-Employed, Business History + Collateral)
- Age: 42, Mysuru, Kirana store owner
- Business: 14 years, ITR income: ₹4.2L/year, Shop premises: ₹45L (no debt)
- Credit score: Unknown, Spouse income: ₹18,000/month
- Loan purpose: Second stock line + delivery vehicle, Requested: ₹15,00,000
- **Expected:** Product routing toward Loan Against Property (LAP) or business loan. Not treated as unsecured personal loan. Explicit warning: "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral."

### Anita (Informal, High-Cost Debt)
- Age: 35, Hubballi, Delivery-platform rider + home tailoring
- Income: ₹26,000–₹30,000/month, Two children, Spouse unemployed 8 months
- Existing: Three app loans, ₹35,000 outstanding at 30%+, one EMI bounced last month
- Loan purpose: Electric scooter, Requested: ₹1,50,000
- **Expected:** DON'T BORROW. Current affordability and existing high-cost debt dominate. Do not assume scooter financing automatically doubles income.

## Technical Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **No backend** — All calculations client-side
- **No authentication** — Anonymous use
- **No database** — All data in memory
- **No external API dependency** for core functionality

## Architecture

```
UI
↓
Question Engine (adaptive branching by employment type)
↓
Borrower Profile (from responses)
↓
Decision Engine (borrow/borrow less/don't borrow)
↓
Rules Layer (src/rules/) — all financial calculations
  ├── config.ts — all configurable assumptions
  ├── affordability.ts — FOIR, safe EMI, safe loan amount
  ├── eligibility.ts — lender likely ceiling
  ├── interestRate.ts — rate range model
  ├── apr.ts — estimated APR with processing fee
  ├── emi.ts — EMI calculation, tenure trade-offs
  ├── confidence.ts — rule-based confidence model
  ├── borrowDecision.ts — explicit decision rules
  └── productRouting.ts — product type recommendation
↓
Results (O1-O4) → Negotiation Card
```

## File Structure

```
borrower-copilot/
├── README.md
├── RULES.md
├── RUNTHROUGHS.md
├── WALKTHROUGH.md
│
├── docs/
│   ├── PLAN.md
│   └── QUESTION_DESIGN.md
│
├── src/
│   ├── App.tsx — main React component
│   ├── types/ — TypeScript type definitions
│   ├── rules/ — all financial rules (config + 8 modules)
│   ├── components/ — UI components
│   ├── pages/ — screen pages (landing, questionnaire, results, etc.)
│   ├── data/ — questionnaire data
│   ├── utils/ — helper functions
│   ├── hooks/ — React hooks
│   └── App.tsx
│
├── tests/
│   └── unit tests for financial rules
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── ...
```

## How to Run

```
npm install
npm run dev
```

This starts the Vite development server. The app loads locally in the browser at `http://localhost://5173` (or similar port).

```
npm test
```

Run unit tests for the financial rules.

```
npm run build
```

Build for production (static files, no backend required).

## How Rules Work

All financial rules are centralized in `src/rules/`, exported via `src/rules/index.ts`. The configuration is in `src/rules/config.ts`.

**Every rule is documented in RULES.md** using the format:

| What | Value | Why | Source |

Assumptions that are "my judgement" are explicitly marked as such. "DO NOT falsely label your own thresholds as RBI rules."

**Important:** The UI never contains financial calculations. Example of BAD:

```tsx
const emi = income * 0.4 - existingEmi;  // inside React component — BAD
```

Example of GOOD:

```ts
const result = calculateAffordability(profile, rules);  // rules called from outside UI
```

## Assumptions

Key configurable assumptions (all in `src/rules/config.ts`):

- **FOIR_BASE:** 40% — Conservative baseline for personal loans
- **FOIR_STABLE_SALARIED:** 45% — Slightly higher for stable salaried profiles
- **FOIR_VARIABLE:** 35% — Stronger buffer for variable/informal income
- **PROCESSING_FEE_PERCENT:** 2% — Typical Indian personal loan processing fee
- **LTV_CONSERVATIVE:** 50% — Conservative loan-to-value for secured products
- **INCOME_DROP_STRESS:** 20% — Standard stress test income drop
- **CREDIT_SCORE_THRESHOLDS:** 750 (excellent), 700 (good), 600 (fair), 500 (poor)
- **INCOME_TYPE_FACTORS:** 1.0 (salaried MNC) to 0.5 (informal)

**None of these are claimed as RBI regulations.** They are product planning assumptions, conservative by design (goal: borrower protection, not maximizing loan amount).

## Limitations

- No real-time lender rate data
- Assumptions are product judgements, not RBI regulations
- Property collateral not independently verified
- Income self-reported (not independently validated)
- Emergency savings input may be optimistic
- Stress scenarios are illustrative, not predictive
- Does not constitute financial advice
- No backend, no authentication, no database
- Not suitable for all borrower situations (edge cases apply)

