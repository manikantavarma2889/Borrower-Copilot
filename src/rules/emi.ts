/**
 * Borrower Copilot — EMI Calculation
 *
 * Standard EMI calculation and tenure trade-offs.
 */

import { config } from './config'
import { getAdjustedFoir } from './affordability'

/** EMI result for a specific tenure */
export interface EmisForTenure {
  tenureMonths: number
  monthlyEMI: number
  totalRepayment: number
  totalInterest: number
}

/** Full EMI result across all tenures */
export interface EmiResult {
  emis: EmisForTenure[]
  recommendedMaxEMI?: number
}

/**
 * Calculate standard EMI using the annuity formula.
 *
 * emi = principal * r * (1+r)^n / ((1+r)^n - 1)
 * where r = monthly interest rate = annualRate/100/12
 * and n = number of months (tenure)
 */
export function calculateEMI({
  principal,
  annualRate,
  tenureMonths,
}: {
  principal: number
  annualRate: number
  tenureMonths: number
}): number {
  const monthlyRate = annualRate / 100 / 12

  if (monthlyRate <= 0 || tenureMonths <= 0) return 0

  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1

  if (denominator === 0) return 0

  const emi = numerator / denominator
  return Math.round(emi / 100) * 100  // round to nearest ₹100
}

/**
 * Calculate EMI across all available tenures.
 *
 * Returns EMI, total repayment, and total interest for each tenure.
 */
export function calculateEMIsForTenures({
  principal,
  annualRate,
}: {
  principal: number
  annualRate: number
}): EmiResult {
  const tenures = config.TENURE_OPTIONS
  const emis: EmisForTenure[] = []

  for (const months of tenures) {
    const monthlyEMI = calculateEMI({ principal, annualRate, tenureMonths: months })
    const totalRepayment = monthlyEMI * months
    const totalInterest = totalRepayment - principal

    emis.push({
      tenureMonths: months,
      monthlyEMI,
      totalRepayment,
      totalInterest,
    })
  }

  return { emis }
}

/**
 * Calculate recommended maximum EMI given borrower's financial profile.
 *
 * recommendedMaxEMI = netMonthlyIncome * adjustedFoir - existingEmi - householdExpenses
 */
export function calculateRecommendedMaxEMI({
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
  employmentType: 'salaried' | 'self-employed' | 'informal'
  creditScoreKnown: boolean
  employmentStable: boolean
  annualInterestRate: number
}): number {
  const adjustedFoir = getAdjustedFoir(
    employmentType,
    creditScoreKnown,
    employmentStable
  )

  const safeMonthlyOutflow = netMonthlyIncome * adjustedFoir - existingEmi - householdExpenses
  const recommendedMaxEMI = Math.round(
    Math.max(0, safeMonthlyOutflow) / 100) * 100

  return recommendedMaxEMI
}

/**
 * Show tenure trade-offs: 36, 48, 60 months where applicable.
 * For each: EMI, total repayment, total interest.
 *
 * Key rule: "Longer tenure: lower monthly EMI, higher total interest.
 * Shorter tenure: higher monthly EMI, lower total interest."
 */
export function getTenureTradeoffs({
  principal,
  annualRate,
  netMonthlyIncome,
  existingEmi,
  householdExpenses,
  employmentType,
  creditScoreKnown,
}: {
  principal: number
  annualRate: number
  netMonthlyIncome: number
  existingEmi: number
  householdExpenses: number
  employmentType: 'salaried' | 'self-employed' | 'informal'
  creditScoreKnown: boolean
}) {
  const { emis } = calculateEMIsForTenures({ principal, annualRate })
  const recommendedMaxEMI = calculateRecommendedMaxEMI({
    netMonthlyIncome,
    existingEmi,
    householdExpenses,
    employmentType,
    creditScoreKnown,
    employmentStable: false, // will be filled in by caller
    annualInterestRate: annualRate,
  })

  return {
    emis,
    recommendedMaxEMI,
    tradeoffNote:
      'Longer tenure: lower monthly EMI, higher total interest. ' +
      'Shorter tenure: higher monthly EMI, lower total interest.',
  }
}

/**
 * Get the EMI explanation text for the results screen.
 */
export function getEMIExplanation({
  recommendedMaxEMI,
  existingEmi,
  netMonthlyIncome,
  safeEMI,
}: {
  recommendedMaxEMI: number
  existingEmi: number
  netMonthlyIncome: number
  safeEMI: number
}): string {
  const usedPercentage = (recommendedMaxEMI / netMonthlyIncome) * 100
  const existingPercentage = (existingEmi / netMonthlyIncome) * 100

  const parts: string[] = [
    `Your recommended maximum EMI is ₹${recommendedMaxEMI.toLocaleString()}.`,
  ]

  if (existingEmi > 0) {
    parts.push(
      `Your existing EMI of ₹${existingEmi.toLocaleString()} already uses ${existingPercentage.toFixed(
        1,
      )}% of your monthly income.`,
    )
  }

  if (safeEMI > 0) {
    const safePercentage = (safeEMI / netMonthlyIncome) * 100
    parts.push(
      `Your safe EMI (based on your income and obligations) is ₹${safeEMI.toLocaleString()}`,
    )
    parts.push(`(${safePercentage.toFixed(1)}% of your monthly income).`)
  }

  parts.push(
    `Based on an assumed ${usedPercentage.toFixed(1)}% of your monthly income, ` +
      `this EMI is ` +
      (usedPercentage <= 50 ? 'comfortable' : usedPercentage <= 65 ? 'manageable but tight' : 'high') +
      `.`,
  )

  return parts.join(' ')
}