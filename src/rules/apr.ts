/**
 * Borrower Copilot — APR Calculation
 *
 * Estimated APR/effective cost calculation that includes processing fee.
 *
 * Must NOT imply it is the exact APR a lender will disclose if other charges are unknown.
 *
 * The app must allow the user to compare:
 *   quoted interest rate vs all-in estimated cost
 */

import { config } from './config'

/** APR result with breakdown */
export interface AprResult {
  estimatedAPR: number  // % p.a.
  totalInterest: number  // total interest over tenure
  totalProcessingFee: number
  totalCost: number      // principal + interest + processing fee
  breakdown: {
    principal: number
    interest: number
    processingFee: number
    tenureYears: number
    annualRate: number
  }
}

/**
 * Calculate estimated APR including processing fee.
 *
 * Formula:
 *   totalInterest = principal * annualRate/100 * tenureYears  (simple interest approximation)
 *   totalProcessingFee = principal * processingFeePercent/100
 *   totalCost = totalInterest + totalProcessingFee
 *   estimatedAPR = totalCost / principal / tenureYears * 100
 *
 * This gives the effective APR when including the processing fee as a upfront charge.
 */
export function calculateEstimatedAPR({
  principal,
  annualRate,
  tenureYears,
  processingFeePercent,
}: {
  principal: number
  annualRate: number
  tenureYears: number
  processingFeePercent: number
}): AprResult {
  const totalInterest = principal * (annualRate / 100) * tenureYears
  const totalProcessingFee = principal * (processingFeePercent / 100)
  const totalCost = principal + totalInterest + totalProcessingFee

  const estimatedAPR = ((totalInterest + totalProcessingFee) / tenureYears / principal) * 100

  return {
    estimatedAPR,
    totalInterest,
    totalProcessingFee,
    totalCost,
    breakdown: {
      principal,
      interest: totalInterest,
      processingFee: totalProcessingFee,
      tenureYears,
      annualRate,
    },
  }
}

/**
 * Compare quoted interest rate vs all-in estimated APR.
 *
 * Example output:
 *   "Quoted interest rate: 12% p.a.
 *    Estimated APR (with 2% processing fee): 12.4% p.a.
 *    Total repayment over 5 years: ₹16.20 lakh
 *    Total interest: ₹6.20 lakh
 *    Processing fee: ₹20,000"
 */
export function getAprComparison({
  principal,
  annualRate,
  tenureYears,
}: {
  principal: number
  annualRate: number
  tenureYears: number
}): {
  quotedRate: string
  estimatedApr: string
  totalRepayment: number
  totalInterest: number
  processingFee: number
  aprExplanation: string
} {
  const processingFeePercent = config.PROCESSING_FEE_PERCENT
  const processingFee = principal * (processingFeePercent / 100)
  const result = calculateEstimatedAPR({
    principal,
    annualRate,
    tenureYears,
    processingFeePercent,
  })

  const totalRepayment = result.totalCost
  const totalInterest = result.totalInterest

  const quotedRate = `${annualRate}% p.a.`
  const estimatedApr = `${result.estimatedAPR.toFixed(1)}% p.a.`

  const aprExplanation = `Quoted interest rate: ${quotedRate}
Estimated APR (with ${config.PROCESSING_FEE_PERCENT}% processing fee): ${estimatedApr}
Total repayment over ${tenureYears} years: ₹${totalRepayment.toLocaleString()}
Total interest: ₹${totalInterest.toLocaleString()}
Processing fee: ₹${processingFee.toLocaleString()}

Note: The estimated APR includes the processing fee. Actual APR may vary if other charges apply (prepayment/foreclosure fees, late payment fees, insurance add-ons).`

  return {
    quotedRate,
    estimatedApr,
    totalRepayment,
    totalInterest,
    processingFee,
    aprExplanation,
  }
}