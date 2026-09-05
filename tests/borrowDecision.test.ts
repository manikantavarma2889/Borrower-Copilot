/**
 * Borrower Copilot — Borrow/Don't Borrow Decision Logic Unit Tests
 *
 * Tests for the explicit borrow decision rules.
 */

import { makeBorrowDecision } from '../src/rules/borrowDecision'

describe('Borrow/Less/Dont Borrow Decision', () => {
  describe('makeBorrowDecision', () => {
    test('R1: proposedEMI > safe EMI -> BORROW_LESS', () => {
      const result = makeBorrowDecision({
        netMonthlyIncome: 100000,
        existingEmi: 20000,
        householdExpenses: 5000,
        proposedEMI: 30000, // > safe EMI
        creditScoreKnown: true,
        employmentStable: true,
        hasRecentEMIBounce: false,
        hasHighCostDebt: false,
        incomeIsStable: true
      })

      expect(result.decision).toBe('BORROW_LESS')
      expect(result.mainReasons.some(r => r.includes('proposed EMI') && r.includes('safe EMI'))).toBe(true)
    })

    test('R2: debt burden > 50% AND income unstable -> DONT_BORROW', () => {
      const result = makeBorrowDecision({
        netMonthlyIncome: 100000,
        existingEmi: 60000, // 60% DTI
        householdExpenses: 5000,
        proposedEMI: 10000,
        creditScoreKnown: true,
        employmentStable: false, // income unstable
        hasRecentEMIBounce: false,
        hasHighCostDebt: false,
        incomeIsStable: false
      })

      expect(result.decision).toBe('DONT_BORROW')
      expect(result.mainReasons.some(r => r.includes('debt burden'))).toBe(true)
    })

    test('R3: recent EMI bounce + high-cost debt + low income -> DONT_BORROW', () => {
      const result = makeBorrowDecision({
        netMonthlyIncome: 50000,
        existingEmi: 20000,
        householdExpenses: 5000,
        proposedEMI: 15000,
        creditScoreKnown: true,
        employmentStable: true,
        hasRecentEMIBounce: true,
        hasHighCostDebt: true,
        incomeIsStable: true
      })

      expect(result.decision).toBe('DONT_BORROW')
      expect(result.mainReasons.some(r => r.includes('recent bounced EMI'))).toBe(true)
    })

    test('R4: proposedEMI > 50% of net monthly income -> BORROW_LESS', () => {
      const result = makeBorrowDecision({
        netMonthlyIncome: 100000,
        existingEmi: 10000,
        householdExpenses: 5000,
        proposedEMI: 60000, // > 50% of income
        creditScoreKnown: true,
        employmentStable: true,
        hasRecentEMIBounce: false,
        hasHighCostDebt: false,
        incomeIsStable: true
      })

      expect(result.decision).toBe('BORROW_LESS')
      expect(result.mainReasons.some(r => r.includes('proposed EMI') && r.includes('more than 50%'))).toBe(true)
    })

    test('R6: proposedEMI <= safeEMI AND creditKnown AND stableIncome -> BORROW', () => {
      const result = makeBorrowDecision({
        netMonthlyIncome: 100000,
        existingEmi: 10000,
        householdExpenses: 5000,
        proposedEMI: 20000, // <= safe EMI
        creditScoreKnown: true,
        employmentStable: true,
        hasRecentEMIBounce: false,
        hasHighCostDebt: false,
        incomeIsStable: true
      })

      // safeEMI = (100000 * 0.4 - 10000 - 5000) = 40000 - 15000 = 25000
      // proposedEMI 20000 <= 25000 -> should pass R1
      // debtToIncomeRatio = 10000/100000 = 10% < 50% -> R2 doesn't fire
      // hasRecentEMIBounce = false -> R3 doesn't fire
      // proposedEMI 20000 <= 50% of income -> R4 doesn't fire
      // Falls through to R6 -> BORROW
      expect(result.decision).toBe('BORROW')
    })

    test('returns result with all required fields', () => {
      const result = makeBorrowDecision({
        netMonthlyIncome: 100000,
        existingEmi: 10000,
        householdExpenses: 5000,
        proposedEMI: 20000,
        creditScoreKnown: true,
        employmentStable: true,
        hasRecentEMIBounce: false,
        hasHighCostDebt: false,
        incomeIsStable: true
      })

      expect(result).toHaveProperty('decision')
      expect(result).toHaveProperty('safeEMI')
      expect(result).toHaveProperty('recommendedMaxEMI')
      expect(result).toHaveProperty('proposedEMI')
      expect(result).toHaveProperty('safeMonthlyOutflow')
      expect(result).toHaveProperty('debtToIncomeRatio')
      expect(result).toHaveProperty('mainReasons')
      expect(result).toHaveProperty('stressResult')
    })
  })
})