/**
 * Borrower Copilot — Rule Configuration
 *
 * All important assumptions are configurable in one place.
 * Do not scatter magic numbers across components.
 */

export const config = {
  // FOIR (Fixed Obligations to Income Ratio)
  FOIR_BASE: 0.40,
  FOIR_STABLE_SALARIED: 0.45,
  FOIR_VARIABLE: 0.35,
  FOIR_STRESS: 0.30,

  // Processing fee as percentage of principal
  PROCESSING_FEE_PERCENT: 2,

  // Minimum emergency buffer (as % of net monthly income)
  MINIMUM_EMERGENCY_BUFFER: 0.10,

  // Stress test income drop percentages
  INCOME_DROP_STRESS: 0.20,   // 20% — default stress scenario
  INCOME_DROP_STRESS_SEVERE: 0.30,  // 30% — severe stress scenario

  // Conservative Loan-to-Value for secured products (e.g., LAP)
  LTV_CONSERVATIVE: 0.50,

  // Credit score thresholds
  CREDIT_SCORE_THRESHOLDS: {
    EXCELLENT: 750,
    GOOD: 700,
    FAIR: 600,
    POOR: 500,
  },

  // Income type factors for lender ceiling adjustment
  INCOME_TYPE_FACTORS: {
    SALARIED_MNC: 1.0,
    SALARIED_SMALL: 0.8,
    SELF_EMPLOYED_ITR: 0.7,
    SELF_EMPLOYED_NO_ITR: 0.5,
    INFORMAL: 0.5,
  },

  // Product type factors for rate adjustment
  PRODUCT_TYPE_FACTORS: {
    PERSONAL: 1.0,
    BUSINESS: 0.95,
    LAP: 0.85,        // Lower rates for secured
    TWO_WHEELER: 1.05,
    HOME: 0.90,
  },

  // Tenure months options
  TENURE_OPTIONS: [36, 48, 60],

  // Maximum ceiling cap for unsecured personal loans (₹ in lakhs)
  UNSECURED_CEILING_LAKHS: 100,

  // Disclaimer text constants
  DISCLAIMERS: {
    RATE: "Fair rate estimate — not the exact rate you qualify for. Actual rates depend on lender underwriting.",
    APR: "Estimated APR includes principal, interest rate, and processing fee. Other charges may apply (prepayment fees, late fees, insurance).",
    BORROWING: "This is a planning/self-assessment tool, not a lending decision or credit offer. Do not treat the lender's maximum sanction as your target borrowing amount.",
    LENDER_CEILING: "A lender may plausibly consider up to approximately ₹X based on the information provided. This is NOT the same as your safe borrowing limit.",
  },
} as const