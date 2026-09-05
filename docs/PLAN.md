# Borrower Copilot — Planning Document

## 1. Problem Statement

Build a personal assistant that helps Indian borrowers answer four questions before approaching a lender:
1. Should I borrow at all?
2. How much am I really eligible for?
3. What is a fair interest rate for me?
4. What EMI should I agree to?

Then generate a one-page Negotiation Card. This is a borrower-side self-assessment tool, NOT a credit scoring or lender underwriting system. All data stays local in the browser.

## 2. Target Users

Indian borrowers across employment types:
- Salaried employees (MNC, startups, government)
- Self-employed business owners (kirana stores, informal businesses)
- Informal/variable income workers (gig platform riders, freelancers)

## 3. Product Goals

- Transparent borrower-side self-assessment
- Mobile-first, locally runnable web app
- No login, no backend, no data storage
- Clear distinction between lender ceiling and borrower-safe ceiling
- "Don't borrow" as a legitimate outcome
- Adaptive questionnaire that varies by employment type
- India-focused: INR, Indian loan terminology, Indian affordability concepts
- Transparent assumptions clearly distinguished from regulations

## 4. Non-Goals

- Credit bureau integration
- Machine learning models
- Real lender APIs
- Authenticated user accounts
- Database persistence
- Fake precision (single rates, arbitrary magic numbers)
- Gamification or excessive animations

## 5. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | Questionnaire with ~8-10 must questions, adaptive by employment type |
| FR2 | Four outputs: O1 (borrow decision), O2 (max amounts), O3 (interest rate), O4 (EMI) |
| FR3 | Negotiation Card with key recommendations |
| FR4 | Demo borrowers: Priya, Ravi, Anita with reproducible results |
| FR5 | Rule-based financial calculations (no ML) |
| FR6 | Configurable rule assumptions (FOIR, rate adjustments, processing fee) |
| FR7 | Error handling for edge cases (zero income, unknown credit score, etc.) |
| FR8 | Accessibility: semantic HTML, keyboard navigation, screen reader support |

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Load in under 5 minutes; `npm install && npm run dev` |
| Size | Minimal dependencies; no backend, no auth, no database |
| Mobile | Mobile-first responsive design |
| Maintainability | Rules separated from UI; configurable in one place |
| Testing | Unit tests for all financial calculations |
| Privacy | No data persistence; localStorage explicitly documented if used |

## 7. User Personas

| Persona | Age | Employment | Income Type | Key Concerns |
|---------|-----|------------|-------------|--------------|
| Priya | 29 | Salaried | MNC software engineer | Strong profile, don't over-borrow |
| Ravi | 42 | Self-employed | Kirana store owner | Productive purpose, collateral, variable income |
| Anita | 35 | Informal | Gig rider + tailoring | Don't borrow, existing high-cost debt |

## 8. User Stories

- As a borrower, I want to answer questions about my income and obligations so I can understand what I can safely borrow.
- As a borrower, I want to see a clear recommendation (borrow / borrow less / don't borrow) with explanations.
- As a borrower, I want to see ranges rather than precise numbers to account for uncertainty.
- As a borrower, I want to see a negotiation card I can use when speaking with a lender.
- As a interviewer, I want to load demo borrowers (Priya/Ravi/Anita) to verify the flow.
- As a user, I want all assumptions and rules to be transparent and editable.

## 9. Complete User Journey

```
1. Landing/Introduction → "Know what you can safely borrow before you talk to a lender"
2. Questionnaire → Adaptive, one question at a time, progress indicator
   - Core must questions (all users): loan purpose, desired amount, income type,
     net monthly income, existing EMI, household expenses, age, credit score
   - Adaptive questions vary by employment type
3. Review → Show entered information, allow editing
4. Results → Show O1-O4 plus negotiation card
5. Stress Test → Normal vs stress scenario (income drop, rate increase)
6. Negotiation Card → One-screen concise summary

## 10. Screen List

1. Landing / Introduction
2. Questionnaire (adaptive, one question at a time)
3. Review (entered information, editable)
4. Results (O1-O4, negotiation card)
5. Stress Test (normal vs stress)
6. Negotiation Card (one-screen summary)

## 11. Questionnaire Strategy

### Must Questions (ask all borrowers, ~8-10)

| Question | Purpose |
|----------|---------|
| Q1: Loan purpose | Determines product type and risk category |
| Q2: Desired loan amount | Input for ceiling calculations |
| Q3: Income type (salaried/self-employed/informal) | Adaptive branching, FOIR threshold |
| Q4: Net monthly income | Base for affordability calculations |
| Q5: Existing monthly EMI | FOIR denominator |
| Q6: Household essential expenses | FOIR adjustment |
| Q7: Age | Tenure eligibility |
| Q8: Credit score (or "I don't know") | Interest rate range, confidence |
| Q9: Emergency savings | Stress buffer, confidence |
| Q10: Employment/business history | Product routing, confidence |

### Adaptive Questions

**Salaried:**
- Q11: Employer tenure
- Q12: Income stability / variable share
- Q13: Upcoming large expenses

**Self-employed:**
- Q11: Business age
- Q12: Documented ITR income vs cash flow
- Q13: Property/collateral
- Q14: Existing formal borrowing

**Informal/variable:**
- Q11: Income range (low/high monthly)
- Q12: Lowest recent monthly income
- Q13: Outstanding debt / app loans
- Q14: Recent missed/bounced EMI

Every question must change at least one output. If a question doesn't influence any calculation, rule, range, confidence score, routing decision, or recommendation, it is removed.

## 12. Adaptive Branching Strategy

### Employment Type Detection (Q3)

Based on income type answer, branch to appropriate questionnaire:

- **Salaried** → Show salary-specific questions (employer tenure, income stability)
- **Self-employed** → Show business-specific questions (business age, ITR, collateral)
- **Informal/variable** → Show informal-specific questions (income range, app loans, missed EMI)

### Branching Rules

- Salaried borrowers do NOT see self-employed or informal questions
- Self-employed borrowers do NOT see informal questions
- Informal borrowers skip straight to stress-relevant outputs
- All borrowers answer core must questions first, then adaptive branch

## 13. Data Model

```
BorrowerProfile {
  id: string
  name: string
  age: number
  incomeType: 'salaried' | 'self-employed' | 'informal'
  netMonthlyIncome: number
  existingEmi: number
  householdExpenses: number
  desiredLoanAmount: number
  loanPurpose: string
  creditScore: number | 'unknown'
  emergencySavings: number | null
  employmentHistory: number | null  // years
  businessHistory: number | null      // years (self-employed)
  propertyValue: number | null        // self-employed/secured
  propertyDebt: number | null
  cashIncomeLow: number | null        // informal
  cashIncomeHigh: number | null       // informal
  existingLoans: LoanDetail[]
  responses: QuestionResponse[]
}

Question {
  id: string
  text: string
  type: 'text' | 'number' | 'select' | 'range'
  options: string[] | null
  required: boolean
  employmentTypes: 'salaried' | 'self-employed' | 'informal' | 'all'
}

QuestionResponse {
  questionId: string
  value: string | number | null
  isUnknown: boolean
}

DecisionResult {
  borrowDecision: 'BORROW' | 'BORROW_LESS' | 'DONT_BORROW'
  lenderLikelyCeiling: number
  borrowerSafeCeiling: number
  recommendedAmount: number
  fairRate: RateRange
  estimatedApr: number
  recommendedEmi: number
  tenureTradeoffs: TenureTradeoff[]
  stressResult: StressResult
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  mainReasons: string[]
  negotiationChecklist: string[]
}

RateRange {
  low: number      // annual interest rate %
  high: number
  expectedLow: number
  expectedHigh: number
}

AffordabilityResult {
  baseFoir: number
  adjustedFoir: number
  safeMonthlyOutflow: number
  stressMonthlyOutflow: number
}

StressResult {
  scenario: string
  normalEmi: number
  stressEmi: number
  normalAffordable: boolean
  stressAffordable: boolean
}
```

## 14. Business-Rule Architecture

All financial rules centralized in `src/rules/`. Each rule module exports pure functions that take a `BorrowerProfile` and return calculated values. UI never contains financial logic.

Rule modules:
- `affordability.ts` — FOIR, safe EMI, safe loan amount
- `eligibility.ts` — lender likely ceiling
- `interestRate.ts` — rate range calculation
- `emi.ts` — standard EMI calculation, tenure trade-offs
- `apr.ts` — estimated APR with processing fee
- `confidence.ts` — rule-based confidence model
- `productRouting.ts` — product type recommendation
- `borrowDecision.ts` — borrow/borrow less/don't borrow logic

## 15. Calculation Architecture

```
BorrowerProfile
    ↓
Question Engine (extract responses, apply adaptive branching)
    ↓
Decision Engine
    ├──→ borrowDecision.ts → BORROW / BORROW_LESS / DONT_BORROW
    ├──→ eligibility.ts → lender likely ceiling
    ├──→ affordability.ts → borrower safe ceiling
    ├──→ interestRate.ts → fair rate range
    ├──→ apr.ts → estimated APR
    ├──→ emi.ts → recommended EMI, tenure trade-offs
    └──→ confidence.ts → confidence level
    ↓
Results synthesis → Negotiation Card
```

## 16. Confidence Architecture

Rule-based, not ML. Based on data completeness and quality:

| Confidence | Conditions | Effect |
|------------|------------|--------|
| HIGH | All must questions answered, credit score known, employment stable | Narrower ranges, more specific explanations |
| MEDIUM | Some must questions answered, credit score unknown, minor gaps | Wider ranges, "some information is missing" language |
| LOW | Many unknowns, credit score unknown, income unstable | Widest ranges, explicit uncertainty explanation, "treat as planning estimate" |

Confidence affects: range width, language tone, explanations given.

## 17. Product Routing Logic

Products considered based on profile:

| Profile | Recommended Product Route |
|---------|--------------------------|
| Priya (salaried, strong credit) | Personal loan |
| Ravi (self-employed, business history, property) | Business loan / Loan Against Property |
| Anita (informal, high-cost existing debt) | Avoid additional borrowing, restructure existing |

Key routing factors:
- Collateral improves secured-product potential but LTV applies
- Documented income constraints are explicit
- Product recommendations are guidance, not guarantees

## 18. Edge Cases

- Zero or negative income → "DON'T BORROW" with explanation
- Expenses exceeding income → "DON'T BORROW"
- Unknown credit score → Widen rate range, lower confidence, explain uncertainty
- EMI > income → immediate "DON'T BORROW"
- Requested amount >> eligible → recommend much smaller amount
- Recent EMI bounce + high-cost debt + low income → "DON'T BORROW"
- Product routing should not treat property value as guaranteed eligibility

## 19. Testing Strategy

### Unit Tests (minimum)

- EMI calculation with known inputs
- APR calculation (principal + interest + processing fee)
- FOIR base and adjusted calculations
- Safe EMI given income, expenses, existing EMI
- Safe loan amount given FOIR and income
- Lender ceiling given income type, credit profile, existing EMI
- Rate ranges with known/unknown credit score
- Confidence level given data completeness
- Borrow/borrow less/don't borrow decision rules
- Stress scenario calculations
- Priya/Ravi/Anita reproduce expected outcomes
- Rule change impact: verify that changing a rule changes outputs

### Integration Tests

- Full flow from landing to negotiation card
- Adaptive branching works correctly for each employment type
- Demo borrowers produce reproducible results
- Edge cases handled gracefully

## 20. Deployment Strategy

- Local only: `npm run dev` starts Vite dev server
- No build deployment needed (no backend)
- `npm run build` produces static files
- `npm test` runs Jest unit tests
- Can be hosted anywhere static (GitHub Pages, Netlify, etc.)
- All calculations client-side, no API calls required

## 21. Known Limitations

- No real-time lender rate data
- Assumptions are product-judgement, not RBI regulations
- Property collateral not independently verified
- Income self-reporting not independently validated
- Emergency savings input may be optimistic
- Stress scenarios are illustrative, not predictive
- Does not constitute financial advice