# Borrower Copilot — 5-Minute Walkthrough

## 0:00–0:30 Problem

**Scenario:** An Indian borrower wants to understand their borrowing capacity before approaching a lender. They need answers to four questions: should I borrow, how much am I eligible for, what's a fair interest rate, and what EMI should I agree to?

**Key message:** This is a borrower-side self-assessment tool, not a lender underwriting system. No login, no backend, no credit bureau integration, no personal data storage. Everything runs locally in the browser.

**The problem:** Most borrowers don't know the difference between what a lender may sanction and what they can safely afford. This leads to over-borrowing, financial stress, and poor negotiation outcomes.

---

## 0:30–1:30 Questionnaire and Adaptive Flow

**The user journey:**

1. **Landing screen:** "Know what you can safely borrow before you talk to a lender." Brief explanation of the tool's purpose, privacy guarantees (no login, no data stored, planning estimate only).

2. **Questionnaire (one question at a time):**
   - **Must questions (ask all borrowers):**
     - Q1: Loan purpose (wedding, business, scooter, etc.)
     - Q2: Desired loan amount
     - Q3: Income type (salaried/self-employed/informal) — *this branches the flow*
     - Q4: Net monthly income
     - Q5: Existing monthly EMI
     - Q6: Household essential expenses
     - Q7: Age
     - Q8: Credit score (or "I don't know")
     - Q9: Emergency savings
     - Q10: Employment/business history

   - **Adaptive branching after Q3:**
     - **Salaried:** S1 (employer tenure), S2 (income variable share), S3 (upcoming large expenses)
     - **Self-employed:** E1 (business age), E2 (ITR income), E3 (property/collateral), E4 (existing formal borrowing)
     - **Informal/variable:** I1 (income range), I2 (lowest recent monthly income), I3 (outstanding app loans), I4 (recent missed EMI)

   - **Progress indicator** shows question number and total
   - **Back navigation** allowed at any time
   - **Input validation** on each question
   - Appropriate controls: select for categorical, number for numeric, range for income ranges

3. **Review screen:** Show entered information, allow editing before proceeding

**Adaptive flow demonstration:**
- Salaried software engineer (Priya) gets employer tenure and income stability questions
- Kirana store owner (Ravi) gets business age, ITR income, and property questions
- Gig rider (Anita) gets income range, app loan, and payment behavior questions

---

## 1:30–2:30 Priya Walkthrough

**Borrower profile:** Priya, 29, Bengaluru, software engineer at MNC, ₹1.1L net monthly income, ₹14K existing car loan EMI, ₹28K rent, credit score 780, ₹2L emergency savings, 5 years employment, wedding purpose, requested ₹8 lakh.

**Walkthrough steps:**

1. **Landing → Questionnaire:** Priya sees the introduction and starts the questionnaire.

2. **Must questions (all answered):**
   - Q1: Loan purpose → Wedding
   - Q2: Desired amount → ₹8,00,000
   - Q3: Income type → Salaried (MNC/large company)
   - Q4: Net monthly income → ₹1,10,000
   - Q5: Existing EMI → ₹14,000
   - Q6: Household expenses → ₹0 (young, no dependents)
   - Q7: Age → 29
   - Q8: Credit score → 780
   - Q9: Emergency savings → ₹2,00,000
   - Q10: Employment history → 5 years

3. **Adaptive questions (salaried branch):**
   - S1: Employer tenure → 5 years
   - S2: Income variable share → 0% (fixed salary)
   - S3: Upcoming large expenses → None

4. **Results screen (auto-calculated):**

   - **O1 — Borrow / Don't Borrow / Borrow Less:** BORROW
     - Explanation: "Based on your profile, borrowing appears financially plausible IF you stay within recommended limits."

   - **O2 — Maximum Amount:**
     - Lender likely ceiling: ₹52,80,000
     - Borrower-safe ceiling: ₹16,80,000 (approx)
     - **Recommendation: Use the borrower-safe amount (₹16.8 lakh), NOT the lender's likely ceiling.**
     - Clearly explain: "A lender may plausibly consider up to approximately ₹52.8 lakh based on the information provided. However, your safe borrowing limit is ₹16.8 lakh. Do not treat the lender's maximum sanction as your target borrowing amount."

   - **O3 — Fair Interest Rate:**
     - Expected range: 8% – 10.5% p.a.
     - Planning range: 6% – 13.5% p.a.
     - Confidence: HIGH (all must questions answered, credit known, stable employment)
     - Explanation: "Your high credit score (750+) improves your expected rate. Your stable salaried employment supports a lower rate. This is a personal loan product."

   - **O4 — EMI / Monthly Outflow:**
     - Recommended maximum EMI: ₹35,500 (based on 45% FOIR)
     - Tenure trade-offs:
       - 36 months: EMI ₹25,089, Total interest ₹1.03 lakh
       - 48 months: EMI ₹20,390, Total interest ₹1.79 lakh
       - 60 months: EMI ₹17,278, Total interest ₹2.37 lakh
     - Stress test: 20% income drop → safe EMI drops from ₹35,500 to ₹28,400. Proposed EMI of ~₹20K remains manageable.

   - **Negotiation Card:** One-screen summary with:
     - Requested amount: ₹8,00,000
     - Lender likely ceiling: ₹52,80,000
     - Borrower-safe ceiling: ₹16,80,000
     - Recommended amount: ₹16,80,000
     - Maximum EMI: ₹35,500
     - Fair rate: 8%-10.5% p.a. (expected)
     - Estimated APR: ~10.4% p.a.
     - Main reasons: "Your high credit score (750+) and stable MNC employment qualify you for competitive rates. However, your safe borrowing limit is determined by your income and existing obligations."
     - Stress scenario: "If your income decreases by 20%, your safe EMI drops from ₹35,500 to ₹28,400. Your proposed EMI remains manageable."
     - Negotiation checklist: Interest rate, Processing fee, APR/total cost, Prepayment/foreclosure charges, Late fees, Insurance/add-ons, Other mandatory charges
     - Warning: "Do not treat the lender's maximum sanction as your target borrowing amount."

5. **Key talking points for this walkthrough:**
   - Why the lender ceiling (₹52.8L) is much higher than the safe ceiling (₹16.8L) — Principle #1: "A lender's maximum is NOT the same as the borrower's safe maximum."
   - Why "BORROW" is the outcome despite the safe ceiling being lower than the desired amount — Priya's income comfortably supports the EMI.
   - Why the confidence is HIGH — all must questions answered, credit score known, employment stable.
   - The importance of the negotiation card's warning about not treating the lender's maximum as the target.

---

## 2:30–3:30 Ravi/Anita Reasoning

### Ravi (Self-Employed)

**Borrower profile:** Ravi, 42, Mysuru, kirana store owner, 14 years business history, cash income ₹40K–₹80K/month, ITR income ₹4.2L/year, owns shop premises valued at ₹45L, no property debt, credit score unknown, spouse income ₹1.8K/month, requested ₹15L for "second stock line + delivery vehicle."

**Key routing reasoning:**

1. **Income type detection:** Q3 → Self-employed (ITR filed)

2. **Adaptive questions:**
   - E1: Business age → 14 years
   - E2: Documented ITR income → ₹4,20,000/year
   - E3: Property/collateral → Yes, shop premises, estimated value ₹45L
   - E4: Existing formal borrowing → None

3. **Lender likely ceiling calculation:**
   - Base: ₹60,000 (approx avg net monthly) × 40% × 12 = ₹28.8L
   - Income type factor (self-employed_itr): 0.7x → ₹20.16L
   - Credit score unknown: 10% uncertainty reduction → ₹18.14L
   - Collateral adjustment: property value ₹45L × 50% LTV = ₹22.5L, BUT documented income constrains this
   - Final lender ceiling: constrained by documented income → ~₹18L (with explicit warning)

4. **Key routing message:**
   - "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral."
   - Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc.
   - Property value is NOT equivalent to guaranteed borrowing eligibility.

5. **Product routing:**
   - Business history: 14 years (≥ 10 years)
   - Property: ₹45L with conservative LTV 50% → ₹22.5L secured ceiling
   - Credit score: unknown
   - **Recommended product: Loan Against Property (LAP)**
   - Rationale: Long business history + unencumbered property → secured product with lower rates
   - But: Documented income (₹4.2L/year) constrains the sanctioned amount
   - Warning: "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral."

6. **Borrow/Don't Borrow decision:**
   - Proposed EMI for ₹15L at estimated rates: ~₹15-18K/month
   - Safe EMI: calculated from ₹60K income × 35% FOIR - existing EMIs = ~₹15-18K
   - Decision depends on exact calculations, but the key point is the **product routing** toward secured/business financing rather than unsecured personal loan.

### Anita (Informal/Variable)

**Borrower profile:** Anita, 35, Hubballi, delivery-platform rider + home tailoring, monthly income ₹26K–₹30K, two children, spouse unemployed 8 months, three app loans with ₹35K outstanding at 30%+ interest, one EMI bounced last month, requested ₹1.5L for electric scooter, claimed benefit "could potentially double delivery runs."

**Key reasoning:**

1. **Income type detection:** Q3 → Informal/gig platform rider

2. **Adaptive questions:**
   - I1: Income range → ₹26,000–₹30,000
   - I2: Lowest recent monthly income → ₹26,000
   - I3: Outstanding app loans → Multiple (3-5)
   - I4: Recent missed/bounced EMI → Yes, one EMI bounced last month

3. **Affordability calculation:**
   - Net monthly income: ~₹28,000 (midpoint)
   - Existing EMI: ₹35,000 (three app loans)
   - Household expenses: ₹15,000 (two children)
   - Adjusted FOIR (informal): 35% × 0.8 = 28%
   - safeMonthlyOutflow: ₹28,000 × 28% - ₹35,000 - ₹15,000 = ₹7,840 - ₹50,000 = -₹42,160
   - **safeEMI: 0** (negative flow means don't borrow)

4. **Borrow/Don't Borrow decision:**
   - Rule R1: proposedEMI > safeEMI (any positive EMI > 0) → **DON'T BORROW**
   - Rule R2: debt burden > 50% of income AND income unstable → **DON'T BORROW**
   - Rule R3: recent EMI bounce + high-cost debt + low income → **DON'T BORROW**

5. **Key messages:**
   - "DON'T BORROW / BORROW LESS" is a legitimate outcome.
   - "The application must not assume that buying the scooter automatically doubles her income."
   - "Current affordability and existing high-cost debt should dominate the decision."
   - "Three app loans at 30%+ interest + one bounced EMI + informal income = very high risk."

6. **Product routing:**
   - Informal employment + high-cost existing debt → **None** (avoid additional borrowing)
   - Rationale: "Additional borrowing is not recommended given informal/variable income and existing high-cost app loans."
   - Focus on restructuring existing debt and increasing income stability before considering new borrowing.

7. **Stress scenario and recommendations:**
   - Scenario: Income decrease of 20% + existing app loan restructuring
   - Normal: EMI ₹15,000, Safe EMI ₹18,000 (tight but manageable)
   - Stress: EMI ₹15,000, Safe EMI ₹14,400 (EMI exceeds safe)
   - **Recommendation: "Avoid adding another high-cost loan now. Reduce/restructure existing expensive debt. Reassess scooter financing later. Show what income increase would need to occur before borrowing becomes safer."**

8. **Key talking points for this walkthrough:**
   - Why "DON'T BORROW" is the correct outcome for Anita — multiple red flags (high-cost debt, bounced EMI, unstable income).
   - Why the app should NOT assume the claimed income doubling from the scooter business.
   - The importance of distinguishing between productive borrowing purpose and current affordability.
   - How unknown credit score works → widened rate range, lower confidence, explicit uncertainty explanation.
   - How confidence works → LOW for Anita, with explicit language about planning estimates.
   - How APR differs from interest rate → estimated APR includes processing fee, quoted rate is just the interest component.

---

## 3:30–4:30 Rules Architecture

**The rules layer (src/rules/):**

1. **config.ts** — All configurable assumptions in one place:
   - FOIR_BASE: 40%, FOIR_STABLE_SALARIED: 45%, FOIR_VARIABLE: 35%
   - PROCESSING_FEE_PERCENT: 2%
   - LTV_CONSERVATIVE: 50%
   - Credit score thresholds, income type factors, product type factors
   - "DO NOT scatter these values across components. All rules refer to config."

2. **affordability.ts** — FOIR-based affordability calculations:
   - getAdjustedFoir(employmentType, creditScoreKnown, employmentStable)
   - calculateSafeMonthlyOutflow(netIncome, existingEmi, householdExpenses, adjustedFoir)
   - calculateSafeEMI(safeMonthlyOutflow)
   - calculateBorrowerSafeCeiling(safeEMI, netIncome, annualRate)
   - Full affordabilityResult with stress test

3. **eligibility.ts** — Lender likely ceiling:
   - getIncomeTypeFactor(incomeType)
   - getCreditScoreAdjustment(creditScore, creditKnown)
   - getBusinessHistoryAdjustment(businessYears)
   - calculateLenderLikelyCeiling({profile})
   - Explicit collateral warning text

4. **interestRate.ts** — Rate range model:
   - RateRange interface: { low, high, expectedLow, expectedHigh }
   - calculateFairRateRange({profile})
   - getRateExplanation({profile})
   - Credit score unknown → widen range, lower confidence, explain uncertainty
   - Employment type effects on rates
   - Product type adjustments

5. **apr.ts** — Estimated APR:
   - calculateEstimatedAPR({principal, rate, tenure, processingFee})
   - getAprComparison({principal, rate, tenure})
   - Clearly label: "Estimated APR — includes principal, interest rate, and processing fee."
   - Comparison: quoted interest rate vs all-in estimated cost

6. **emi.ts** — EMI calculation:
   - calculateEMI({principal, annualRate, tenureMonths})
   - calculateRecommendedMaxEMI({profile})
   - getTenureTradeoffs({principal, rate, income, expenses})
   - getEMIExplanation({recommendedMaxEMI, existingEmi, netIncome, safeEMI})

7. **confidence.ts** — Rule-based confidence:
   - calculateConfidence({question answers})
   - Level: HIGH (8-10 must questions answered), MEDIUM (5-7), LOW (0-4)
   - Language mapping for each level
   - Affects: range width, language tone, explanations given

8. **borrowDecision.ts** — Explicit decision rules:
   - makeBorrowDecision({profile})
   - Outcomes: BORROW, BORROW_LESS, DONT_BORROW
   - Six rules ordered from most to least conservative
   - Explainable outcomes with concrete explanations

9. **productRouting.ts** — Product type recommendation:
   - getProductRouting({profile})
   - Products: personal, business, LAP, two-wheeler, home
   - Routing rules for Priya (personal), Ravi (LAP/business), Anita (none)
   - Explicit warnings about collateral not = eligibility
   - getRoutingExplanation({result})

10. **index.ts** — Export all rules from single entry point

**Rule documentation (RULES.md):**
- Every rule documented: | What | Value | Why | Source |
- "My judgement" explicitly written for product judgements
- "DO NOT falsely label your own thresholds as RBI rules"
- All thresholds configurable in config.ts

**Separation of concerns:**
- UI never contains financial calculations
- Example of BAD: `const emi = income * 0.4 - existingEmi;` inside a React component
- Example of GOOD: `const result = calculateAffordability(profile, rules);`
- Rules are pure functions, no side effects, deterministic given same inputs

---

## 4:30–5:00 What I Would Build Next and What I Would Cut

**If given more time (beyond 16 hours):**

**Build next:**
1. **Backend integration** (optional): Connect to actual lender APIs for real-time rate checks — but this breaks the "no backend" principle, so would be optional
2. **LocalStorage persistence:** Save assessment state so users can resume later — nice UX but not material to core function
3. **Enhanced visual design:** More polished cards, subtle animations, dark mode — currently minimal by design
4. **More stress scenarios:** Income decrease + rate increase combined, job loss scenarios
5. **Regional language support:** Hindi, Tamil, Bengali versions for Indian borrowers
6. **Export/print functionality:** Generate PDF negotiation card for lender meetings
7. **Multiple loan scenarios:** Compare "borrow ₹8L vs ₹10L vs ₹12L" side by side
8. **Financial calculator library:** Expose the rules as a standalone npm package

**What I would cut if given less time:**

1. **Visual polish:** The current minimal design prioritizes clarity over aesthetics — this is intentional and should stay
2. **Additional product types:** Currently focused on personal, business, and LAP — gold loan and two-wheeler could be cut
3. **Advanced charts:** Graphs showing income vs expense breakdowns — tables are sufficient
4. **Multiple stress scenarios:** Currently one default stress scenario per profile — adding more has diminishing returns
5. **Comprehensive test suite:** Unit tests for all rules (currently planned but may not be fully implemented in 16 hours)
6. **Demo data validation:** Extra verification that Priya/Ravi/Anita produce exactly the documented numbers
7. **Accessibility audit:** Semantic HTML and basic a11y is included, but full WCAG audit would add time

**The core constraint:** The goal is not to build the biggest application, but to build the most defensible borrower-side lending decision tool possible within 12–16 hours. Every feature must earn its place by changing at least one output (Principle #6: "Questions must earn their place").

**Follow-up interview preparedness:** I have thorough answers ready for all 15 potential interview questions about question design, rule rationale, confidence model, FOIR assumptions, and trade-offs.