/**
 * Borrower Copilot — Type Definitions
 *
 * Core types used throughout the application.
 */

export interface BorrowerProfile {
  id: string
  name: string
  age: number
  incomeType: 'salaried' | 'self-employed' | 'informal'
  netMonthlyIncome: number
  existingEmi: number
  householdExpenses: number
  desiredLoanAmount: number
  loanPurpose: string
  creditScore: number | 'unknown'
  emergencySavings: number | null
  employmentHistory: number | null  // years
  businessHistory: number | null      // years (self-employed)
  propertyValue: number | null        // for secured products
  propertyDebt: number | null
  cashIncomeLow: number | null        // informal low
  cashIncomeHigh: number | null       // informal high
  existingLoans: LoanDetail[]
  responses: QuestionResponse[]
}

export interface LoanDetail {
  id: string
  type: string
  principal: number
  tenureMonths: number
  interestRate: number
  outstanding: number
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'number' | 'select' | 'range'
  options: string[] | null
  required: boolean
  employmentTypes: 'salaried' | 'self-employed' | 'informal' | 'all'
}

export interface QuestionAnswer {
  questionId: string
  value: string | number | null
  isUnknown: boolean
  isKnown?: boolean
  originalValue: string | number | null
}

export interface QuestionResponse {
  questionId: string
  answer: string | number | null
  isUnknown: boolean
}

export interface DecisionResult {
  borrowDecision: 'BORROW' | 'BORROW_LESS' | 'DONT_BORROW'
  lenderLikelyCeiling: number
  borrowerSafeCeiling: number
  recommendedAmount: number
  fairRate: {
    low: number
    high: number
    expectedLow: number
    expectedHigh: number
  }
  estimatedAPR: number
  recommendedEmi: number
  tenureTradeoffs: {
    tenureMonths: number
    monthlyEMI: number
    totalRepayment: number
    totalInterest: number
  }[]
  stressResult: {
    scenario: string
    normalEmi: number
    stressEmi: number
    normalAffordable: boolean
    stressAffordable: boolean
  }
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  mainReasons: string[]
  negotiationChecklist: string[]
  productRecommendation: string
}

export interface NegotiationCard {
  borrowingRecommendation: {
    requestedAmount: number
    lenderLikelyCeiling: number
    borrowerSafeCeiling: number
    recommendedAmount: number
    maximumEMI: number
    fairRate: number
    estimatedAPR: number
    mainReasons: string[]
    stressScenario: string
  }
  negotiationChecklist: string[]
}

/** Rate range as used in the application */
export interface RateRange {
  low: number
  high: number
  expectedLow: number
  expectedHigh: number
}

export type { BorrowDecisionResult, BorrowDecision } from '../rules/borrowDecision'
export type BorrowerDecisionResult = import('../rules/borrowDecision').BorrowDecisionResult
export type { ProductRoutingResult, ProductType } from '../rules/productRouting'