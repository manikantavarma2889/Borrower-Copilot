/**
 * Borrower Copilot — Product Routing
 *
 * Product type recommendation based on borrower profile.
 * Products: personal loan, business loan, home loan, LAP, gold loan, two-wheeler loan.
 */

import { config } from './config'

/** Product type */
export type ProductType = 'personal' | 'business' | 'lap' | 'two-wheeler' | 'home' | 'none'

/** Product routing result */
export interface ProductRoutingResult {
  recommendedProduct: ProductType
  productRationale: string
  secondaryOptions: ProductType[]
  warnings: string[]
}

/**
 * Determine the recommended product type based on borrower profile.
 *
 * Key factors:
 * - Employment type (salaried / self-employed / informal)
 * - Documented income (ITR, cash flow)
 * - Collateral / property value
 * - Business history
 * - Credit profile
 *
 * Do NOT treat property value as equivalent to guaranteed borrowing eligibility.
 */
export function getProductRouting({
  employmentType,
  incomeType, // 'salaried' | 'self-employed' | 'informal' | specific sub-type
  creditScore,
  creditScoreKnown,
  businessYears,
  propertyValue,
  desiredLoanPurpose,
  netMonthlyIncome,
}: {
  employmentType: 'salaried' | 'self-employed' | 'informal'
  incomeType: string
  creditScore?: number
  creditScoreKnown?: boolean
  businessYears?: number
  propertyValue?: number
  desiredLoanPurpose?: string
  netMonthlyIncome?: number
}): ProductRoutingResult {
  const warnings: string[] = []
  let recommendedProduct: ProductType = 'personal'
  let productRationale = ''
  const secondaryOptions: ProductType[] = []

  // ===== PRIYA: Salaried, strong profile =====
  if (employmentType === 'salaried' && creditScoreKnown && creditScore !== undefined && creditScore >= 750) {
    recommendedProduct = 'personal'
    productRationale =
      'Salaried employee with high credit score and stable MNC employment qualifies for a competitive personal loan. ' +
      'Unsecured personal loan is the appropriate product given stable income and strong credit.'

    secondaryOptions.push('business')
    if (propertyValue !== undefined) {
      secondaryOptions.push('lap')
    }
    return { recommendedProduct, productRationale, secondaryOptions, warnings }
  }

  // ===== RAVI: Self-employed, business history, property, no formal loan =====
  if (employmentType === 'self-employed') {
    if (businessYears !== undefined && businessYears >= 10) {
      // Long business history + property → consider secured products
      if (propertyValue !== undefined && propertyValue > 0) {
        const ltvCeiling = propertyValue * config.LTV_CONSERVATIVE
        const incomeConstraint = (netMonthlyIncome || 0) * config.FOIR_BASE * 12

        if (ltvCeiling >= 1000000 || incomeConstraint >= 1000000) {
          // Substantial ceiling available
          if (creditScoreKnown && creditScore !== undefined && creditScore >= 700) {
            recommendedProduct = 'lap'
            productRationale =
              'Loan Against Property is recommended given your 14+ year business history and unencumbered shop premises. ' +
              `Your property value of ₹${propertyValue.toLocaleString()} with conservative LTV of 50% provides a ceiling of ₹${ltvCeiling.toLocaleString()}. ` +
              `Your documented income may constrain the sanctioned amount. ` +
              'This is a secured product with lower rates than unsecured personal loans. ' +
              'Lender valuation and legal verification will be required.'

            warnings.push(
              'Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. ' +
              'Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc.'
            )

            secondaryOptions.push('business')
            secondaryOptions.push('personal')
            return { recommendedProduct, productRationale, secondaryOptions, warnings }
          } else {
            recommendedProduct = 'lap'
            productRationale =
              'Loan Against Property is recommended given your 14+ year business history and unencumbered shop premises. ' +
              `Your property value of ₹${propertyValue.toLocaleString()} with conservative LTV of 50% provides a ceiling of ₹${ltvCeiling.toLocaleString()}. ` +
              `Your documented income may constrain the sanctioned amount. ` +
              'This is a secured product. Lender valuation and legal verification will be required. ' +
              'Consider speaking with lenders about business loan alternatives if LAP is not suitable.'

            warnings.push(
              'Your potential lender ceiling may be constrained by documented income even though you have substantial collateral. ' +
              'Collateral improves secured-product potential but remains subject to lender valuation, legal verification, LTV, documentation, etc.'
            )

            secondaryOptions.push('business')
            secondaryOptions.push('personal')
            return { recommendedProduct, productRationale, secondaryOptions, warnings }
          }
        }
      }

      // Substantial business history but insufficient ceiling or no property
      recommendedProduct = 'business'
      productRationale =
        'Business loan is recommended given your 14+ year business history. ' +
        'Your long track record demonstrates productive borrowing capability. ' +
        'Documented ITR income of approximately ₹' +
        (netMonthlyIncome ? (netMonthlyIncome * 12).toLocaleString() : 'N/A') +
        '/year supports this recommendation.'

      secondaryOptions.push('personal')
      secondaryOptions.push('lap')
      if (propertyValue !== undefined) {
        warnings.push(
          'Property value may enable LAP routing, but documented income constraints apply.'
        )
      }
      return { recommendedProduct, productRationale, secondaryOptions, warnings }
    }

    // Self-employed with shorter business history
    if (businessYears !== undefined && businessYears >= 2) {
      recommendedProduct = 'business'
      productRationale =
        'Business loan is recommended given your established business history. ' +
        'Documented income and business stability support this recommendation. ' +
        'Consider starting with a smaller business loan and building credit.'

      secondaryOptions.push('personal')
      secondaryOptions.push('lap')
      if (propertyValue !== undefined) {
        warnings.push(
          'Property may enable LAP but documented income is the primary constraint.'
        )
      }
      return { recommendedProduct, productRationale, secondaryOptions, warnings }
    }

    // Self-employed, new business
    recommendedProduct = 'personal'
    productRationale =
      'Personal loan given your self-employed status with relatively short business history. ' +
      'Without extensive documented business history, unsecured personal loan is the primary option. ' +
      'Future business loan routing may be available after 2+ years of ITR filing.'

    secondaryOptions.push('business')
    if (propertyValue !== undefined) {
      secondaryOptions.push('lap')
      warnings.push(
        'Property value exists but documented income constraints apply for LAP.'
      )
    }
    return { recommendedProduct, productRationale, secondaryOptions, warnings }
  }

  // ===== ANITA: Informal/variable income, high-cost existing debt =====
  if (employmentType === 'informal') {
    // Strong warning: don't borrow with existing high-cost debt
    warnings.push(
      'Avoid adding another high-cost loan now. Current affordability and existing high-cost debt should dominate the decision.'
    )

    const purpose = (desiredLoanPurpose || '').toLowerCase()
    if (purpose.includes('scooter') || purpose.includes('two-wheeler')) {
      productRationale =
        'Scooter financing is not recommended at this time given your existing high-cost app loans (30%+ interest) and recent EMI bounce. ' +
        'Restructure existing expensive debt first. Reassess scooter financing later if income increases.'

      secondaryOptions.push('none')
      return { recommendedProduct: 'none' as ProductType, productRationale, secondaryOptions, warnings }
    }

    // General informal: avoid borrowing
    productRationale =
      'Additional borrowing is not recommended given informal/variable income and existing high-cost app loans. ' +
      'Focus on restructuring existing debt and increasing income stability before considering new borrowing.'

    secondaryOptions.push('none')
    return { recommendedProduct: 'none' as ProductType, productRationale, secondaryOptions, warnings }
  }

  // Default: personal loan
  recommendedProduct = 'personal'
  productRationale =
    'Personal loan is the default recommendation. ' +
    'Further profiling needed for personalized product routing.'

  return { recommendedProduct, productRationale, secondaryOptions, warnings }
}

/**
 * Get the routing explanation for display in the results screen.
 */
export function getRoutingExplanation(result: ProductRoutingResult): string {
  const { recommendedProduct, productRationale, warnings } = result

  const productNames: Record<ProductType, string> = {
    personal: 'Personal loan',
    business: 'Business loan',
    lap: 'Loan Against Property',
    'two-wheeler': 'Two-wheeler loan',
    home: 'Home loan',
    none: 'No borrowing recommended',
  }

  const lines: string[] = []

  lines.push(`Recommended product: ${productNames[recommendedProduct] || 'N/A'}.`)

  if (productRationale) {
    lines.push(productRationale)
  }

  if (warnings.length > 0) {
    lines.push('')
    lines.push('Important notes:')
    warnings.forEach(w => lines.push(`- ${w}`))
  }

  return lines.join(' ')
}