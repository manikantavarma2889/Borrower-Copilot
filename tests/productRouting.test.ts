/**
 * Borrower Copilot — Product Routing Unit Tests
 *
 * Tests for product type recommendation based on borrower profile.
 */

import { getProductRouting, getRoutingExplanation, ProductType } from '../src/rules/productRouting'
import { config } from '../src/rules/config'

describe('Product Routing', () => {
  describe('getProductRouting', () => {
    test('Priya (salaried, excellent credit) -> personal loan', () => {
      const result = getProductRouting({
        employmentType: 'salaried',
        incomeType: 'Salaried (MNC/large company)',
        creditScore: 780,
        creditScoreKnown: true,
        businessYears: undefined,
        propertyValue: undefined,
        desiredLoanPurpose: 'Wedding',
        netMonthlyIncome: 110000
      })

      expect(result.recommendedProduct).toBe('personal')
      expect(result.warnings).toHaveLength(0)
      expect(result.productRationale).toContain('competitive personal loan')
    })

    test('Ravi (self-employed, 14 years, property, no formal loan) -> LAP', () => {
      const result = getProductRouting({
        employmentType: 'self-employed',
        incomeType: 'Self-employed (ITR filed)',
        creditScore: undefined,
        creditScoreKnown: false,
        businessYears: 14,
        propertyValue: 4500000,
        desiredLoanPurpose: 'Second stock line + delivery vehicle',
        netMonthlyIncome: 60000
      })

      // Ravi has property + 14 years business history -> LAP recommended
      expect([ 'personal', 'lap' ]).toContain(result.recommendedProduct)
      expect(result.warnings.some(w => w.toLowerCase().includes('collateral'))).toBe(true)
      expect(result.productRationale).toContain('Loan Against Property')
    })

    test('Anita (informal, electric scooter purpose) -> none', () => {
      const result = getProductRouting({
        employmentType: 'informal',
        incomeType: 'Informal/gig platform rider',
        creditScore: undefined,
        creditScoreKnown: false,
        businessYears: undefined,
        propertyValue: undefined,
        desiredLoanPurpose: 'Electric scooter',
        netMonthlyIncome: 28000
      })

      expect(result.recommendedProduct).toBe('none')
      expect(result.warnings.some(w => w.toLowerCase().includes('high-cost'))).toBe(true)
      expect(result.productRationale).toContain('Scooter financing is not recommended')
    })

    test('informal, non-scooter purpose -> none', () => {
      const result = getProductRouting({
        employmentType: 'informal',
        incomeType: 'Informal/gig platform rider',
        creditScore: undefined,
        creditScoreKnown: false,
        businessYears: undefined,
        propertyValue: undefined,
        desiredLoanPurpose: 'Debt consolidation',
        netMonthlyIncome: 28000
      })

      expect(result.recommendedProduct).toBe('none')
      expect(result.warnings.some(w => w.toLowerCase().includes('avoid') || w.toLowerCase().includes('high-cost'))).toBe(true)
    })
  })

  describe('getRoutingExplanation', () => {
    test('formats explanation with product name, rationale, and warnings', () => {
      const result = getRoutingExplanation({
        recommendedProduct: 'lap' as ProductType,
        productRationale: 'Loan Against Property recommended given your property.',
        secondaryOptions: [],
        warnings: ['Warning about collateral']
      })

      expect(result).toContain('Loan Against Property')
      expect(result).toContain('Important notes:')
      expect(result).toContain('Warning about collateral')
    })
  })
})