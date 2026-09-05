/**
 * Borrower Copilot — Eligibility Rules Unit Tests
 */

import { config } from '../src/rules/config'
import {
  getIncomeTypeFactor,
  getCreditScoreAdjustment,
  getBusinessHistoryAdjustment,
  calculateLenderLikelyCeiling,
  getCollateralWarning
} from '../src/rules/eligibility'

describe('Eligibility - getIncomeTypeFactor', () => {
  test('salaried_mnc -> 1.0', () => {
    expect(getIncomeTypeFactor('salaried_mnc')).toBe(config.INCOME_TYPE_FACTORS.SALARIED_MNC)
  })

  test('salaried_small -> 0.8', () => {
    expect(getIncomeTypeFactor('salaried_small')).toBe(config.INCOME_TYPE_FACTORS.SALARIED_SMALL)
  })

  test('self_employed_itr -> 0.7', () => {
    expect(getIncomeTypeFactor('self_employed_itr')).toBe(config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_ITR)
  })

  test('self_employed_no_itr -> 0.5', () => {
    expect(getIncomeTypeFactor('self_employed_no_itr')).toBe(config.INCOME_TYPE_FACTORS.SELF_EMPLOYED_NO_ITR)
  })

  test('informal -> 0.5', () => {
    expect(getIncomeTypeFactor('informal')).toBe(config.INCOME_TYPE_FACTORS.INFORMAL)
  })
})

describe('Eligibility - getCreditScoreAdjustment', () => {
  test('known credit -> 1.0', () => {
    expect(getCreditScoreAdjustment(750, true)).toBe(1.0)
  })

  test('unknown credit -> 0.9', () => {
    expect(getCreditScoreAdjustment(undefined, false)).toBe(0.9)
  })
})

describe('Eligibility - getBusinessHistoryAdjustment', () => {
  test('>= 10 years -> 1.1', () => {
    expect(getBusinessHistoryAdjustment(10)).toBe(1.1)
  })

  test('>= 5 years -> 1.0', () => {
    expect(getBusinessHistoryAdjustment(5)).toBe(1.0)
  })

  test('>= 2 years -> 0.9', () => {
    expect(getBusinessHistoryAdjustment(3)).toBe(0.9)
  })

  test('< 2 years -> 0.7', () => {
    expect(getBusinessHistoryAdjustment(1)).toBe(0.7)
  })

  test('undefined -> 1.0', () => {
    expect(getBusinessHistoryAdjustment(undefined)).toBe(1.0)
  })
})

describe('Eligibility - calculateLenderLikelyCeiling', () => {
  test('returns all required fields', () => {
    const result = calculateLenderLikelyCeiling({
      netMonthlyIncome: 100000,
      incomeType: 'salaried_mnc',
      creditScore: 750,
      creditKnown: true,
      existingEmi: 20000,
      desiredLoanAmount: 500000,
      propertyValue: undefined,
      businessYears: undefined,
      employmentType: 'salaried'
    })
    expect(result).toHaveProperty('lenderLikelyCeiling')
    expect(result).toHaveProperty('incomeTypeFactor')
    expect(result).toHaveProperty('creditScoreAdjustment')
    expect(result).toHaveProperty('existingEmiAdjustment')
    expect(result).toHaveProperty('collateralAdjustment')
    expect(result).toHaveProperty('businessHistoryAdjustment')
    expect(result).toHaveProperty('uncertaintyReduction')
    expect(result).toHaveProperty('breakdown')
  })

  test('unknown credit applies 10% reduction', () => {
    const result = calculateLenderLikelyCeiling({
      netMonthlyIncome: 100000,
      incomeType: 'salaried_mnc',
      creditScore: undefined,
      creditKnown: false,
      existingEmi: 0,
      desiredLoanAmount: 500000,
      propertyValue: undefined,
      businessYears: undefined,
      employmentType: 'salaried'
    })
    expect(result.creditScoreAdjustment).toBe(0.9)
    expect(result.uncertaintyReduction).toBe(0.1)
  })

  test('salaried MNC has full factor', () => {
    const result = calculateLenderLikelyCeiling({
      netMonthlyIncome: 100000,
      incomeType: 'salaried_mnc',
      creditScore: 750,
      creditKnown: true,
      existingEmi: 0,
      desiredLoanAmount: 500000,
      propertyValue: undefined,
      businessYears: undefined,
      employmentType: 'salaried'
    })
    expect(result.incomeTypeFactor).toBeCloseTo(1.0)
  })
})

describe('Eligibility - getCollateralWarning', () => {
  test('self-employed with property and history', () => {
    const warning = getCollateralWarning('self-employed-itr', 4500000, 14)
    expect(warning).toContain('substantial collateral')
    expect(warning).toContain('lender valuation')
  })

  test('self-employed with property but no history', () => {
    const warning = getCollateralWarning('self-employed-itr', 4500000, undefined)
    expect(warning).toContain('substantial collateral')
  })
})