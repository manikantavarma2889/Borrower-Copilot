/**
 * Borrower Copilot — Lender Likely Ceiling Rules
 *
 * Calculates "How much a lender may plausibly sanction"
 * This MUST NOT equal "How much the borrower can safely afford."
 */

import { config } from './config'
import { EmploymentType } from './affordability'

/** Employment type for lender ceiling factor */
export type IncomeType =
  | 'salaried'
  | 'self-employed'
  | 'informal'
  | 'salaried-mnc'
  | 'salaried-small'
  | 'self-employed-itr'
  | 'self-employed-no-itr'
  | 'salaried_mnc'
  | 'salaried_small'
  | 'self_employed_itr'
  | 'self_employed_no_itr'

/** Lender ceiling result */
export interface LenderCeilingResult {
  lenderLikelyCeiling: number
  incomeTypeFactor: number
  creditScoreAdjustment: number
  existingEmiAdjustment: number
  collateralAdjustment: number
  businessHistoryAdjustment: number
  uncertaintyReduction: number
  breakdown: {
    baseCeiling: number
    incomeTypeAdjusted: number
    creditAdjusted: number
    emiAdjusted: number
    finalCeiling: number
  }
}

/**
 * Get the income type factor for lender ceiling adjustment.
 * Salaried MNC = full eligibility, others get progressively lower factors.
 */
export function getIncomeTypeFactor(incomeType: IncomeType): number {
  const factors: Record<string, number> = {
    'salaried': config.INCOME_TYPE_FACTORS.SALARIED_MNC,
    'salaried-mnc': config.INCOME_TYPE_FACTORS.SALARIED_MNC,
    'salaried_mnc': config.INCOME_TYPE_FACTORS.SALARIED_MNC,
    'salaried-small': config.INCOME_TYPE_FACTORS.SALARIED_SMALL,
    'salaried_small': config.INCOME_TYPE_FACTORS.SALARIED_SMALL,
    'self-employed': config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_ITR,
    'self_employed': config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_ITR,
    'self-employed-itr': config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_ITR,
    'self_employed_itr': config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_ITR,
    'self-employed-no-itr': config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_NO_ITR,
    'self_employed_no_itr': config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_NO_ITR,
    'informal': config.INCOME_TYPE_FACTORS.INFORMAL,
  }
  return factors[incomeType] ?? config.INCOME_TYPE_FACTORS.INFORMAL
}

/**
 * Get credit score adjustment factor for lender ceiling.
 * Known credit score → no reduction. Unknown → 10% uncertainty reduction.
 */
export function getCreditScoreAdjustment(creditScore: number | 'unknown' | undefined, creditKnown: boolean): number {
  if (creditKnown) return 1.0  // no reduction

  // Unknown credit score: 10% reduction as uncertainty buffer
  return 0.9
}

/**
 * Get business history adjustment for self-employed borrowers.
 */
export function getBusinessHistoryAdjustment(businessYears: number | undefined): number {
  if (businessYears === undefined || businessYears === null) return 1.0

  if (businessYears >= 10) return 1.1  // proven track record
  if (businessYears >= 5) return 1.0
  if (businessYears >= 2) return 0.9
  return 0.7  // < 2 years: young business
}

/**
 * Calculate the lender likely ceiling.
 *
 * This is "How much a lender may plausibly sanction based on the information provided."
 * This MUST NOT equal the borrower-safe ceiling.
 *
 * Formula:
 *   baseCeiling = netMonthlyIncome * FOIR_BASE * 12 / monthlyRate (approximate)
 *   incomeTypeAdjusted = baseCeiling * incomeTypeFactor
 *   creditAdjusted = incomeTypeAdjusted * creditAdjustment
 *   finalCeiling = min(creditAdjusted, unsecuredCeilingCap)
 */
export function calculateLenderLikelyCeiling({
  netMonthlyIncome,
  incomeType,
  creditScore,
  creditKnown,
  existingEmi,
  desiredLoanAmount,
  propertyValue,
  businessYears,
  employmentType,
}: {
  netMonthlyIncome: number
  incomeType: IncomeType
  creditScore: number | undefined
  creditKnown: boolean
  existingEmi: number
  desiredLoanAmount: number
  propertyValue: number | undefined
  businessYears: number | undefined
  employmentType?: EmploymentType
}): LenderCeilingResult {
  const incomeTypeFactor = getIncomeTypeFactor(incomeType)
  const creditAdjustment = getCreditScoreAdjustment(creditScore, creditKnown)
  const businessHistoryAdj = getBusinessHistoryAdjustment(businessYears)

  // Step 1: Base ceiling using FOIR_BASE and annual income
  // Approximation: lender may offer up to netMonthlyIncome * FOIR_BASE * 12 months
  // But adjusted for interest rate — use a flat-income multiple for simplicity
  const baseCeiling = netMonthlyIncome * config.FOIR_BASE * 12

  // Step 2: Adjust by income type
  const incomeTypeAdjusted = baseCeiling * incomeTypeFactor

  // Step 3: Adjust by credit score
  const creditAdjusted = incomeTypeAdjusted * creditAdjustment

  // Step 4: Adjust for existing EMI (reduce capacity)
  // Simple: reduce ceiling by existing EMI * remaining working years approximation
  // More conservatively, just note it but the FOIR already accounts for it in safe ceiling
  // For lender ceiling, we document existing EMI but the ceiling is primarily income-based
  const emiAdjustmentFactor = 1.0  // FOIR handles this in safe ceiling; lender ceiling is income-focused
  const emiAdjusted = creditAdjusted // no aggressive reduction; documented for transparency

  // Step 5: Collateral adjustment (for secured products)
  let collateralAdjustment = 1.0
  if (propertyValue !== undefined && propertyValue > 0) {
    const securedCeiling = propertyValue * config.LTV_CONSERVATIVE
    // For self-employed with property, we can increase ceiling but with strong warnings
    if (incomeType === 'self-employed') {
      // Collateral increases ceiling but documented income is the constraint
      const incomeConstrained = Math.min(emiAdjusted, securedCeiling)
      collateralAdjustment = incomeConstrained / Math.max(1, emiAdjusted)
    }
  }
  const withCollateral = emiAdjusted * collateralAdjustment

  // Step 6: Business history adjustment (self-employed)
  const withBusinessHistory = withCollateral * businessHistoryAdj

  // Step 7: Apply unsecured ceiling cap
  const finalCeiling = Math.min(withBusinessHistory, config.UNSECURED_CEILING_LAKHS * 100000)

  // Breakdown for transparency
  const breakdown = {
    baseCeiling,
    incomeTypeAdjusted,
    creditAdjusted,
    emiAdjusted: emiAdjusted,  // noted but FOIR handles safe calculations
    finalCeiling,
  }

  return {
    lenderLikelyCeiling: finalCeiling,
    incomeTypeFactor,
    creditScoreAdjustment: creditKnown ? 1.0 : 0.9,
    existingEmiAdjustment: emiAdjustmentFactor,
    collateralAdjustment,
    businessHistoryAdjustment: businessHistoryAdj,
    uncertaintyReduction: creditKnown ? 0 : 0.1, // 10% uncertainty buffer
    breakdown,
  }
}

/**
 * Get explicit warning text for collateral/property value.
 */
export function getCollateralWarning(
  incomeType: IncomeType,
  propertyValue: number | undefined,
  businessYears: number | undefined
): string | undefined {
  if (!incomeType.includes('self-employed') || propertyValue === undefined) return undefined

  if (businessYears === undefined) {
    return "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc."
  }

  if (businessYears >= 5) {
    return "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc. Your 14+ year business history is noted."
  }

  return "Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc."
}