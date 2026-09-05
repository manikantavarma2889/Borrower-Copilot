# Borrower Copilot — Financial Rules

## Overview

All financial calculations are centralized in pure TypeScript modules under `src/rules/`. The UI never contains financial logic. Every threshold and assumption is documented here with its value, rationale, and source.

Rules are configured in `src/rules/config.ts`. Do not scatter magic numbers across components.

---

## 1. Affordability Rules (affordability.ts)

### FOIR (Fixed Obligations to Income Ratio)

| What | Value | Why | Source |
|------|-------|-----|--------|
| FOIR_BASE | 40% | Conservative baseline used by many Indian lenders for personal loans; allows for food, transport, utilities beyond EMIs | "My judgement — conservative planning assumption, not an RBI regulation" |
| FOIR_STABLE_SALARIED | 45% | Salaried employees with stable MNC/ government jobs have more predictable income; can safely allocate slightly more | "My judgement — stable salaried profiles deserve slightly higher allocation" |
| FOIR_VARIABLE | 35% | Self-employed/informal income is less predictable; conservative buffer required | "My judgement — variable income requires stronger buffer" |
| FOIR_STRESS | 30% | Stress test floor; what remains after income shock | "My judgement" |
| MINIMUM_EMERGENCY_BUFFER | 10% of net monthly income | Ensures borrower retains some buffer after all obligations | "My judgement" |

### Safe EMI Calculation

```
safeMonthlyOutflow = netMonthlyIncome * ADJUSTED_FOIR - existingEmi - householdExpenses
```

Where ADJUSTED_FOIR depends on employment type and confidence:

```
if employmentType == 'salaried' and creditScoreKnown and employerTenure >= 2:
    adjustedFoir = FOIR_STABLE_SALARIED
elif employmentType == 'salaried':
    adjustedFoir = FOIR_BASE
elif employmentType == 'self-employed':
    adjustedFoir = FOIR_VARIABLE
else: // informal
    adjustedFoir = FOIR_VARIABLE * 0.8  // additional buffer for informality
```

### Safe Loan Amount

```
safeLoanAmount = (safeMonthlyOutflow * tenureMonths)  // based on interest rate
```

But capped so that recommended amount = min(lenderLikelyCeiling, borrowerSafeCeiling)

### Key Rules

- **Safe EMI = netMonthlyIncome * adjustedFoir - existingEmi - householdExpenses**
- If safe EMI <= 0 → "DON'T BORROW" outcome
- If safe EMI < 0 → explicitly recommend "DO NOT BORROW"
- Recommended amount = min(lenderLikelyCeiling, borrowerSafeCeiling)
- But DO NOT recommend full amount if "don't borrow" rule fires

---

## 2. Lender Likely Ceiling (eligibility.ts)

### Calculation Principle

`lenderLikelyCeiling` = "How much a lender may plausibly sanction based on the information provided"

This MUST NOT equal `borrowerSafeCeiling` = "How much the borrower can safely afford"

### Income Type Weightings

| Income Type | Lender Ceiling Factor | Rationale |
|-------------|----------------------|-----------|
| Salaried (MNC/large company) | 1.0x | Stable, documented income; full eligibility |
| Salaried (small company/startup) | 0.8x | Less stable; lender discount |
| Self-employed (ITR filed) | 0.7x | Documented income constraint; even if cash flow higher |
| Self-employed (cash only, no ITR) | 0.5x | Undocumented income; lender cannot verify |
| Informal/gig | 0.5x | Unstable; no formal income verification |

### Credit Score Adjustments

| Credit Score | Rate Adjustment | Ceiling Adjustment |
|--------------|----------------|--------------------|
| 750+ | +0.5% rate; full ceiling | No ceiling reduction |
| 700-749 | +0.25% rate; full ceiling | No ceiling reduction |
| 600-699 | +0.5% rate; 5% ceiling reduction | 5% reduction from lender ceiling |
| 500-599 | +1% rate; 10% ceiling reduction | 10% reduction from lender ceiling |
| Unknown | Widen rate range; lower confidence; 10% ceiling reduction as uncertainty buffer | 10% reduction applied; explicit explanation |

### Existing EMI Adjustment

```
lenderCeilingAfterEmi = lenderLikelyCeiling - existingEmi * tenureYears
```

Actually, more precisely: the existing EMI reduces the borrower's capacity, which affects the safe ceiling more than the lender ceiling. But we document it transparently.

### Collateral (Secured Products only)

For self-employed with property:

```
securedLenderCeiling = propertyValue * LTV_CONSERVATIVE
where LTV_CONSERVATIVE = 50%  // conservative; lenders may offer 60-70% but we stay conservative
```

Explicit warning: "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc."

Property value is NOT equivalent to guaranteed borrowing eligibility.

### Business History (Self-employed)

```
if businessHistory >= 10 years:
    businessFactor = 1.1  // slight ceiling increase for proven track record
elif businessHistory >= 5 years:
    businessFactor = 1.0
elif businessHistory >= 2 years:
    businessFactor = 0.9
else:
    businessFactor = 0.7  < 2 years: young business; higher risk
```

### Lender Likely Ceiling Formula

```
baseCeiling = netMonthlyIncome * FOIR_BASE * 12 / (annualInterestRate / 100 / 12)

adjustedByIncomeType = baseCeiling * INCOME_TYPE_FACTOR
adjustedByCredit = adjustedByCreditScore * CREDIT_SCORE_FACTOR
adjustedByEmi = adjustedByEmiExisting * EMI_REDUCTION_FACTOR
adjustedByCollateral = (propertyValue * LTV_CONSERVATIVE) if secured applicable
adjustedByBusinessHistory = businessFactor

lenderLikelyCeiling = Math.min(adjustedByIncomeType + adjustedByCollateral + adjustedByBusinessHistory, desiredLoanAmount ceiling cap)
```

The ceiling cap is typically ₹100 lakh for unsecured personal loans in this model.

---

## 3. Borrower-Safe Ceiling (affordability.ts, continued)

### Calculation Principle

`borrowerSafeCeiling` = "How much the borrower can safely afford based on sustainable income"

This is calculated independently from lender ceiling. The recommended amount = min(lenderLikelyCeiling, borrowerSafeCeiling), but "don't borrow" rules may override.

### Safe EMI Foundation

```
safeMonthlyDisposable = netMonthlyIncome - existingEmi - householdExpenses - MINIMUM_EMERGENCY_BUFFER * netMonthlyIncome
```

### Safe EMI

```
safeEMI = safeMonthlyDisposable * ADJUSTED_FOIR / 1.0  // since FOIR is already a ratio of disposable
```

Actually let me recalculate:

```
safeMonthlyOutflow = netMonthlyIncome * ADJUSTED_FOIR - existingEmi - householdExpenses
```

If safeMonthlyOutflow < 0 → safeEMI = 0 → "DON'T BORROW"

### Borrower-Safe Loan Ceiling

Given safeEMI, the safe loan amount is calculated for various tenures:

```
safeLoanForTenure = safeEMI * (1 - (1 + monthlyRate)^-tenureMonths) / monthlyRate
```

Where monthlyRate = annualRate / 100 / 12

The borrowerSafeCeiling = max safe loan across applicable tenures (36, 48, 60 months), but typically the shortest tenure that gives reasonable EMI.

### Key Rules

- safeMonthlyOutflow = netMonthlyIncome * adjustedFoir - existingEmi - householdExpenses
- If safeMonthlyOutflow <= 0 → safeEMI = 0 → "DON'T BORROW"
- Borrower-safe ceiling generally lower than lender ceiling (by design principle #1)
- Recommended = min(lenderLikelyCeiling, borrowerSafeCeiling)
- But "don't borrow" may override even if min > 0

---

## 4. Borrow / Don't Borrow Logic (borrowDecision.ts)

### Decision Rules (ordered from most to least conservative)

| Rule | Condition | Outcome | Explanation |
|------|-----------|---------|-------------|
| R1 | proposedEMI > safeEMI → BORROW_LESS | "Your proposed EMI exceeds what's sustainable given your income and obligations." |
| R2 | existing debt burden > 50% of income AND income unstable → DONT_BORROW | "Your current debt burden is already excessive and your income is unstable. Adding more borrowing is very risky." |
| R3 | recentEMIBounce + highCostDebt + lowIncome → DONT_BORROW | "You have a recent bounced EMI, high-cost existing debt, and low income. Avoid additional borrowing." |
| R4 | proposedEMI > 50% of netMonthlyIncome → BORROW_LESS | "The EMI you're considering is more than half your monthly income." |
| R5 | productiveBorrowingAppearsPlausible → BORROW may be possible | "Based on your profile, borrowing appears financially plausible IF you stay within recommended limits." |
| R6 | proposedEMI <= safeEMI AND creditKnown AND stableIncome → BORROW | "Your borrowing is sustainable given your profile." |

### Outcome Definitions

- **BORROW**: Borrower can afford the requested amount; recommendations within safe limits
- **BORROW LESS**: Borrower can afford some borrowing, but the requested amount or EMI is too high; reduce amount
- **DON'T BORROW**: Borrowing is not advisable given current financial situation

### Decision Flow

```
1. Calculate safeEMI
2. Compare proposedEMI to safeEMI
3. If proposedEMI > safeEMI → BORROW_LESS
4. If existing debt burden excessive + income unstable → DONT_BORROW
5. If recent bounce + high-cost debt + low income → DONT_BORROW
6. If all checks pass → BORROW
```

### Ravi-Specific Rule

For self-employed with substantial collateral but constrained documented income:

```
"If potential lender ceiling may be constrained by documented income even though you have substantial collateral.
Consider business/ secured product route rather than unsecured personal loan."
```

---

## 5. Interest Rate Model (interestRate.ts)

### Rate Range Structure

```
fairRate = {
  low: number,           // absolute floor (e.g., 8)
  high: number,          // absolute ceiling (e.g., 22)
  expectedLow: number,   // most likely lower bound for this profile
  expectedHigh: number   // most likely upper bound for this profile
}
```

### Rate Determination by Profile

| Profile | low | expectedLow | expectedHigh | high |
|---------|-----|-------------|--------------|------|
| Salaried, credit 750+ | 8% | 10% | 14% | 18% |
| Salaried, credit 700-749 | 8% | 11% | 16% | 20% |
| Salaried, credit 600-699 | 10% | 13% | 18% | 22% |
| Salaried, credit unknown | 10% | 15% | 20% | 25% |
| Self-employed, ITR filed, credit 750+ | 8% | 11% | 15% | 20% |
| Self-employed, ITR filed, credit unknown | 10% | 14% | 18% | 22% |
| Self-employed, no ITR, credit unknown | 12% | 16% | 20% | 25% |
| Informal/variable, credit unknown | 12% | 16% | 20% | 25% |

### Credit Score Unknown Effects

When credit score is unknown:

- WIDEN the range: high - low increases by 5-7 percentage points
- LOWER confidence: confidence level drops at least one tier
- EXPLICITLY explain uncertainty: "Your credit score is unknown, so the rate range is wider to reflect this uncertainty."
- expectedLow drops: lender cannot assess risk precisely
- expectedHigh increases: more risk premium built in

### Employment Type Effects

- Salaried: baseline rates
- Self-employed: +0.5% to +1% (higher risk perception)
- Informal/variable: +1% to +2% (highest risk)

### Product Type Effects

- Personal loan: baseline
- Business loan: -0.5% (often lower rates for business purpose)
- Loan Against Property: -1% to -2% (secured, lower risk)
- Two-wheeler loan: +0.5% (specific product)
- Home loan: -1% (longest tenure, lowest rates)

### Interest Rate Formula (approximate)

```
baseRate = 8%  // base Indian personal loan rate
creditAdjustment = creditScoreAdjustment[score] or credit unknown adjustment
employmentAdjustment = employmentTypeAdjustment[type]
productAdjustment = productTypeAdjustment[product]

expectedLow = Math.max(8, baseRate + creditAdjustment + employmentAdjustment + productAdjustment - 1)
expectedHigh = Math.min(25, baseRate + creditAdjustment + employmentAdjustment + productAdjustment + 3)
low = expectedLow - 2  // but not below 6%
high = expectedHigh + 3  // but not above 28%
```

---

## 6. APR Calculation (apr.ts)

### Estimated APR Formula

```
APR = (totalInterest + processingFee) / principal / tenureYears * 100
```

But more accurately, APR includes the time value of money. For simplicity:

```
monthlyRateFromAPR = (1 + APR/100)^(1/12) - 1
emi = principal * monthlyRateFromAPR / (1 - (1 + monthlyRateFromAPR)^-tenureMonths)
```

Solve for APR given emi, principal, tenure, processingFee.

### Simplified APR Calculation (used in app)

```
totalInterest = principal * (annualRate/100) * tenureYears / 12  // simple interest approximation
totalProcessingFee = principal * PROCESSING_FEE_PERCENT / 100
totalCost = totalInterest + totalProcessingFee

estimatedAPR = totalCost / principal / tenureYears * 100
```

### Example

₹10 lakh loan, 12% annual rate, 5 years, 2% processing fee:

```
totalInterest = 1000000 * 0.12 * 5 / 1 = 600000  // wait, this is wrong for simple
```

Let me recalculate properly:

```
Annual interest = principal * rate/100 = 1000000 * 0.12 = 120000/year
Total interest over 5 years = 120000 * 5 = 600000
Processing fee = 1000000 * 0.02 = 20000
Total cost = 600000 + 20000 = 620000
Estimated APR = 620000 / 1000000 / 5 * 100 = 12.4%
```

The processing fee raises the effective APR from 12% to 12.4%.

### APR Labeling

Clearly label: "Estimated APR — includes principal, negotiated interest rate, and processing fee. Does not include other possible charges: prepayment/foreclosure fees, late payment fees, insurance add-ons, processing charges beyond stated percent."

### Comparison Feature

The app must allow the user to compare:
- Quoted interest rate (e.g., "12% per annum")
- All-in estimated cost (estimated APR)

Example display:
```
Quoted interest rate: 12% p.a.
Estimated APR (with 2% processing fee): 12.4% p.a.
Total repayment over 5 years: ₹16.20 lakh
Total interest: ₹6.20 lakh
Processing fee: ₹20,000
```

---

## 7. EMI Calculation (emi.ts)

### Standard EMI Formula

```
monthlyRate = annualRate / 100 / 12
emi = principal * monthlyRate * (1 + monthlyRate)^tenureMonths / ((1 + monthlyRate)^tenureMonths - 1)
```

### Outputs

- monthlyEMI: number (rounded to nearest ₹100)
- totalRepayment: emi * tenureMonths
- totalInterest: totalRepayment - principal

### Tenure Trade-offs

Show for at least 36, 48, 60 months:

| Tenure | EMI | Total Repayment | Total Interest |
|--------|-----|-----------------|----------------|
| 36 months | higher | lower | lower |
| 48 months | medium | medium | medium |
| 60 months | lower | higher | higher |

### Key Rule

"Longer tenure: lower monthly EMI, higher total interest. Shorter tenure: higher monthly EMI, lower total interest."

### Recommended Maximum EMI

```
recommendedMaxEMI = netMonthlyIncome * ADJUSTED_FOIR - existingEmi - householdExpenses
```

If recommendedMaxEMI < 0 → recommendedMaxEMI = 0 → "DON'T BORROW"

### EMI Affordability Check

```
if proposedEMI > recommendedMaxEMI → BORROW_LESS
if proposedEMI > safeEMI → BORROW_LESS (more severe)
```

---

## 8. Stress Test (stress.ts)

### Stress Scenarios (choose most relevant to borrower profile)

| Scenario | When Applied |
|----------|--------------|
| Income decreases by 20% | Default for all; most common stress test |
| Interest rate increases by 2 percentage points | Floating-rate loans; default |
| Income decreases by 30% | Informal/self-employed borrowers |
| Income decreases by 20% + rate increase by 2% | Combined stress (most severe) |

### Stress Calculation

```
stressNetIncome = netMonthlyIncome * (1 - INCOME_DROP_PERCENT / 100)
stressSafeEMI = stressNetIncome * ADJUSTED_FOIR - existingEmi - householdExpenses
stressEmi = emi calculation with same principal but stress conditions
```

### Stress Output

Show normal vs stress:

```
Normal:
- EMI: ₹25,000
- Safe EMI: ₹28,000
- Affordable: YES

Stress (20% income drop):
- EMI: ₹25,000
- Safe EMI: ₹22,400
- Affordable: NO — EMI exceeds safe EMI

Explanation: "If your income decreases by 20%, your safe EMI drops from ₹28,000 to ₹22,400. Your proposed EMI of ₹25,000 would no longer be sustainable."
```

### Key Rule

Every result MUST contain a stress case. If the recommended EMI becomes unmanageable under stress, include explicit warning.

### Anita-Specific Stress

For Anita (informal, high-cost existing debt):

```
Scenario: Income decrease of 20% + existing app loan restructuring
- Normal: EMI ₹15,000, Safe EMI ₹18,000 (tight but manageable)
- Stress: EMI ₹15,000, Safe EMI ₹14,400 (EMi exceeds safe)
- Recommendation: "Avoid adding another high-cost loan now. Reduce/restructure existing expensive debt first."
```

---

## 9. Confidence Model (confidence.ts)

### Rule-Based Confidence (not ML)

Based on data completeness and quality:

| Confidence Level | Conditions | Effect on Outputs |
|-----------------|------------|-------------------|
| HIGH | All 9 must questions answered; credit score known; employment stable (tenure >= 2 years) | Narrower ranges; "Your profile has enough information for a relatively narrow planning range." |
| MEDIUM | 7-8 must questions answered; credit score known OR stable employment; minor gaps | Wider ranges; "Some information is missing, so the rate/eligibility range is wider." |
| LOW | <= 6 must questions answered; credit score unknown; income unstable; many unknowns | Widest ranges; "Several important inputs are unknown. Treat this as a planning estimate, not a precise prediction." |

### Confidence Calculation

```
score = 0
if Q1 answered: score += 1
if Q2 answered: score += 1
if Q3 answered: score += 1
if Q4 answered: score += 1
if Q5 answered: score += 1
if Q6 answered: score += 1
if Q7 answered: score += 1
if Q8 is known (not "I don't know"): score += 1
if Q9 answered: score += 1
if Q10 answered (or adaptive branch complete): score += 1

confidence = score >= 8 ? 'HIGH' : score >= 5 ? 'MEDIUM' : 'LOW'
```

### Confidence Effects

- **HIGH**: Rate range width = nominal (expectedHigh - expectedLow as designed). EMI ranges standard. Explanations specific.
- **MEDIUM**: Rate range width increases 20-30%. EMI ranges widened. Explanations note missing information.
- **LOW**: Rate range width increases 40-50%. EMI ranges significantly widened. All explanations note uncertainty. "Treat as planning estimate."

### Confidence → Language Mapping

| Confidence | Rate Language | EMI Language | Decision Language |
|------------|--------------|--------------|-------------------|
| HIGH | "Your rate is likely..." | "Your safe EMI is..." | "You may borrow up to..." |
| MEDIUM | "A lender may consider..." | "Your affordable EMI is approximately..." | "Borrowing may be possible if..." |
| LOW | "A lender might possibly consider..." | "You may be able to afford approximately..." | "Proceed with extreme caution. Seek financial advice." |

---

## 10. Product Routing (productRouting.ts)

### Product Options

- Personal loan
- Business loan
- Home loan
- Loan Against Property (LAP)
- Gold loan
- Two-wheeler loan

### Routing Rules

| Profile | Primary Route | Secondary Route | Rationale |
|---------|--------------|-----------------|-----------|
| Priya (salaried, strong credit) | Personal loan | — | Standard unsecured personal loan qualifies at best rates |
| Ravi (self-employed, 14 yr business, property, no formal loan) | Business loan / LAP | Personal loan | Product routing should consider secured route; documented income constrains unsecured eligibility |
| Anita (informal, high-cost app loans, variable income) | None (avoid) | Restructure existing | Avoid additional high-cost borrowing; reassess after debt resolution |

### Ravi-Specific Routing

```
"If you have substantial collateral (unencumbered shop premises) and a long business history,
you may be appropriate for a Loan Against Property or business loan.
However, your documented ITR income of ₹4.2L/year may constrain the sanctioned amount.
Consider speaking with lenders about secured products rather than unsecured personal loans."

Explicit: "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral.
Collateral should improve secured-product potential but remain subject to lender valuation, legal verification, LTV, documentation, etc."
```

### Anita-Specific Routing

```
"Do not treat property value as equivalent to guaranteed borrowing eligibility.
Current affordability and existing high-cost debt should dominate the decision.

Potentially recommend:
- Avoid adding another high-cost loan now
- Reduce/restructure existing expensive debt
- Reassess scooter financing later
- Show what income increase would need to occur before borrowing becomes safer"
```

### Routing Output

Include in results screen:
- Recommended product type
- Rationale for routing choice
- Any warnings about product suitability

---

## 11. Edge Case Rules (errorHandling.ts)

| Situation | Handling |
|-----------|----------|
| Zero or negative income | "DON'T BORROW" with explicit explanation: "Your income is zero/negative. Borrowing is not possible." |
| Expenses greater than income | "DON'T BORROW" with explanation of debt spiral risk |
| EMI greater than income | "DON'T BORROW" — the existing EMI alone exceeds income |
| Unknown credit score | Widen rate range; lower confidence; explicit explanation |
| Missing optional fields | Apply conservative defaults; note in explanations |
| Requested loan >> eligible | Recommend much smaller amount; show the gap |
| Unsupported tenure (< 12 months or > 84 months) | Clamp to supported range; explain limitation |
| Invalid age (< 18 or > 70) | Clamp to [18, 70]; explain |
| Missing product information | Use default personal loan assumptions; note in routing |

### Never silently replace unknown with zero

If credit score unknown → keep it unknown, widen ranges, lower confidence, explain why.

If income type unknown → most conservative FOIR threshold applied.

If emergency savings unknown → assume minimal buffer; stress scenario more conservative.

---

## 12. Financial Honesty Disclaimers

Every output must include appropriate disclaimers:

1. "A lender may plausibly consider up to approximately ₹X based on the information provided."
2. "Fair rate estimate — not the exact rate you qualify for."
3. "Estimated APR includes principal, interest rate, and processing fee. Other charges may apply."
4. "This is a planning/self-assessment tool, not a lending decision or credit offer."
5. "Do not treat the lender's maximum sanction as your target borrowing amount."
6. "Income and expense figures are self-reported. This tool does not verify them."

These disclaimers are baked into the output rendering, not tacked on at the end.

---

## Configuration (config.ts)

All important assumptions are configurable in one place:

```typescript
export const config = {
  FOIR_BASE: 0.40,
  FOIR_STABLE_SALARIED: 0.45,
  FOIR_VARIABLE: 0.35,
  FOIR_STRESS: 0.30,
  PROCESSING_FEE_PERCENT: 2,  // 2% of principal
  MINIMUM_EMERGENCY_BUFFER: 0.10,
  INCOME_DROP_STRESS: 0.20,  // 20% income drop for stress test
  INCOME_DROP_STRESS_SEVERE: 0.30,
  LTV_CONSERVATIVE: 0.50,  // Loan-to-value for secured products
  CREDIT_SCORE_THRESHOLDS: {
    EXCELLENT: 750,
    GOOD: 700,
    FAIR: 600,
    POOR: 500,
  },
  INCOME_TYPE_FACTORS: {
    SALARIED_MNC: 1.0,
    SALARIED_SMALL: 0.8,
    SELF_EMPLOYED_ITR: 0.7,
    SELF_EMPLOYED_NO_ITR: 0.5,
    INFORMAL: 0.5,
  },
  PRODUCT_TYPE_FACTORS: {
    PERSONAL: 1.0,
    BUSINESS: 0.95,
    LAP: 0.85,
    TWO_WHEELER: 1.05,
    HOME: 0.90,
  },
}
```

"DO NOT scatter these values across components. All rules refer to config."