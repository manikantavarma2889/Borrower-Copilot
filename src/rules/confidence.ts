/**
 * Borrower Copilot — Confidence Model
 *
 * Rule-based confidence (NOT machine learning).
 * Based on data completeness and quality.
 * Affects: range width, language, explanations.
 */

import { config } from './config'

/** Confidence level */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

/** Confidence result */
export interface ConfidenceResult {
  level: ConfidenceLevel
  score: number  // 0-10, how many of 10 must questions are well-answered
  explanations: string[]
}

/**
 * Calculate confidence level based on how many must questions are answered.
 *
 * Scoring:
 * - Q1 (loan purpose): 1 point
 * - Q2 (desired amount): 1 point
 * - Q3 (income type): 1 point
 * - Q4 (net monthly income): 1 point
 * - Q5 (existing EMI): 1 point
 * - Q6 (household expenses): 1 point
 * - Q7 (age): 1 point
 * - Q8 (credit score known): 1 point
 * - Q9 (emergency savings): 1 point
 * - Q10 (employment history): 1 point
 *
 * Total: 10 points
 *
 * HIGH: 8-10 points
 * MEDIUM: 5-7 points
 * LOW: 0-4 points
 */
export function calculateConfidence({
  loanPurposeProvided,
  desiredAmountProvided,
  incomeTypeProvided,
  netMonthlyIncomeProvided,
  existingEmiProvided,
  householdExpensesProvided,
  ageProvided,
  creditScoreKnown,
  emergencySavingsProvided,
  employmentHistoryProvided,
}: {
  loanPurposeProvided: boolean
  desiredAmountProvided: boolean
  incomeTypeProvided: boolean
  netMonthlyIncomeProvided: boolean
  existingEmiProvided: boolean
  householdExpensesProvided: boolean
  ageProvided: boolean
  creditScoreKnown: boolean
  emergencySavingsProvided: boolean
  employmentHistoryProvided: boolean
}): ConfidenceResult {
  let score = 0
  const explanations: string[] = []

  if (loanPurposeProvided) {
    score += 1
    explanations.push('Loan purpose provided.')
  } else {
    explanations.push('Loan purpose unknown — wider ranges applied.')
  }

  if (desiredAmountProvided) {
    score += 1
  } else {
    explanations.push('Desired amount unknown — recommended amount cannot be calculated.')
  }

  if (incomeTypeProvided) {
    score += 1
  } else {
    explanations.push('Income type unknown — most conservative FOIR threshold applied.')
  }

  if (netMonthlyIncomeProvided) {
    score += 1
  } else {
    explanations.push('Net monthly income unknown — calculations cannot proceed.')
  }

  if (existingEmiProvided) {
    score += 1
  } else {
    explanations.push('Existing EMI unknown — FOIR calculation less precise.')
  }

  if (householdExpensesProvided) {
    score += 1
  } else {
    explanations.push('Household expenses assumed at conservative default.')
  }

  if (ageProvided) {
    score += 1
  } else {
    explanations.push('Age assumed at standard retirement boundary.')
  }

  if (creditScoreKnown) {
    score += 1
  } else {
    explanations.push('Credit score unknown — rate range widened.')
  }

  if (emergencySavingsProvided) {
    score += 1
  } else {
    explanations.push('Emergency savings unknown — stress test uses conservative buffer.')
  }

  if (employmentHistoryProvided) {
    score += 1
  } else {
    explanations.push('Employment/business history not documented — confidence reduced.')
  }

  // Determine level
  let level: ConfidenceLevel
  if (score >= 8) {
    level = 'HIGH'
    explanations.unshift('HIGH: Your profile has enough information for a relatively narrow planning range.')
  } else if (score >= 5) {
    level = 'MEDIUM'
    explanations.unshift('MEDIUM: Some information is missing, so the rate/eligibility range is wider.')
  } else {
    level = 'LOW'
    explanations.unshift('LOW: Several important inputs are unknown. Treat this as a planning estimate.')
  }

  return {
    level,
    score,
    explanations,
  }
}

/**
 * Get language mapping for confidence level.
 * Used in UI to format explanations.
 */
export function getConfidenceLanguage(level: ConfidenceLevel): {
  label: string
  prefix: string
  rangeNote: string
} {
  switch (level) {
    case 'HIGH':
      return {
        label: 'HIGH',
        prefix: 'Your profile has enough information for a relatively narrow planning range.',
        rangeNote: 'Rate and eligibility ranges are designed-width for your profile.',
      }
    case 'MEDIUM':
      return {
        label: 'MEDIUM',
        prefix: 'Some information is missing, so the rate/eligibility range is wider.',
        rangeNote: 'Ranges are wider to account for missing inputs.',
      }
    case 'LOW':
      return {
        label: 'LOW',
        prefix: 'Several important inputs are unknown. Treat this as a planning estimate.',
        rangeNote: 'All outputs are wide planning ranges. Seek personalized advice for precise figures.',
      }
    default:
      return {
        label: 'UNKNOWN',
        prefix: '',
        rangeNote: '',
      }
  }
}