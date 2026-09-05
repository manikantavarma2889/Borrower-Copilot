/**
 * Borrower Copilot — Interest Rate Model
 *
 * Returns a rate range, NOT a single rate.
 * Rate affected by: credit score, income stability, employment history,
 * secured vs unsecured, borrower uncertainty.
 */

import { config } from './config'

/** Rate range structure */
export interface RateRange {
  low: number        // absolute floor (% p.a.)
  high: number       // absolute ceiling (% p.a.)
  expectedLow: number // most likely lower bound for this profile
  expectedHigh: number // most likely upper bound for this profile
}

/** Interest rate result with confidence info */
export interface InterestRateResult {
  fairRate: RateRange
  creditScoreKnown: boolean
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
}

/**
 * Determine the rate range based on credit score, employment type, and product.
 *
 * When credit score is unknown:
 * - Widen the range
 * - Lower confidence
 * - Explicitly explain the uncertainty
 *
 * Do not fabricate precision.
 */
export function calculateFairRateRange({
  creditScore,
  creditScoreKnown: directCreditKnown,
  creditKnown,
  employmentType, // 'salaried' | 'self-employed' | 'informal'
  productType, // 'personal' | 'business' | 'lap' | 'two-wheeler' | 'home'
  employmentStable, // true if tenure >= 2 years
  businessYears, // optional, for self-employed
}: {
  creditScore: number | undefined
  creditScoreKnown?: boolean
  creditKnown?: boolean
  employmentType: 'salaried' | 'self-employed' | 'informal'
  productType: 'personal' | 'business' | 'lap' | 'two-wheeler' | 'home'
  employmentStable: boolean
  businessYears?: number
}): InterestRateResult {
  const creditScoreKnown = Boolean(directCreditKnown ?? creditKnown)
  const baseRate = 8 // base Indian personal loan rate (% p.a.)

  // Determine credit-based adjustments
  let creditLowAdjustment = 0
  let creditHighAdjustment = 0
  let creditExplanation = ''

  if (creditScoreKnown && creditScore !== undefined) {
    if (creditScore >= 750) {
      creditLowAdjustment = -1  // better rate
      creditHighAdjustment = -0.5
      creditExplanation = 'Your high credit score (750+) qualifies you for competitive rates.'
    } else if (creditScore >= 700) {
      creditLowAdjustment = -0.5
      creditHighAdjustment = 0
      creditExplanation = 'Your good credit score (700-749) qualifies you for favorable rates.'
    } else if (creditScore >= 600) {
      creditLowAdjustment = 0.5
      creditHighAdjustment = 1.5
      creditExplanation = 'Your credit score (600-699) affects the rate offered.'
    } else if (creditScore >= 500) {
      creditLowAdjustment = 1.5
      creditHighAdjustment = 3
      creditExplanation = 'Your credit score (500-599) will result in a higher rate.'
    } else {
      creditLowAdjustment = 3
      creditHighAdjustment = 5
      creditExplanation = 'Your low credit score (< 500) will significantly impact the rate offered.'
    }
  } else {
    // Credit score unknown — widen range, lower confidence
    creditLowAdjustment = 2
    creditHighAdjustment = 5
    creditExplanation = 'Your credit score is unknown. The rate range is wider to reflect this uncertainty. A lender may offer rates anywhere in this range based on a full credit assessment.'
  }

  // Employment type adjustment
  let employmentAdjustment = 0
  let employmentNote = ''

  switch (employmentType) {
    case 'salaried':
      if (employmentStable) {
        employmentAdjustment = 0
        employmentNote = 'Stable salaried employment.'
      } else {
        employmentAdjustment = 0.5
        employmentNote = 'Salaried employment with some instability.'
      }
      break
    case 'self-employed':
      employmentAdjustment = 1.0
      if (businessYears !== undefined && businessYears >= 5) {
        employmentAdjustment = 0.5  // long business history helps
        employmentNote = 'Self-employed with long business history (' + businessYears + ' years).'
      } else {
        employmentAdjustment = 1.5
        employmentNote = 'Self-employed income. Documented income constraints apply.'
      }
      break
    case 'informal':
      employmentAdjustment = 5.0
      employmentNote = 'Informal/variable income. Higher rate range reflects income uncertainty.'
      break
  }

  // Product type adjustment
  let productAdjustment = 0
  let productNote = ''

  switch (productType) {
    case 'personal':
      productAdjustment = 0
      productNote = 'Personal loan.'
      break
    case 'business':
      productAdjustment = -0.5
      productNote = 'Business loan — often lower rates for productive purpose.'
      break
    case 'lap':
      productAdjustment = -1.5
      productNote = 'Loan Against Property — secured, lower rates.'
      break
    case 'two-wheeler':
      productAdjustment = 0.5
      productNote = 'Two-wheeler loan — product-specific rate.'
      break
    case 'home':
      productAdjustment = -1.0
      productNote = 'Home loan — lowest rates, long tenure.'
      break
  }

  // Calculate rate range components
  // expectedLow = base + credit + employment + product - margin
  // expectedHigh = base + credit + employment + product + margin
  // low = expectedLow - 2 (but not below 6%)
  // high = expectedHigh + 3 (but not above 28%)

  const expectedLow = Math.max(6, baseRate + creditLowAdjustment + employmentAdjustment + productAdjustment - 1)
  const expectedHigh = Math.min(28, baseRate + creditHighAdjustment + employmentAdjustment + productAdjustment + 3)

  const low = Math.max(6, expectedLow - 2)
  const high = Math.min(28, expectedHigh + 3)

  const fairRate: RateRange = {
    low,
    high,
    expectedLow,
    expectedHigh,
  }

  // Determine confidence level
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  if (creditScoreKnown && employmentStable) {
    confidence = 'HIGH'
  } else if (creditScoreKnown || (businessYears !== undefined && businessYears >= 5)) {
    confidence = 'MEDIUM'
  } else {
    confidence = 'LOW'
  }

  return {
    fairRate,
    creditScoreKnown,
    confidence,
    explanation: creditExplanation + ' ' + employmentNote + ' ' + productNote,
  }
}

/**
 * Get the explanation text for the rate range display.
 * This is used in the UI to explain what affects the rate.
 */
export function getRateExplanation({
  creditScoreKnown,
  creditScore,
  employmentType,
  employmentStable,
  businessYears,
  productType,
  confidence,
}: {
  creditScoreKnown: boolean
  creditScore: number | undefined
  employmentType: 'salaried' | 'self-employed' | 'informal'
  employmentStable: boolean
  businessYears?: number
  productType: 'personal' | 'business' | 'lap' | 'two-wheeler' | 'home'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}): string {
  const parts: string[] = []

  // Credit score
  if (creditScoreKnown && creditScore !== undefined) {
    if (creditScore >= 750) {
      parts.push('Your high credit score (750+) improves your expected rate.')
    } else if (creditScore >= 700) {
      parts.push('Your good credit score (700-749) qualifies you for favorable rates.')
    } else if (creditScore >= 600) {
      parts.push('Your credit score (600-699) affects the rate you may receive.')
    } else if (creditScore >= 500) {
      parts.push('Your credit score (500-599) will result in a higher rate.')
    } else {
      parts.push('Your low credit score (< 500) will significantly impact the rate offered.')
    }
  } else {
    parts.push('Your credit score is unknown, so the rate range is wider to reflect this uncertainty.')
  }

  // Employment
  if (employmentType === 'salaried') {
    if (employmentStable) {
      parts.push('Your stable salaried employment supports a lower rate.')
    } else {
      parts.push('Your salaried employment is noted; rate reflects income stability.')
    }
  } else if (employmentType === 'self-employed') {
    if (businessYears !== undefined && businessYears >= 5) {
      parts.push(`Your ${businessYears}-year business history improves rate potential.`)
    } else {
      parts.push('Self-employed income; documented ITR constrains the rate.')
    }
  } else if (employmentType === 'informal') {
    parts.push('Informal/variable income; rate range reflects income uncertainty.')
  }

  // Product
  const productNames: Record<string, string> = {
    personal: 'Personal loan',
    business: 'Business loan',
    lap: 'Loan Against Property',
    'two-wheeler': 'Two-wheeler loan',
    home: 'Home loan',
  }
  parts.push(`This is a ${productNames[productType] || 'personal'} loan product.`)

  // Confidence language
  if (confidence === 'HIGH') {
    parts.push('Your profile has enough information for a relatively narrow planning range.')
  } else if (confidence === 'MEDIUM') {
    parts.push('Some information is missing, so the rate range is wider.')
  } else {
    parts.push('Several important inputs are unknown. Treat this as a planning estimate.')
  }

  return parts.join(' ')
}