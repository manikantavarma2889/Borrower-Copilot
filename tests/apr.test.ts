/**
 * Borrower Copilot — APR Calculation Unit Tests
 */

import { calculateEstimatedAPR, getAprComparison } from '../src/rules/apr'
import { config } from '../src/rules/config'

describe('APR - calculateEstimatedAPR', () => {
  test('basic calculation', () => {
    const result = calculateEstimatedAPR({
      principal: 1000000,
      annualRate: 12,
      tenureYears: 5,
      processingFeePercent: 2
    })
    expect(result.totalInterest).toBe(600000)
    expect(result.totalProcessingFee).toBe(20000)
    expect(result.totalCost).toBe(1620000)
    expect(result.estimatedAPR).toBeGreaterThan(0)
  })

  test('APR with 0% processing fee', () => {
    const result = calculateEstimatedAPR({
      principal: 1000000,
      annualRate: 12,
      tenureYears: 5,
      processingFeePercent: 0
    })
    expect(result.estimatedAPR).toBeLessThan(13)
    expect(result.estimatedAPR).toBeGreaterThan(11)
  })

  describe('APR - getAprComparison', () => {
    test('generates quoted rate vs estimated APR comparison', () => {
      const result = getAprComparison({
        principal: 1000000,
        annualRate: 12,
        tenureYears: 5
      })
      expect(result).toHaveProperty('quotedRate')
      expect(result).toHaveProperty('estimatedApr')
      expect(result).toHaveProperty('totalRepayment')
      expect(result).toHaveProperty('totalInterest')
      expect(result).toHaveProperty('processingFee')
      expect(result.quotedRate).toContain('12%')
      expect(result.processingFee).toBe(20000)
    })
  })
})