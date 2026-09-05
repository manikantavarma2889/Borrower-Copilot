/**
 * Borrower Copilot — Affordability Rules Unit Tests
 */

import { config } from '../src/rules/config'
import {
  getAdjustedFoir,
  calculateSafeMonthlyOutflow,
  calculateSafeEMI,
  calculateBorrowerSafeCeiling,
  calculateAffordability
} from '../src/rules/affordability'

describe('Affordability - getAdjustedFoir', () => {
  test('salaried with known credit and stable employment', () => {
    const result = getAdjustedFoir('salaried', true, true)
    expect(result).toBe(config.FOIR_STABLE_SALARIED)
  })

  test('salaried without known credit', () => {
    const result = getAdjustedFoir('salaried', false, true)
    expect(result).toBe(config.FOIR_BASE)
  })

  test('salaried without stable employment', () => {
    const result = getAdjustedFoir('salaried', true, false)
    expect(result).toBe(config.FOIR_BASE)
  })

  test('self-employed', () => {
    const result = getAdjustedFoir('self-employed', true, true)
    expect(result).toBe(config.FOIR_VARIABLE)
  })

  test('informal', () => {
    const result = getAdjustedFoir('informal', true, true)
    expect(result).toBe(config.FOIR_VARIABLE * 0.8)
  })
})

describe('Affordability - calculateSafeMonthlyOutflow', () => {
  test('basic calculation', () => {
    const result = calculateSafeMonthlyOutflow(100000, 20000, 15000, 0.4)
    expect(result).toBe(5000)
  })

  test('negative result', () => {
    const result = calculateSafeMonthlyOutflow(50000, 20000, 25000, 0.4)
    expect(result).toBe(-25000)
  })

  test('zero EMI and expenses', () => {
    const result = calculateSafeMonthlyOutflow(100000, 0, 0, 0.4)
    expect(result).toBe(40000)
  })
})

describe('Affordability - calculateSafeEMI', () => {
  test('positive outflow rounded to 100', () => {
    expect(calculateSafeEMI(5340)).toBe(5300)
  })

  test('zero or negative -> 0', () => {
    expect(calculateSafeEMI(-5000)).toBe(0)
    expect(calculateSafeEMI(0)).toBe(0)
  })

  test('exact 100 -> 100', () => {
    expect(calculateSafeEMI(100)).toBe(100)
  })
})

describe('Affordability - calculateBorrowerSafeCeiling', () => {
  test('calculates max loan across tenures', () => {
    const result = calculateBorrowerSafeCeiling(5000, 100000, 12)
    expect(result).toBeGreaterThan(0)
    expect(isFinite(result)).toBe(true)
  })

  test('caps at income-based ceiling', () => {
    const result = calculateBorrowerSafeCeiling(100000, 100000, 12)
    expect(isFinite(result)).toBe(true)
  })
})

describe('Affordability - calculateAffordability', () => {
  test('returns all required fields', () => {
    const result = calculateAffordability({
      netMonthlyIncome: 110000,
      existingEmi: 14000,
      householdExpenses: 0,
      employmentType: 'salaried',
      creditScoreKnown: true,
      employmentStable: true,
      annualInterestRate: 12
    })
    expect(result).toHaveProperty('baseFoir')
    expect(result).toHaveProperty('adjustedFoir')
    expect(result).toHaveProperty('safeMonthlyOutflow')
    expect(result).toHaveProperty('safeEMI')
    expect(result).toHaveProperty('borrowerSafeCeiling')
    expect(result).toHaveProperty('stressMonthlyOutflow')
    expect(result).toHaveProperty('stressEMI')
  })

  test('stress test lowers EMI', () => {
    const result = calculateAffordability({
      netMonthlyIncome: 110000,
      existingEmi: 14000,
      householdExpenses: 0,
      employmentType: 'salaried',
      creditScoreKnown: true,
      employmentStable: true,
      annualInterestRate: 12
    })
    expect(result.safeEMI).toBeGreaterThanOrEqual(result.stressEMI)
  })

  test('informal gets lower FOIR', () => {
    const result = calculateAffordability({
      netMonthlyIncome: 28000,
      existingEmi: 35000,
      householdExpenses: 15000,
      employmentType: 'informal',
      creditScoreKnown: false,
      employmentStable: false,
      annualInterestRate: 12
    })
    expect(result.adjustedFoir).toBeLessThan(config.FOIR_VARIABLE)
  })
})