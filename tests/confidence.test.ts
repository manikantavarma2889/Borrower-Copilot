/**
 * Borrower Copilot — Confidence Model Unit Tests
 *
 * Tests for the rule-based confidence calculation.
 */

import { calculateConfidence, getConfidenceLanguage } from '../src/rules/confidence'
import { config } from '../src/rules/config'

describe('Confidence Model', () => {
  describe('calculateConfidence', () => {
    test('HIGH confidence: all must questions answered, credit known, employment stable', () => {
      const result = calculateConfidence({
        loanPurposeProvided: true,
        desiredAmountProvided: true,
        incomeTypeProvided: true,
        netMonthlyIncomeProvided: true,
        existingEmiProvided: true,
        householdExpensesProvided: true,
        ageProvided: true,
        creditScoreKnown: true,
        emergencySavingsProvided: true,
        employmentHistoryProvided: true
      })

      expect(result.level).toBe('HIGH')
      expect(result.score).toBe(10)
    })

    test('MEDIUM confidence: some questions answered, minor gaps', () => {
      const result = calculateConfidence({
        loanPurposeProvided: true,
        desiredAmountProvided: true,
        incomeTypeProvided: true,
        netMonthlyIncomeProvided: true,
        existingEmiProvided: true,
        householdExpensesProvided: false,
        ageProvided: true,
        creditScoreKnown: true,
        emergencySavingsProvided: false,
        employmentHistoryProvided: false
      })

      expect(result.level).toBe('MEDIUM')
      expect(result.score).toBe(7)
    })

    test('LOW confidence: many unknowns, credit score unknown, income unstable', () => {
      const result = calculateConfidence({
        loanPurposeProvided: true,
        desiredAmountProvided: false,
        incomeTypeProvided: false,
        netMonthlyIncomeProvided: false,
        existingEmiProvided: false,
        householdExpensesProvided: false,
        ageProvided: false,
        creditScoreKnown: false,
        emergencySavingsProvided: false,
        employmentHistoryProvided: false
      })

      expect(result.level).toBe('LOW')
      expect(result.score).toBeLessThan(5)
    })

    test('credit score unknown affects confidence', () => {
      const result = calculateConfidence({
        loanPurposeProvided: true,
        desiredAmountProvided: true,
        incomeTypeProvided: true,
        netMonthlyIncomeProvided: true,
        existingEmiProvided: true,
        householdExpensesProvided: true,
        ageProvided: true,
        creditScoreKnown: false,
        emergencySavingsProvided: true,
        employmentHistoryProvided: true
      })

      // Score = 9 (credit score is the only missing point) → HIGH (9 >= 8)
      expect(result.level).toBe('HIGH')
    })
  })

  describe('getConfidenceLanguage', () => {
    test('HIGH language pattern', () => {
      const language = getConfidenceLanguage('HIGH')
      expect(language.label).toBe('HIGH')
      expect(language.prefix).toContain('planning range')
    })

    test('LOW language pattern', () => {
      const language = getConfidenceLanguage('LOW')
      expect(language.label).toBe('LOW')
      expect(language.prefix).toContain('planning estimate')
    })
  })
})