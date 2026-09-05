# Borrower Copilot — Follow-Up Interview Notes

## 1. Why did you choose these questions?

The 10 must questions + adaptive branch questions were designed to cover all four outputs (O1-O4) while varying by employment type. Each question has a documented effect on at least one output:

- **Q1 (Loan purpose):** Determines product type and risk category. Wedding vs. business vs. scooter require different considerations and product routing.
- **Q2 (Desired amount):** Required input for ceiling calculations. The gap between desired and eligible is the core insight the tool provides.
- **Q3 (Income type):** The most important branching factor. Salaried, self-employed, and informal have vastly different income stability, documentation requirements, and FOIR thresholds. This single question determines which follow-up questions apply.
- **Q4 (Net monthly income):** Foundational input for all affordability calculations. Without this, no calculation is possible.
- **Q5 (Existing EMI):** Critical for FOIR calculation. The difference between gross income and existing obligations determines borrowing capacity.
- **Q6 (Household expenses):** Indian affordability considers not just EMIs but also family living costs. This adjusts the FOIR downward from the theoretical maximum.
- **Q7 (Age):** Determines maximum feasible tenure. A 25-year-old can take a 30-year tenure; a 55-year-old cannot.
- **Q8 (Credit score):** Perhaps the single most important rate determinant. Known score → narrower range, better rate. Unknown → wide range, lower confidence, explicit uncertainty.
- **Q9 (Emergency savings):** Affects stress test relevance. If the borrower has 6 months expenses saved, a 20% income drop is less critical than if they have 0 saved.
- **Q10 (Employment/business history):** Years in current role/business indicates stability. Longer history = more confidence = narrower ranges.

Adaptive questions were designed for each employment type to capture profile-specific factors that affect at least one output. Every additional question must change at least one output — if a question doesn't influence any calculation, rule, range, confidence score, routing decision, or recommendation, it is removed.

## 2. Why is lender ceiling different from safe ceiling?

This is the most important principle (Principle #1): "A lender's maximum is NOT the same as the borrower's safe maximum."

- **Lender likely ceiling** = "How much a lender may plausibly sanction based on the information provided." Calculated from income, credit profile, existing EMI, employment type, and collateral. This represents what the lender might offer, not what the borrower can afford.

- **Borrower-safe ceiling** = "How much the borrower can sustainably afford based on income, expenses, existing obligations, and emergency buffer." Calculated using FOIR-style planning approach with conservative thresholds.

- **The gap exists because:** Lenders may offer credit based on theoretical repayment capacity, market competition, or relationship-based factors. Borrowers must consider real-world income stability, unexpected expenses, income shocks, and the need for emergency buffers.

- **Why this matters:** If a borrower uses the lender's maximum as their target, they risk over-borrowing, payment stress, default, and financial distress. The tool explicitly recommends the borrower-safe amount as the target, not the lender's ceiling.

- **Example from Priya:** Lender likely ceiling: ₹52.8 lakh. Borrower-safe ceiling: ₹16.8 lakh. The difference (₹36 lakh) represents the gap between what a lender might offer and what Priya can safely afford. The tool recommends the borrower-safe amount as the target.

## 3. Why should Ravi be routed toward secured/business financing?

Ravi's profile has several factors that make unsecured personal loan suboptimal:

- **Self-employed with 14 years business history:** Demonstrates productive borrowing capability and stable track record.
- **Unencumbered property (shop premises valued at ₹45L):** Enables secured product routing. However, property value is NOT equivalent to guaranteed borrowing eligibility.
- **Documented ITR income (₹4.2L/year):** This is the constraint. Even though collateral exists, lenders use documented income for qualification.
- **No formal loan history:** Never taken a formal loan before, which is different from a borrower with good repayment history.

**Key routing message:** "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc."

**Product routing recommendation:** Loan Against Property (LAP) or business loan, rather than unsecured personal loan. Rationale: Long business history + unencumbered property → secured product with lower rates than personal loans. But: Documented income constrains the sanctioned amount.

**Why not personal loan?** A personal loan for ₹15L would be unsecured, have higher rates, and the sanctioned amount would be constrained by the ₹4.2L/year ITR income. A LAP could offer lower rates and higher amounts, but requires property valuation, legal checks, and the borrower must be comfortable pledging property.

## 4. Why should Anita potentially be told not to borrow?

Anita's profile has multiple risk factors that make borrowing inadvisable:

- **Informal/variable income:** ₹26K–₹30K/month with no guaranteed minimum. Income can fluctuate significantly month to month.
- **Three app loans with 30%+ interest:** High-cost existing debt that dominates the affordability calculation.
- **₹35K existing outstanding:** Already a significant debt burden.
- **One EMI bounced last month:** Strong negative signal about payment behavior.
- **Two children, spouse unemployed 8 months:** Household expenses and income instability.
- **Requested ₹1.5L for electric scooter:** The app must NOT assume that buying the scooter automatically doubles her income.

**Key decision rules that fire:**
- Rule R1: proposedEMI > safeEMI (any positive EMI > 0 safe EMI) → DON'T BORROW
- Rule R2: debt burden > 50% of income AND income unstable → DON'T BORROW
- Rule R3: recent EMI bounce + high-cost debt + low income → DON'T BORROW

**Key messages:**
- "DON'T BORROW" is a legitimate outcome. The application must not shy away from this outcome.
- "The application must not assume that buying the scooter automatically doubles her income."
- "Current affordability and existing high-cost debt should dominate the decision."
- "Potentially recommend: avoid adding another high-cost loan now, reduce/restructure existing expensive debt, reassess scooter financing later, show what income increase would need to occur before borrowing becomes safer."

**Why not simply say "borrow less"?** Because with negative safe monthly outflow (existing EMI + household expenses exceed the FOIR-adjusted income), even ₹0 borrowing would strain the budget. The issue is not just the new loan — it's the existing debt load.

## 5. How does unknown credit score work?

When credit score is "I don't know" or unknown:

- **Rate range widening:** The range increases by 5-7 percentage points to reflect uncertainty. Example: instead of 8%-10%, the range becomes 10%-17% or wider.
- **Confidence lowering:** Confidence level drops at least one tier (HIGH → MEDIUM, MEDIUM → LOW).
- **Explicit uncertainty explanation:** The UI displays: "Your credit score is unknown. The rate range is wider to reflect this uncertainty. A lender may offer rates anywhere in this range based on a full credit assessment."
- **Lender ceiling reduction:** 10% uncertainty reduction applied to the lender likely ceiling. This is documented and explained.
- **Expected range adjustment:** expectedLow drops (lender cannot assess risk precisely), expectedHigh increases (more risk premium built in).
- **Language tone:** Shifts from "Your rate is likely X%" to "A lender might possibly consider Y%."

**Example from Ravi:** Credit score unknown → rate range widened, confidence LOW (at least initially, until other profile factors are considered). Explanation: "Your credit score is unknown, so the rate range is wider to reflect this uncertainty."

**Example from Anita:** Credit score unknown + informal income + high-cost debt → confidence LOW, widest rate ranges, explicit "treat as planning estimate" language.

## 6. How does confidence work?

Confidence is rule-based, not machine learning. Based on data completeness and quality.

**Scoring:** 10 must questions, 1 point each for well-answered questions. Score 0-10.

- **HIGH (8-10 points):** All must questions answered, credit score known, employment stable. Language: "Your profile has enough information for a relatively narrow planning range." Rate ranges at designed width. Specific explanations.

- **MEDIUM (5-7 points):** Some must questions answered, minor gaps. Language: "Some information is missing, so the rate/eligibility range is wider." Ranges widened 20-30%. Explanations note missing information.

- **LOW (0-4 points):** Many unknowns, credit score unknown, income unstable. Language: "Several important inputs are unknown. Treat this as a planning estimate, not a precise prediction." Ranges widened 40-50%. All explanations note uncertainty. Most conservative outcomes.

**How confidence affects outputs:**

- **Range width:** HIGH → nominal width. MEDIUM → 20-30% wider. LOW → 40-50% wider.
- **Language tone:** HIGH → specific, confident. MEDIUM → cautious but definite. LOW → "planning estimate," "seek personalized advice."
- **Decision routing:** HIGH → BORROW/BORROW_LESS possible. LOW → strongly toward BORROW_LESS or DONT_BORROW.
- **Explanations:** Each confidence level has specific template language that is inserted into the output.

**Example from Priya (HIGH confidence):** All 10 must questions answered, credit score 780 known, employer tenure 5 years (stable). Confidence HIGH. Rate explanation: "Your high credit score (750+) improves your expected rate. Your stable salaried employment supports a lower rate. This is a personal loan product. Your profile has enough information for a relatively narrow planning range. Expected rate: 8%-10.5% p.a."

**Example from Anita (LOW confidence):** Informal income, high-cost app loans, bounced EMI, credit score unknown. Confidence LOW. Rate explanation: "Informal/variable income; rate range reflects income uncertainty. Your credit score is unknown, so the rate range is wider to reflect this uncertainty. Several important inputs are unknown. Treat this as a planning estimate. Expected rate: 12%-25% p.a."

## 7. How is APR different from interest rate?

- **Interest rate:** The stated annual percentage rate charged on the principal. This is the "quoted rate" — e.g., "10% p.a." It does not include other fees or charges.

- **APR (Annual Percentage Rate):** The effective cost of borrowing, including the interest rate PLUS other charges (primarily processing fee in this tool). It represents the "all-in" cost of the loan.

- **Key difference:** The APR is typically higher than the quoted interest rate because it includes the processing fee spread over the loan term.

- **Example:** ₹8 lakh loan at 10% p.a. interest, 5-year tenure, 2% processing fee:
  - Quoted interest rate: 10% p.a.
  - Processing fee: 2% of ₹8 lakh = ₹16,000 (upfront)
  - Estimated APR (all-in): ~10.4% p.a. (approximately 0.4% above the quoted rate for a 5-year loan)
  - Total repayment: ₹12,16,000 (principal ₹8L + interest ₹4L + processing fee ₹16K)
  - Total interest: ₹4,00,000 (based on 10% rate)
  - Processing fee: ₹16,000

- **Why this matters for negotiation:** A lender might quote "10% interest" but the actual APR is 10.4%. The borrower should compare the quoted rate vs. the estimated APR to understand the true cost. The tool allows the user to compare both.

- **What's NOT included in the estimated APR:** Prepayment/foreclosure fees, late payment fees, insurance add-ons, other mandatory charges beyond the stated processing fee. These are noted in the disclaimer: "Estimated APR includes principal, interest rate, and processing fee. Other charges may apply."

## 8. Why did you choose these FOIR assumptions?

FOIR (Fixed Obligations to Income Ratio) is the central affordability metric:

- **FOIR_BASE: 40%** — Conservative baseline used by many Indian lenders for personal loans. Allows for food, transport, utilities beyond EMIs. This is a "My judgement — conservative planning assumption, not an RBI regulation."

- **FOIR_STABLE_SALARIED: 45%** — Salaried employees with stable MNC/government jobs have more predictable income. Slightly higher allocation is justified. Also "My judgement."

- **FOIR_VARIABLE: 35%** — Self-employed/informal income is less predictable. Stronger buffer required. "My judgement."

- **FOIR_STRESS: 30%** — Stress test floor. What remains after income shock. "My judgement."

- **MINIMUM_EMERGENCY_BUFFER: 10%** of net monthly income. Ensures borrower retains some buffer after all obligations. "My judgement."

**Rationale:** These are planning assumptions, not RBI regulations. They are conservative by design (Principle #10: "Do not maximize loan amount just because the user qualifies. The goal is borrower protection."). The values can be configured in config.ts if the user wants to adjust them.

**Follow-up:** "What happens if FOIR changes from 40% to 35%?" Answer: The safe EMI and borrower-safe ceiling would decrease, making borrowing less affordable. For Priya (salaried), the adjusted FOIR would drop from 45% to 35%, reducing safeMonthlyOutflow from ₹35,500 to ₹27,500 (₹1.1L × 35% - ₹14K). For Anita (informal), the FOIR would be already conservative at 35% × 0.8 = 28%, so the change would have less relative impact.

## 9. Which assumptions are your judgement?

Explicitly identified in RULES.md and config.ts:

**Marked as "My judgement":**
- FOIR_BASE: 40% (conservative planning assumption)
- FOIR_STABLE_SALARIED: 45% (stable salaried deserves slightly higher allocation)
- FOIR_VARIABLE: 35% (variable income requires stronger buffer)
- FOIR_STRESS: 30% (stress test floor)
- MINIMUM_EMERGENCY_BUFFER: 10% (retain buffer after obligations)
- LTV_CONSERVATIVE: 50% (conservative for secured products)
- Credit score adjustment factors (10% reduction for unknown)
- Income type factors (1.0 for salaried MNC, 0.5 for informal)
- Product type adjustments (-0.5 to +0.5 percentage points)
- Processing fee percent: 2% (industry typical, but varies by lender)
- Stress income drop: 20% (standard, but varies by situation)

**Sourced/external:**
- Indian personal loan market typical rates (8%-25% range)
- Standard EMI formula (well-established mathematical formula)
- LTV concepts for secured lending (industry practice, not fixed by RBI)
- Processing fee typical range (1%-3% for Indian personal loans)

**The RULES.md file makes this distinction obvious** — every rule has a | What | Value | Why | Source column, and "My judgement" is explicitly written for product judgements. "DO NOT falsely label your own thresholds as RBI rules."

## 10. Which assumptions are sourced?

**External/industry-sourced assumptions (not "my judgement"):**
- Indian personal loan typical rate range: 8%-25% p.a. (varies by lender, credit, product)
- EMI formula: well-established annuity formula, not invented
- LTV (Loan-to-Value) concept: industry practice for secured lending, typically 50-70% depending on product and lender
- Processing fee: 1-3% is typical for Indian personal loans (varies by lender, borrower profile)
- Standard retirement age: 60 years (common across Indian financial planning)
- Basic inflation/inequality adjustments acknowledged but not modeled in detail

**These are noted in RULES.md with their source where known, and distinguished from product judgements.**

## 11. What happens if FOIR changes from 40% to 35%?

For each borrower:

- **Priya (salaried, ₹1.1L income, ₹14K existing EMI):**
  - At 40% FOIR: safeMonthlyOutflow = ₹1.1L × 40% - ₹14K = ₹44K - ₹14K = ₹30K
  - At 35% FOIR: safeMonthlyOutflow = ₹1.1L × 35% - ₹14K = ₹38.5K - ₹14K = ₹24.5K
  - **Impact:** Safe EMI drops from ₹30K to ₹24.5K (18% reduction). Borrower-safe ceiling decreases proportionally. Recommended amount decreases. The borrower could afford approximately ₹6.5L less (at 48 months, 10% rate).

- **Ravi (self-employed, ₹60K avg income, no existing EMI):**
  - At 40% FOIR: safeMonthlyOutflow = ₹60K × 40% = ₹24K (but variable FOIR 35% applied → ₹21K)
  - At 35% FOIR: safeMonthlyOutflow = ₹60K × 35% = ₹21K (but variable FOIR × 0.8 = 28% → ₹16.8K)
  - **Impact:** Moderate reduction. Self-employed already use the variable FOIR, so the change is less impactful than for salaried.

- **Anita (informal, ₹28K income, ₹35K existing EMI + ₹15K household):**
  - At any FOIR: safeMonthlyOutflow = ₹28K × FOIR - ₹35K - ₹15K. Even at 40%: ₹11.2K - ₹50K = negative. At 35%: worse.
  - **Impact:** No change in outcome — "DON'T BORROW" remains the result. The existing debt burden dominates the calculation.

**General principle:** Lower FOIR → more conservative → lower borrowing capacity. This is by design (Principle #10).

## 12. What happens if the stress income drop changes from 20% to 30%?

For each borrower:

- **Priya (₹1.1L income, ₹1.4K existing EMI):**
  - At 20% drop: stress income = ₹88K. safeMonthlyOutflow = ₹88K × 45% - ₹14K = ₹39.6K - ₹14K = ₹25.6K. Normal safeEMI = ₹35.5K. Proposed EMI (e.g., ₹20K) still affordable under stress? ₹20K < ₹25.6K → YES, still affordable.
  - At 30% drop: stress income = ₹77K. safeMonthlyOutflow = ₹77K × 45% - ₹14K = ₹34.65K - ₹14K = ₹20.65K. Proposed EMI ₹20K → barely affordable (₹20K < ₹20.65K).
  - **Impact:** At 30% drop, the stress test becomes much more conservative. The margin for error decreases significantly.

- **Ravi (₹60K income, no existing EMI):**
  - At 20% drop: stress income = ₹48K. safeMonthlyOutflow (variable FOIR 35%) = ₹48K × 35% = ₹16.8K. At 30% drop: ₹48K × 35% = ₹16.8K (same FOIR, just different income).
  - Actually for self-employed, the FOIR is already adjusted, so the stress test uses the same adjusted FOIR with reduced income.
  - **Impact:** Proportional reduction in safe EMI. At 30% drop, safe EMI decreases 30% from the normal level.

- **Anita (₹28K income, ₹35K existing EMI + ₹15K expenses):**
  - At 20% drop: stress income = ₹22.4K. safeMonthlyOutflow = ₹22.4K × 28% - ₹35K - ₹15K = ₹6.27K - ₹50K = negative (worse than normal which is already negative).
  - At 30% drop: stress income = ₹19.6K. Even more negative.
  - **Impact:** No change in outcome — already "DON'T BORROW." The stress test confirms the severity, but the outcome was already determined by the existing debt burden.

**Key principle:** The stress scenario most relevant to the borrower's profile should be used. For informal/self-employed, income decline is the primary stress. For floating-rate loans, rate increase is also relevant. Combined stress (income drop + rate increase) is the most severe.

## 13. What would you change with more data?

With more data and time, I would:

1. **Add real-time lender rate lookup:** Connect to a dashboard of actual lender rates for the borrower's profile and location. (But this breaks the "no backend/API dependency" principle, so would be optional.)

2. **Income verification module:** Integrate with income documentation validators (ITR copies, bank statements) to replace self-reported income with verified figures.

3. **Dynamic FOIR per lender:** Allow users to select which lender's FOIR threshold to use (some lenders use 50%, some 40%, some 35%). Currently fixed at conservative levels.

4. **Multiple stress scenarios:** Income decrease 20%, rate increase 2%, combined income decrease + rate increase, job loss scenario. Currently one default per profile.

5. **Regional language support:** Hindi, Tamil, Bengali, and other Indian language UI translation. Currently only English.

6. **PDF export of negotiation card:** Generate a printable/PDF version of the negotiation card for lender meetings. Currently displayed on screen only.

7. **Loan comparison tool:** Side-by-side comparison of "borrow ₹8L vs ₹10L vs ₹12L" with total cost, EMI, interest, APR for each. Currently single-loan focus.

8. **Savings goal integration:** If the borrower has specific savings goals (child education, wedding, etc.), factor those into the affordability calculation alongside loan obligations.

9. **Credit score improvement pathway:** If credit score is unknown or low, show specific actions to improve it (pay down credit card debt, ensure timely EMI payments, etc.) and re-assess in 3-6 months.

10. **Co-borrower/co-applicant module:** If the borrower has a co-applicant (spouse, family member), incomes and obligations could be combined for a joint assessment.

## 14. What would you remove if given less time?

If given less than 16 hours, I would remove:

1. **Salaried adaptive questions (S1-S3):** Could simplify by only asking the 10 must questions and inferring employer tenure/income stability from the employer type selected. This would reduce the questionnaire length by 3 questions.

2. **Informal adaptive questions (I1-I4):** Similarly, could simplify by fewer questions and more conservative defaults.

3. **Tenure trade-offs for all 3 tenues (36/48/60):** Could show only 2 tenures (e.g., 36 and 60 months) as bookends, with the middle tenure calculated on demand.

4. **Stress test customization:** One default stress scenario per profile instead of configurable scenarios.

5. **Product routing for all product types:** Focus only on personal, business, and LAP. Gold loan and two-wheeler loan routing could be cut.

6. **Enhanced visual design:** The current minimal design prioritizes clarity over aesthetics. This could remain minimal.

7. **Unit test suite:** Comprehensive tests for all rules. Basic EMI and APR tests could remain, but full test suite could be deferred.

8. **Demo borrowers' detailed documentation:** RUNTHROUGHS.md could be simplified or merged with other docs.

**The core minimum viable product** would be: landing → 10 must questions → results with O1-O4 + negotiation card. Everything else is enhancement.

## 15. What would you build if this became a real product?

If this became a real product (beyond the 16-hour time box):

**Priority 1 (must have):**
- Backend integration with actual lender APIs for real-time rate quotes
- Bank account aggregation (with consent) for income/expense verification
- Credit bureau soft pull (with consent) for actual credit score
- User accounts with saved assessments and history
- Mobile apps (iOS/Android) in addition to web
- Regulatory compliance review (ensure disclaimers, disclosures meet local requirements)

**Priority 2 (should have):**
- Multiple stress scenarios with visual comparisons
- Regional language support (Hindi, Tamil, Bengali, etc.)
- PDF export/print of negotiation card
- Loan comparison tool (multiple amounts side by side)
- Savings goal integration
- Co-borrower/co-applicant module

**Priority 3 (nice to have):**
- Advanced charts and graphs (income vs expense breakdown, amortization schedule)
- Financial educational content (tips for improving credit score, debt management)
- AI-powered insights (personalized recommendations based on broader dataset)
- Social sharing (share your negotiation card on WhatsApp/Telegram with privacy controls)
- Gamification (complete assessment, get your "borrower score")
- Integration with financial planning tools (tax planning, retirement planning)

**Business model considerations:**
- Freemium: Free assessment, paid detailed reports or lender connection
- B2B: White-label for fintech companies, banks, lenders
- Affiliate: Connect borrowers with partner lenders (transparent disclosure required)
- One-time purchase: Product for individual borrowers

**Ethical commitments for a real product:**
- Never claim "you will definitely get ₹X"
- Always distinguish between lender ceiling and borrower-safe ceiling
- Clear disclaimers that this is not financial advice
- Opt-in data storage with explicit user consent
- Regular rule review and updates (RULES.md would be living document)
- Transparent assumption documentation (config.ts would be openly maintained)
- No targeting of vulnerable populations with inappropriate products