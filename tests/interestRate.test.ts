/**
 * Borrower Copilot — Interest Rate Model Unit Tests
 */

import { calculateFairRateRange, getRateExplanation } from '../src/rules/interestRate'
import { config } from '../src/rules/config'

describe('InterestRate - calculateFairRateRange', () => {
  test('salaried with excellent known credit', () => {
    const result = calculateFairRateRange({
      creditScore: 780,
      creditScoreKnown: true,
      employmentType: 'salaried',
      productType: 'personal',
      employmentStable: true,
      businessYears: undefined
    })
    expect(result.fairRate).toHaveProperty('low')
    expect(result.fairRate).toHaveProperty('high')
    expect(result.fairRate).toHaveProperty('expectedLow')
    expect(result.fairRate).toHaveProperty('expectedHigh')
    expect(result.confidence).toBe('HIGH')
    expect(result.explanation).toContain('high credit score')
  })

  test('credit score unknown -> wider range', () => {
    const result = calculateFairRateRange({
      creditScore: undefined,
      creditScoreKnown: false,
      employmentType: 'salaried',
      productType: 'personal',
      employmentStable: true,
      businessYears: undefined
    })
    expect(result.confidence).toBe('LOW')
    expect(result.explanation).toContain('credit score is unknown')
  })

  test('informal -> higher rate range', () => {
    const result = calculateFairRateRange({
      creditScore: 750,
      creditScoreKnown: true,
      employmentType: 'informal',
      productType: 'personal',
      employmentStable: false,
      businessYears: undefined
    })
    expect(result.confidence).not.toBe('HIGH')
    expect(result.fairRate.expectedHigh).toBeGreaterThan(15)
  })

  test('self-employed with 14yr history -> lower rate', () => {
    const result = calculateFairRateRange({
      creditScore: 750,
      creditScoreKnown: true,
      employmentType: 'self-employed',
      productType: 'personal',
      employmentStable: true,
      businessYears: 14
    })
    expect(result.confidence).toBe('HIGH')
    expect(result.fairRate.expectedLow).toBeLessThan(16)
  })
})

describe('InterestRate - getRateExplanation', () => {
  test('HIGH confidence includes specific language', () => {
    const explanation = getRateExplanation({
      creditScoreKnown: true,
      creditScore: 780,
      employmentType: 'salaried',
      employmentStable: true,
      businessYears: 5,
      productType: 'personal',
      confidence: 'HIGH'
    })
    expect(explanation).toContain('Your high credit score')
    expect(explanation).toContain('stable salaried employment')
    expect(explanation).toContain('Personal loan')
    expect(explanation).toContain('narrow planning range')
  })

  test('LOW confidence includes uncertainty', () => {
    const explanation = getRateExplanation({
      creditScoreKnown: false,
      creditScore: undefined,
      employmentType: 'informal',
      employmentStable: false,
      businessYears: undefined,
      productType: 'personal',
      confidence: 'LOW'
    })
    expect(explanation).toContain('credit score is unknown')
    expect(explanation).toContain('Several important inputs are unknown')
  })
})