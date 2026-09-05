/**
 * Borrower Copilot — EMI Calculation Unit Tests
 *
 * Tests for EMI calculation and tenure trade-offs.
 */

import { calculateEMI, calculateEMIsForTenures, calculateRecommendedMaxEMI, getTenureTradeoffs } from '../src/rules/emi'
import { config } from '../src/rules/config'

describe('EMI Calculation', () => {
  describe('calculateEMI', () => {
    test('standard EMI calculation for 1L at 12% for 12 months', () => {
      const emi = calculateEMI({ principal: 100000, annualRate: 12, tenureMonths: 12 })
      expect(emi).toBeGreaterThan(8000)
      expect(emi).toBeLessThan(10000)
      // EMI should be rounded to nearest ₹100
      expect(emi % 100).toBe(0)
    })

    test('EMI for longer tenure is lower (all else equal)', () => {
      const emi12 = calculateEMI({ principal: 100000, annualRate: 12, tenureMonths: 12 })
      const emi36 = calculateEMI({ principal: 100000, annualRate: 12, tenureMonths: 36 })
      expect(emi36).toBeLessThan(emi12)
    })

    test('rounds to nearest ₹100', () => {
      const emi = calculateEMI({ principal: 100000, annualRate: 12, tenureMonths: 12 })
      expect(emi % 100).toBe(0)
    })
  })

  describe('calculateEMIsForTenures', () => {
    test('returns EMI results for all configured tenures', () => {
      const result = calculateEMIsForTenures({ principal: 100000, annualRate: 12 })
      expect(result.emis).toHaveLength(config.TENURE_OPTIONS.length)
      expect(result.emis).toHaveLength(3) // 36, 48, 60

      result.emis.forEach(emi => {
        expect(emi).toHaveProperty('tenureMonths')
        expect(emi).toHaveProperty('monthlyEMI')
        expect(emi).toHaveProperty('totalRepayment')
        expect(emi).toHaveProperty('totalInterest')
      })
    })

    test('totalInterest = totalRepayment - principal', () => {
      const result = calculateEMIsForTenures({ principal: 100000, annualRate: 12 })
      result.emis.forEach(emi => {
        expect(emi.totalInterest).toBeCloseTo(emi.totalRepayment - 100000)
      })
    })
  })

  describe('calculateRecommendedMaxEMI', () => {
    test('salaried with known credit and stable employment -> higher FOIR', () => {
      const result = calculateRecommendedMaxEMI({
        netMonthlyIncome: 110000,
        existingEmi: 14000,
        householdExpenses: 0,
        employmentType: 'salaried',
        creditScoreKnown: true,
        employmentStable: true,
        annualInterestRate: 12
      })
      // Adjusted FOIR = 45% for salaried stable
      // safeMonthlyOutflow = 110000 * 0.45 - 14000 - 0 = 49500 - 14000 = 35500
      expect(result).toBe(35500)
    })

    test('informal borrower -> lower FOIR with additional buffer', () => {
      const result = calculateRecommendedMaxEMI({
        netMonthlyIncome: 28000,
        existingEmi: 35000,
        householdExpenses: 15000,
        employmentType: 'informal',
        creditScoreKnown: false,
        employmentStable: false,
        annualInterestRate: 12
      })
      // Adjusted FOIR = FOIR_VARIABLE * 0.8 = 35% * 0.8 = 28%
      // safeMonthlyOutflow = 28000 * 0.28 - 35000 - 15000 = 7840 - 50000 = -42160
      // Rounded max = max(0, -42160) = 0
      expect(result).toBe(0)
    })

    test('zero net income -> 0', () => {
      const result = calculateRecommendedMaxEMI({
        netMonthlyIncome: 0,
        existingEmi: 0,
        householdExpenses: 0,
        employmentType: 'salaried',
        creditScoreKnown: true,
        employmentStable: true,
        annualInterestRate: 12
      })
      expect(result).toBe(0)
    })
  })

  describe('getTenureTradeoffs', () => {
    test('returns tradeoffs for 36, 48, 60 months', () => {
      const result = getTenureTradeoffs({
        principal: 1000000,
        annualRate: 12,
        netMonthlyIncome: 110000,
        existingEmi: 14000,
        householdExpenses: 0,
        employmentType: 'salaried',
        creditScoreKnown: true
      })

      expect(result.emis).toHaveLength(3)
      expect(result.recommendedMaxEMI).toBeGreaterThan(0)
      expect(result.tradeoffNote).toContain('Longer tenure')
    })
  })
})