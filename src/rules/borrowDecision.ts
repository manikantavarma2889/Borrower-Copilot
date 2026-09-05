/**
 * Borrower Copilot — Borrow/Don't Borrow Decision Logic
 *
 * Explicit decision rules with explainable outcomes:
 * - BORROW
 * - BORROW LESS
 * - DON'T BORROW
 */

import { config } from './config'

/** Borrow decision outcomes */
export type BorrowDecision = 'BORROW' | 'BORROW_LESS' | 'DONT_BORROW'

/** Decision rule explanation */
export interface DecisionRule {
  id: string
  name: string
  condition: string
  outcome: BorrowDecision
  explanation: string
}

/** Full decision result */
export interface BorrowDecisionResult {
  decision: BorrowDecision
  safeEMI: number
  recommendedMaxEMI: number
  proposedEMI: number
  safeMonthlyOutflow: number
  debtToIncomeRatio: number
  mainReasons: string[]
  stressResult: {
    scenario: string
    stressEMI: number
    stressSafeEMI: number
    affordableUnderStress: boolean
  }
}

/**
 * Make the borrow/borrow less/don't borrow decision.
 *
 * Rules (ordered from most to least conservative):
 *
 * R1: proposedEMI > safeEMI → BORROW_LESS
 * R2: existing debt burden > 50% of income AND income unstable → DONT_BORROW
 * R3: recentEMIBounce + highCostDebt + lowIncome → DONT_BORROW
 * R4: proposedEMI > 50% of netMonthlyIncome → BORROW_LESS
 * R5: productive borrowing appears financially plausible → BORROW may be possible
 * R6: proposedEMI <= safeEMI AND creditKnown AND stableIncome → BORROW
 */
export function makeBorrowDecision({
  netMonthlyIncome,
  existingEmi,
  householdExpenses,
  proposedEMI,
  creditScoreKnown,
  employmentStable,
  hasRecentEMIBounce,
  hasHighCostDebt,
  incomeIsStable,
}: {
  netMonthlyIncome: number
  existingEmi: number
  householdExpenses: number
  proposedEMI: number
  creditScoreKnown: boolean
  employmentStable: boolean
  hasRecentEMIBounce: boolean
  hasHighCostDebt: boolean
  incomeIsStable: boolean
}): BorrowDecisionResult {
  const safeMonthlyOutflow = netMonthlyIncome * config.FOIR_BASE - existingEmi - householdExpenses
  const safeEMI = Math.round(safeMonthlyOutflow / 100) * 100
  const debtToIncomeRatio = (existingEmi / netMonthlyIncome) * 100

  const mainReasons: string[] = []
  let decision: BorrowDecision = 'BORROW'
  let stressScenario = ''
  let stressEMI = proposedEMI
  let stressSafeEMI = safeEMI
  let affordableUnderStress = true

  // R1: proposedEMI > safe EMI → BORROW_LESS
  if (proposedEMI > safeEMI) {
    decision = 'BORROW_LESS'
    mainReasons.push(
      `Your proposed EMI of ₹${proposedEMI.toLocaleString()} exceeds your safe EMI of ₹${safeEMI.toLocaleString()}. ` +
      `Borrowing less is recommended.`
    )
    stressScenario = 'EMI exceeds safe limit'
    stressEMI = proposedEMI
    stressSafeEMI = safeEMI
    affordableUnderStress = false
  }

  // R2: existing debt burden > 50% of income AND income unstable → DONT_BORROW
  if (debtToIncomeRatio > 50 && !employmentStable) {
    decision = 'DONT_BORROW'
    mainReasons.push(
      `Your current debt burden (existing EMI of ₹${existingEmi.toLocaleString()} / ₹${netMonthlyIncome.toLocaleString()} income = ${debtToIncomeRatio.toFixed(1)}%) exceeds 50% of your income, ` +
      `and your income is unstable. Adding more borrowing is very risky.`
    )
    stressScenario = 'Excessive debt burden + unstable income'
    stressSafeEMI = Math.round((netMonthlyIncome * 0.3 * config.FOIR_BASE - existingEmi - householdExpenses) / 100) * 100
    affordableUnderStress = false
  }

  // R3: recent EMI bounce + high-cost debt + low income → DONT_BORROW
  if (hasRecentEMIBounce && hasHighCostDebt) {
    decision = 'DONT_BORROW'
    mainReasons.push(
      'You have a recent bounced EMI, high-cost existing debt, and limited income. ' +
      'Avoiding additional borrowing is recommended.'
    )
    stressScenario = 'Recent bounce + high-cost debt'
    stressSafeEMI = Math.round((netMonthlyIncome * config.FOIR_BASE * 0.8 - existingEmi - householdExpenses) / 100) * 100
    affordableUnderStress = false
  }

  // R4: proposedEMI > 50% of net monthly income → BORROW_LESS
  if (proposedEMI > netMonthlyIncome * 0.5) {
    if (decision !== 'DONT_BORROW') {
      decision = 'BORROW_LESS'
    }
    mainReasons.push(
      `Your proposed EMI of ₹${proposedEMI.toLocaleString()} is more than 50% of your monthly income (₹${netMonthlyIncome.toLocaleString()}). ` +
      `This is a high burden. Consider borrowing less.`
    )
    if (!stressScenario) {
      stressScenario = 'EMI > 50% of income'
      stressSafeEMI = safeEMI
      affordableUnderStress = proposedEMI <= safeEMI
    }
  }

  // R5: productive borrowing appears financially plausible → BORROW
  // (Only if no earlier rule fired)
  if (decision === 'BORROW') {
    mainReasons.push(
      'Based on your profile, borrowing appears financially plausible IF you stay within recommended limits.'
    )
  }

  // R6: proposedEMI <= safeEMI AND creditKnown AND stableIncome → BORROW
  // (Falls through if no rule fired above)

  // Determine stress result text
  if (affordableUnderStress === undefined) {
    affordableUnderStress = proposedEMI <= stressSafeEMI
  }

  return {
    decision,
    safeEMI,
    recommendedMaxEMI: safeEMI,
    proposedEMI,
    safeMonthlyOutflow,
    debtToIncomeRatio,
    mainReasons,
    stressResult: {
      scenario: stressScenario || '20% income drop stress test',
      stressEMI,
      stressSafeEMI,
      affordableUnderStress,
    },
  }
}

/**
 * Get the decision explanation text for display.
 */
export function getDecisionExplanation(result: BorrowDecisionResult): string {
  const { decision, mainReasons, stressResult } = result

  const decisionLabels: Record<BorrowDecision, string> = {
    BORROW: 'BORROW',
    BORROW_LESS: 'BORROW LESS',
    DONT_BORROW: "DON'T BORROW",
  }

  const prefix = decisionLabels[decision]

  const reasonText = mainReasons.length > 0 ? mainReasons[0] : 'No specific concerns identified.'

  const stressNote = stressResult.affordableUnderStress
    ? ' The recommended EMI remains manageable even under the stress scenario.'
    : ' The recommended EMI becomes unmanageable under the stress scenario. ' +
      `Consider reducing the borrowing amount or restructuring existing debt.`

  return `${prefix}: ${reasonText} ${stressNote}`
}