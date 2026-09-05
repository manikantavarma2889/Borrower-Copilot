# Borrower Copilot — Questionnaire Design

## Must Questions (~8-10 asked of all borrowers)

| # | Question | Type | Required/Conditional | Who sees it | Why it is needed | Which output it changes | What happens if unknown |
|---|----------|------|----------------------|-------------|------------------|------------------------|-------------------------|
| Q1 | Loan purpose | select | Required | All | Determines product type (personal, business, two-wheeler, etc.) and risk category | O1 (borrow decision), product routing | Purpose left unknown → wider product uncertainty, lower confidence, conservative recommendations |
| Q2 | Desired loan amount | number | Required | All | Input ceiling calculation; compares against lender/safe ceiling | O2 (max amounts), O1 (borrow decision) | Unknown → cannot calculate recommended amount; user prompted to provide; ranges wider |
| Q3 | Income type | select | Required | All | Primary adaptive branching factor; determines FOIR threshold and question branch | O1, O2, O3, O4 (all — employment type is foundational) | If unknown → default to most conservative FOIR threshold; all ranges widen; confidence LOW |
| Q4 | Net monthly income | number | Required | All | Base for all affordability calculations; FOIR numerator | O2, O3, O4, O1 (all) | If unknown → cannot calculate any amount; user must provide; application cannot proceed |
| Q5 | Existing monthly EMI | number | Required | All | FOIR denominator; subtracts from capacity | O2, O4 (all) | If unknown → cannot calculate FOIR accurately; ranges widen; confidence decreases |
| Q6 | Household essential expenses | number | Required | All | FOIR adjustment; accounts for non-debt living costs | O2, O4 | If unknown → use conservative default; ranges widen |
| Q7 | Age | number | Required | All | Tenure eligibility; maximum loan tenure | O2 (tenure-dependent calculations) | If unknown → assume standard 60-year retirement boundary; limited tenure options |
| Q8 | Credit score or "I don't know" | select | Required | All | Interest rate range; confidence level; lender ceiling adjustments | O3 (fair rate), confidence | If "I don't know" → widen rate range, lower confidence, explicit uncertainty explanation |
| Q9 | Emergency savings | number | Conditional | All | Stress buffer; affects confidence and stress scenario relevance | O4 (stress test), confidence | If unknown → assume minimal buffer; stress scenario more conservative; confidence lower |
| Q10 | Employment/business history (years) | number | Conditional | All | Product routing; confidence; employment stability | O1, confidence | If unknown → lower confidence; product routing less specific |

## Adaptive Questions

### Salaried Branch (if Q3 = "Salaried")

| # | Question | Type | Required/Conditional | Who sees it | Why it is needed | Which output it changes | What happens if unknown |
|---|----------|------|----------------------|-------------|------------------|------------------------|-------------------------|
| S1 | Employer tenure (years) | number | Conditional | Salaried only | Employment stability indicator; affects confidence and rate range | confidence, O3 (rate range) | If unknown → moderate confidence decrease; rate range slightly wider |
| S2 | Income stability (variable share %) | number | Conditional | Salaried only | Quantifies income variability; affects safe EMI calculation | O4 (safe EMI, recommended EMI) | If unknown → assume 0% variable → conservative; if significant variable → wider ranges |
| S3 | Upcoming large expenses | select | Conditional | Salaried only | Affects stress test relevance; large upcoming expense → more conservative | O4 (stress test) | If unknown → assume no upcoming large expenses → less conservative; ranges slightly narrower |

### Self-Employed Branch (if Q3 = "Self-employed")

| # | Question | Type | Required/Conditional | Who sees it | Why it is needed | Which output it changes | What happens if unknown |
|---|----------|------|----------------------|-------------|------------------|------------------------|-------------------------|
| E1 | Business age (years) | number | Conditional | Self-employed only | Business stability indicator; affects product routing and confidence | product routing, confidence | If unknown → lower confidence; route more conservatively toward secured products |
| E2 | Documented ITR income (annual) | number | Conditional | Self-employed only | Primary documented income figure; constrains lender ceiling even if cash flow higher | O2 (lender ceiling), product routing | If unknown → cannot use ITR-based ceiling; rely on cash flow with wider ranges; much lower confidence |
| E3 | Property/collateral value | number | Conditional | Self-employed only | Enables secured product routing; does NOT equal guaranteed eligibility | product routing, O2 (ceiling for secured) | If unknown → unsecured personal loan route; lower LTV assumptions; explicit warning that collateral ≡ eligibility |
| E4 | Existing formal borrowing | select | Conditional | Self-employed only | Affects debt-to-income and product routing | O1 (borrow decision), product routing | If unknown → assume none with conservative warning; if yes → include in FOIR |

### Informal/Variable Branch (if Q3 = "Informal/variable")

| # | Question | Type | Required/Conditional | Who sees it | Why it is needed | Which output it changes | What happens if unknown |
|---|----------|------|----------------------|-------------|------------------|------------------------|-------------------------|
| I1 | Income range (low–high monthly) | range | Conditional | Informal only | Defines income floor and ceiling; replaces net monthly income foundation | O2, O4 (all income-based calculations) | If unknown → very conservative default; wide ranges; LOW confidence |
| I2 | Lowest recent monthly income | number | Conditional | Informal only | Determines stress floor; ensures recommendations based on worst month, not best month | O4 (stress test, recommended EMI) | If unknown → assume income could drop further; very wide ranges; LOW confidence |
| I3 | Outstanding debt / app loans | select/number | Conditional | Informal only | Captures high-cost existing debt not in existing EMI | O1 (borrow decision), O2 (ceiling) | If unknown → assume additional undisclosed debt; wide ranges; LOW confidence |
| I4 | Recent missed/bounced EMI | select | Conditional | Informal only | Payment behavior indicator; strongly affects confidence and stress scenario | confidence, O1 (borrow decision) | If yes → immediate confidence LOW; "DON'T BORROW" likely; explicit warning about high-cost debt |

## Question Effects Table

| Question | O1 | O2 | O3 | O4 | Confidence | Product Routing |
|----------|----|----|----|----|------------|-----------------|
| Q1 (purpose) | ✓ | ✓ | | | ✓ | ✓ |
| Q2 (desired amount) | ✓ | ✓✓ | | ✓ | | |
| Q3 (income type) | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ |
| Q4 (net income) | ✓✓✓ | ✓✓✓ | ✓ | ✓✓✓ | | |
| Q5 (existing EMI) | ✓ | ✓✓✓ | | ✓✓✓ | | |
| Q6 (household expenses) | | ✓✓ | | ✓✓ | | |
| Q7 (age) | | ✓ | | ✓ | | |
| Q8 (credit score) | | | ✓✓✓ | | ✓✓✓ | |
| Q9 (emergency savings) | | | | ✓ | ✓ | |
| Q10 (history) | ✓ | | | | ✓ | ✓ |
| S1-S3 (salaried) | | | ✓ | ✓ | ✓ | |
| E1-E4 (self-employed) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I1-I4 (informal) | ✓ | ✓ | ✓ | ✓✓ | ✓✓✓ | |

✓ = changes, ✓✓ = significant change, ✓✓✓ = core determinant

## Rationale for Each Question

**Q1 (Loan purpose):** Each purpose has different risk profile, product type, and affordability. Wedding vs. business vs. scooter require different considerations.

**Q2 (Desired amount):** Must have user input to compare against what they can afford. The gap between desired and eligible is the core insight.

**Q3 (Income type):** This is the most important branching factor. Salaried, self-employed, and informal have vastly different income stability, documentation, and FOIR thresholds. This single question determines which follow-up questions apply.

**Q4 (Net monthly income):** The foundational input for all affordability calculations. Without this, no calculation is possible.

**Q5 (Existing EMI):** Critical for FOIR calculation. The difference between gross income and existing obligations determines borrowing capacity.

**Q6 (Household expenses):** Indian affordability considers not just EMIs but also family living costs. This adjusts the FOIR downward from the theoretical maximum.

**Q7 (Age):** Determines maximum feasible tenure. A 25-year-old can take a 30-year tenure; a 55-yearold cannot.

**Q8 (Credit score):** Perhaps the single most important rate determinant. Known score → narrower range, better rate. Unknown → wide range, lower confidence, explicit uncertainty.

**Q9 (Emergency savings):** Affects stress test relevance. If the borrower has 6 months expenses saved, a 20% income drop is less critical than if they have 0 saved.

**Q10 (Employment/business history):** Years in current role/business indicates stability. Longer history = more confidence = narrower ranges.

**S1 (Employer tenure):** Specific to salaried. Longer tenure = more stable income = better rate confidence.

**S2 (Income variable share):** Salaried can have variable components (bonus, commissions). High variable share = less predictable = wider ranges.

**S3 (Upcoming large expenses):** If a borrower has a huge expense coming (marriage, moving), current borrowing capacity should be adjusted downward.

**E1 (Business age):** Self-employed with 2+ years formal business = more credible than 6 months. Affects product routing toward business loans vs personal.

**E2 (ITR income):** Documented income is the constrained variable for self-employed. Even if cash flow is higher, lenders use ITR for qualification.

**E3 (Collateral value):** For Ravi's scenario. Property value enables business/LAP routing but does NOT mean the borrower can borrow against the full value. LTV, legal checks, lender valuation all apply.

**E4 (Existing formal borrowing):** kirana owners who've taken business loans before are different from first-time borrowers.

**I1 (Income range):** For informal workers, the monthly income fluctuates. The range defines the floor (minimum) and ceiling (maximum) for calculations.

**I2 (Lowest recent monthly income):** Stress scenario uses the lowest month, not the average. This prevents over-borrowing based on good months.

**I3 (Outstanding debt):** Informal workers often have app loans (PaySense, etc.) not captured in formal EMI records. These must be accounted for.

**I4 (Missed EMI):** A bounced EMI is a strong negative signal. If yes, confidence drops and recommendations turn conservative.

## Question Removal Criteria

Remove any question if:
- It doesn't influence any output (O1-O4, confidence, product routing)
- It duplicates information already captured elsewhere
- It doesn't change ranges, rules, or recommendations
- Its answer can be inferred from other answers without loss of accuracy

All 10 must questions + adaptive questions satisfy this criteria. No questions are included without a documented effect.