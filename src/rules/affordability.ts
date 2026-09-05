/**
 * Borrower Copilot — Affordability Rules
 *
 * FOIR-based affordability calculations.
 * All values derived from config.ts.
 */

import { config } from './config'

/** Employment type for FOIR adjustments */
export type EmploymentType = 'salaried' | 'self-employed' | 'informal'

/** Affordability result */
export interface AffordabilityResult {
  baseFoir: number
  adjustedFoir: number
  safeMonthlyOutflow: number  // netIncome * adjustedFoir - existingEmi - householdExpenses
  safeEMI: number
  borrowerSafeCeiling: number  // max safe loan amount across tenures
  stressMonthlyOutflow: number
  stressEMI: number
}

/**
 * Determine the FOIR adjustment based on employment type and profile.
 */
export function getAdjustedFoir(
  employmentType: EmploymentType,
  creditScoreKnown: boolean,
  employmentStable: boolean  // e.g., employer tenure >= 2 years
): number {
  if (employmentType === 'salaried' && creditScoreKnown && employmentStable) {
    return config.FOIR_STABLE_SALARIED
  }
  if (employmentType === 'salaried') {
    return config.FOIR_BASE
  }
  if (employmentType === 'self-employed') {
    return config.FOIR_VARIABLE
  }
  // informal
  return config.FOIR_VARIABLE * 0.8  // additional buffer for informality
}

/**
 * Calculate affordable monthly outflow after all obligations.
 *
 * safeMonthlyOutflow = netMonthlyIncome * adjustedFoir - existingEmi - householdExpenses
 * If result < 0, safe EMI is 0 and "don't borrow" fires.
 */
export function calculateSafeMonthlyOutflow(
  netMonthlyIncome: number,
  existingEmi: number,
  householdExpenses: number,
  adjustedFoir: number
): number {
  const safeMonthlyOutflow = netMonthlyIncome * adjustedFoir - existingEmi - householdExpenses
  return safeMonthlyOutflow // may be negative; caller handles
}

/**
 * Calculate safe EMI from the safe monthly outflow.
 * If safeMonthlyOutflow <= 0, safe EMI = 0.
 */
export function calculateSafeEMI(safeMonthlyOutflow: number): number {
  if (safeMonthlyOutflow <= 0) return 0
  // Round to nearest ₹100
  return Math.round(safeMonthlyOutflow / 100) * 100
}

/**
 * Calculate borrower-safe ceiling (max loan amount) across available tenures.
 * Given a safe EMI, compute the loan amount each tenure can support,
 * and return the maximum.
 *
 * The formula inverts the EMI equation:
 * loan = emi * (1 - (1 + r)^-n) / r
 * where r = monthly interest rate
 */
export function calculateBorrowerSafeCeiling(
  safeEMI: number,
  netMonthlyIncome: number,
  annualInterestRate: number
): number {
  const monthlyRate = annualInterestRate / 100 / 12
  const tenures = config.TENURE_OPTIONS

  let maxCeiling = 0 as number

  for (const months of tenures) {
    // EMI = principal * r * (1+r)^n / ((1+r)^n - 1)
    // => principal = emi * ((1+r)^n - 1) / (r * (1+r)^n)
    const numerator = Math.pow(1 + monthlyRate, months) - 1
    const denominator = monthlyRate * Math.pow(1 + monthlyRate, months)

    if (denominator <= 0) continue
    const maxLoanForTenure = safeEMI * numerator / denominator

    if (maxLoanForTenure > maxCeiling) {
      maxCeiling = maxLoanForTenure
    }
  }

  // Also cap at: netMonthlyIncome * 12 * reasonablePovertyMultiplier
  // Rough cap: if safeEMI * 36 > netMonthlyIncome * 12, cap at that
  const incomeBasedCeiling = netMonthlyIncome * 12 * 1.5  // 1.5 years gross as rough cap
  if (maxCeiling > incomeBasedCeiling) {
    maxCeiling = incomeBasedCeiling
  }

  return maxCeiling
}

/**
 * Full affordability calculation.
 */
export function calculateAffordability({
  netMonthlyIncome,
  existingEmi,
  householdExpenses,
  employmentType,
  creditScoreKnown,
  employmentStable,
  annualInterestRate,
}: {
  netMonthlyIncome: number
  existingEmi: number
  householdExpenses: number
  employmentType: EmploymentType
  creditScoreKnown: boolean
  employmentStable: boolean
  annualInterestRate: number
}): AffordabilityResult {
  const adjustedFoir = getAdjustedFoir(employmentType, creditScoreKnown, employmentStable)
  const safeMonthlyOutflow = calculateSafeMonthlyOutflow(
    netMonthlyIncome,
    existingEmi,
    householdExpenses,
    adjustedFoir
  )
  const safeEMI = calculateSafeEMI(safeMonthlyOutflow)
  const borrowerSafeCeiling = calculateBorrowerSafeCeiling(safeEMI, netMonthlyIncome, annualInterestRate)

  // Stress test: 20% income drop
  const stressNetIncome = netMonthlyIncome * (1 - config.INCOME_DROP_STRESS)
  const stressSafeMonthlyOutflow = calculateSafeMonthlyOutflow(
    stressNetIncome,
    existingEmi,
    householdExpenses,
    adjustedFoir
  )
  const stressSafeEMI = calculateSafeEMI(stressSafeMonthlyOutflow)

  return {
    baseFoir: adjustedFoir,
    adjustedFoir,
    safeMonthlyOutflow,
    safeEMI,
    borrowerSafeCeiling,
    stressMonthlyOutflow: stressSafeMonthlyOutflow,
    stressEMI: stressSafeEMI,
  }
}