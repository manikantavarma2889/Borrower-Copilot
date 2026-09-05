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
Borrower-Copilot/
├── docs/
│   ├── PLAN.md
│   └── QUESTION_DESIGN.md
│
├── src/
│   ├── rules/
│   │   ├── affordability.ts
│   │   ├── apr.ts
│   │   ├── borrowDecision.ts
│   │   ├── confidence.ts
│   │   ├── config.ts
│   │   ├── eligibility.ts
│   │   ├── emi.ts
│   │   ├── index.ts
│   │   ├── interestRate.ts
│   │   └── productRouting.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── tests/
│   ├── affordability.test.ts
│   ├── apr.test.ts
│   ├── borrowDecision.test.ts
│   ├── confidence.test.ts
│   ├── eligibility.test.ts
│   ├── emi.test.ts
│   ├── interestRate.test.ts
│   └── productRouting.test.ts
│
├── .gitignore
├── README.md
├── RULES.md
├── WALKTHROUGH.md
├── index.html
├── jest.config.cjs
├── package.json
├── package-lock.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## How to Run

```
npm install
npm run dev
```

This starts the Vite development server. The app loads locally in the browser at `http://localhost:5173` (or similar port).

```
npm test
```

Run unit tests for the financial rules.

```
npm run build
```

Build for production (static files, no backend required).

## How Rules Work

All financial rules are centralized in [`src/rules/`](src/rules/), keeping financial logic separate from the React UI.

The main configuration is in [`src/rules/config.ts`](src/rules/config.ts).

**Every rule is documented in [`RULES.md`](RULES.md)** using the format:

| What | Value | Why | Source |
| ---- | ----- | --- | ------ |

Assumptions that are **"my judgement"** are explicitly marked as such.

> **Important:** Product assumptions and thresholds are not falsely presented as RBI rules.

### Financial Rule Modules

| Module                                             | Purpose                                        |
| -------------------------------------------------- | ---------------------------------------------- |
| [`config.ts`](src/rules/config.ts)                 | Centralized thresholds, bands and assumptions  |
| [`affordability.ts`](src/rules/affordability.ts)   | FOIR-based borrower-safe affordability         |
| [`eligibility.ts`](src/rules/eligibility.ts)       | Lender-likely eligibility estimate             |
| [`interestRate.ts`](src/rules/interestRate.ts)     | Fair interest-rate bands                       |
| [`apr.ts`](src/rules/apr.ts)                       | Estimated all-in APR including processing fees |
| [`emi.ts`](src/rules/emi.ts)                       | EMI and tenure calculations                    |
| [`borrowDecision.ts`](src/rules/borrowDecision.ts) | Borrow / Don't Borrow / Borrow Less decision   |
| [`productRouting.ts`](src/rules/productRouting.ts) | Product/route recommendations                  |
| [`confidence.ts`](src/rules/confidence.ts)         | Confidence scoring and uncertainty handling    |
| [`index.ts`](src/rules/index.ts)                   | Central exports for the rule modules           |

### Separation of Concerns

The UI does **not** contain financial calculations.

**Bad:**

```ts
const emi = income * 0.4 - existingEmi;
// Financial calculation inside a React component — BAD
```

**Good:**

```ts
const result = calculateAffordability(profile, rules);
// Financial logic stays inside src/rules/
```

This makes the rules easier to test, audit, explain and change without modifying the UI.

### Configurable Assumptions

Key configurable assumptions are centralized in [`src/rules/config.ts`](src/rules/config.ts), including:

* FOIR thresholds by income stability
* Income-type eligibility factors
* Credit-score assumptions and rate bands
* Business-history factors
* Processing-fee assumptions
* Tenure options
* Stress-test assumptions
* Collateral/LTV assumptions

To understand the reasoning behind each assumption, see [`RULES.md`](RULES.md).


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

