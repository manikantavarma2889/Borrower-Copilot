/**
 * Borrower Copilot — Main Application
 *
 * Borrower-side loan decision assistant designed for Indian borrowers.
 * Separates lender eligibility (sanction ceiling) from true borrower affordability (safe ceiling).
 */

import React, { useState, useMemo } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  Coins,
  FileText,
  ArrowRight,
  ArrowLeft,
  Printer,
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  Building2,
  Briefcase,
  Bike,
  UserCheck
} from 'lucide-react'

import { calculateFairRateRange } from './rules/interestRate'
import { calculateEstimatedAPR } from './rules/apr'
import { calculateAffordability } from './rules/affordability'
import { calculateLenderLikelyCeiling, getCollateralWarning } from './rules/eligibility'
import { makeBorrowDecision } from './rules/borrowDecision'
import { getProductRouting, getRoutingExplanation } from './rules/productRouting'
import { calculateEMI, calculateRecommendedMaxEMI, calculateEMIsForTenures } from './rules/emi'
import { calculateConfidence, getConfidenceLanguage } from './rules/confidence'
import { config } from './rules/config'
import { BorrowerProfile, Question, QuestionAnswer } from './types'

// Core questionnaire items
const MUST_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'What is your primary loan purpose?',
    type: 'select',
    options: ['Wedding', 'Home renovation', 'Debt consolidation', 'Business expansion', 'Two-wheeler purchase', 'Education', 'Medical or Personal emergency', 'Other'],
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q2',
    text: 'What is your requested loan amount? (₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q3',
    text: 'What is your primary income & employment type?',
    type: 'select',
    options: [
      'Salaried (MNC/large corporate)',
      'Salaried (small company/startup)',
      'Self-employed (ITR filed regularly)',
      'Self-employed (cash flow, no formal ITR)',
      'Informal / Gig platform worker'
    ],
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q4',
    text: 'What is your net monthly take-home income? (₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q5',
    text: 'Total existing monthly EMI payments across all current loans? (₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q6',
    text: 'Approximate monthly essential household expenses? (Rent, groceries, school, bills in ₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q7',
    text: 'What is your age?',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q8',
    text: 'What is your estimated credit score (CIBIL / Experian)?',
    type: 'select',
    options: ['750+ (Excellent)', '700 - 749 (Good)', '600 - 699 (Average)', 'Below 600 (Needs improvement)', 'I do not know / No credit history'],
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q9',
    text: 'Do you have liquid emergency savings accessible today? (₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
  {
    id: 'q10',
    text: 'Total years in current employment or running your business?',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'all',
  },
]

// Adaptive Branching Questions
const SALARIED_QUESTIONS: Question[] = [
  {
    id: 's1',
    text: 'How many years have you been with your current employer?',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'salaried',
  },
  {
    id: 's2',
    text: 'Approximate percentage of your compensation that is variable (bonus, performance)?',
    type: 'select',
    options: ['0% (100% fixed)', '10% - 25% variable', '25% - 50% variable', 'More than 50% variable'],
    required: true,
    employmentTypes: 'salaried',
  },
  {
    id: 's3',
    text: 'Do you anticipate any large unavoidable expense in the next 12 months?',
    type: 'select',
    options: ['None planned', 'Modest (up to ₹1,00,000)', 'Significant (> ₹2,00,000)'],
    required: true,
    employmentTypes: 'salaried',
  },
]

const SELF_EMPLOYED_QUESTIONS: Question[] = [
  {
    id: 'e1',
    text: 'How many years has your business been actively operating?',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'self-employed',
  },
  {
    id: 'e2',
    text: 'What is your latest annual net taxable income reported in ITR? (₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'self-employed',
  },
  {
    id: 'e3',
    text: 'Do you own unencumbered property (shop, commercial, residential) that could serve as collateral?',
    type: 'select',
    options: ['Yes, commercial shop/premises', 'Yes, residential property', 'No property collateral'],
    required: true,
    employmentTypes: 'self-employed',
  },
  {
    id: 'e4',
    text: 'Estimated market value of the unencumbered property (if applicable)? (₹)',
    type: 'number',
    options: null,
    required: false,
    employmentTypes: 'self-employed',
  },
]

const INFORMAL_QUESTIONS: Question[] = [
  {
    id: 'i1',
    text: 'In your slowest recent month, what was your lowest monthly income? (₹)',
    type: 'number',
    options: null,
    required: true,
    employmentTypes: 'informal',
  },
  {
    id: 'i2',
    text: 'How many active instant digital loan apps or informal private borrowings do you currently have?',
    type: 'select',
    options: ['None', '1 loan', '2 to 3 loans', '4 or more loans'],
    required: true,
    employmentTypes: 'informal',
  },
  {
    id: 'i3',
    text: 'What approximate interest rate are your current app loans charging?',
    type: 'select',
    options: ['No existing app loans', '12% - 20% p.a.', '20% - 30% p.a.', '30%+ p.a. (High-cost)'],
    required: true,
    employmentTypes: 'informal',
  },
  {
    id: 'i4',
    text: 'Has any EMI, loan installment, or ECS bounce occurred in the last 3 months?',
    type: 'select',
    options: ['No bounces', 'Yes, 1 bounce', 'Yes, multiple bounces'],
    required: true,
    employmentTypes: 'informal',
  },
]

// Archetype profiles for instant testing
const ARCHETYPES: Record<string, { label: string; desc: string; profile: BorrowerProfile; answers: Record<string, string | number> }> = {
  priya: {
    label: 'Priya — Salaried MNC',
    desc: '₹1.1L/mo salary, 780 CIBIL, ₹14k existing car EMI. Wants ₹8L for wedding.',
    profile: {
      id: 'priya',
      name: 'Priya',
      age: 29,
      incomeType: 'salaried',
      netMonthlyIncome: 110000,
      existingEmi: 14000,
      householdExpenses: 25000,
      desiredLoanAmount: 800000,
      loanPurpose: 'Wedding',
      creditScore: 780,
      emergencySavings: 200000,
      employmentHistory: 5,
      businessHistory: null,
      propertyValue: null,
      propertyDebt: null,
      cashIncomeLow: null,
      cashIncomeHigh: null,
      existingLoans: [],
      responses: [],
    },
    answers: {
      q1: 'Wedding',
      q2: 800000,
      q3: 'Salaried (MNC/large corporate)',
      q4: 110000,
      q5: 14000,
      q6: 25000,
      q7: 29,
      q8: '750+ (Excellent)',
      q9: 200000,
      q10: 5,
      s1: 5,
      s2: '0% (100% fixed)',
      s3: 'None planned',
    }
  },
  ravi: {
    label: 'Ravi — Self-Employed Trader',
    desc: '₹60k/mo ITR income, 14-yr business, ₹45L shop premises, unknown credit. Seeks ₹15L.',
    profile: {
      id: 'ravi',
      name: 'Ravi',
      age: 42,
      incomeType: 'self-employed',
      netMonthlyIncome: 60000,
      existingEmi: 0,
      householdExpenses: 20000,
      desiredLoanAmount: 1500000,
      loanPurpose: 'Business expansion',
      creditScore: 'unknown',
      emergencySavings: 50000,
      employmentHistory: 14,
      businessHistory: 14,
      propertyValue: 4500000,
      propertyDebt: 0,
      cashIncomeLow: null,
      cashIncomeHigh: null,
      existingLoans: [],
      responses: [],
    },
    answers: {
      q1: 'Business expansion',
      q2: 1500000,
      q3: 'Self-employed (ITR filed regularly)',
      q4: 60000,
      q5: 0,
      q6: 20000,
      q7: 42,
      q8: 'I do not know / No credit history',
      q9: 50000,
      q10: 14,
      e1: 14,
      e2: 720000,
      e3: 'Yes, commercial shop/premises',
      e4: 4500000,
    }
  },
  anita: {
    label: 'Anita — Informal Platform Rider',
    desc: '₹28k/mo gig income, 3 app loans at 30%, ₹35k EMIs, recent bounce. Seeks ₹1.5L for scooter.',
    profile: {
      id: 'anita',
      name: 'Anita',
      age: 35,
      incomeType: 'informal',
      netMonthlyIncome: 28000,
      existingEmi: 35000,
      householdExpenses: 15000,
      desiredLoanAmount: 150000,
      loanPurpose: 'Two-wheeler purchase',
      creditScore: 'unknown',
      emergencySavings: 0,
      employmentHistory: 2,
      businessHistory: null,
      propertyValue: null,
      propertyDebt: null,
      cashIncomeLow: 22000,
      cashIncomeHigh: 30000,
      existingLoans: [],
      responses: [],
    },
    answers: {
      q1: 'Two-wheeler purchase',
      q2: 150000,
      q3: 'Informal / Gig platform worker',
      q4: 28000,
      q5: 35000,
      q6: 15000,
      q7: 35,
      q8: 'I do not know / No credit history',
      q9: 0,
      q10: 2,
      i1: 22000,
      i2: '2 to 3 loans',
      i3: '30%+ p.a. (High-cost)',
      i4: 'Yes, 1 bounce',
    }
  },
}

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'questionnaire' | 'review' | 'results' | 'negotiation'>('landing')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map())
  const [selectedArchetypeKey, setSelectedArchetypeKey] = useState<string | null>(null)

  // Derive employment category from Q3 answer
  const rawQ3 = answers.get('q3')?.value?.toString() || ''
  const derivedEmploymentType: 'salaried' | 'self-employed' | 'informal' = useMemo(() => {
    if (rawQ3.includes('Salaried')) return 'salaried'
    if (rawQ3.includes('Self-employed')) return 'self-employed'
    if (rawQ3.includes('Informal')) return 'informal'
    return 'salaried'
  }, [rawQ3])

  // Aggregate questions based on adaptive branching
  const activeQuestions: Question[] = useMemo(() => {
    const list = [...MUST_QUESTIONS]
    if (derivedEmploymentType === 'salaried') {
      list.push(...SALARIED_QUESTIONS)
    } else if (derivedEmploymentType === 'self-employed') {
      list.push(...SELF_EMPLOYED_QUESTIONS)
    } else if (derivedEmploymentType === 'informal') {
      list.push(...INFORMAL_QUESTIONS)
    }
    return list
  }, [derivedEmploymentType])

  // Quick Archetype Loader
  const loadArchetype = (key: string) => {
    const item = ARCHETYPES[key]
    if (!item) return

    setSelectedArchetypeKey(key)
    const newAnswers = new Map<string, QuestionAnswer>()
    for (const [qId, val] of Object.entries(item.answers)) {
      const isUnk = val === 'I do not know / No credit history' || val === 'unknown'
      newAnswers.set(qId, {
        questionId: qId,
        value: val,
        isUnknown: isUnk,
        isKnown: !isUnk,
        originalValue: String(val)
      })
    }
    setAnswers(newAnswers)
    setScreen('results')
  }

  // Answer handler
  const setAnswer = (questionId: string, val: string | number | null, isUnk = false) => {
    setAnswers(prev => {
      const copy = new Map(prev)
      copy.set(questionId, {
        questionId,
        value: val,
        isUnknown: isUnk,
        isKnown: !isUnk,
        originalValue: val !== null ? String(val) : ''
      })
      return copy
    })
  }

  // Parse state into structured profile
  const profile: BorrowerProfile = useMemo(() => {
    const num = (id: string, fallback = 0) => {
      const ans = answers.get(id)
      if (!ans || ans.isUnknown || ans.value === null || ans.value === '') return fallback
      const parsed = Number(ans.value)
      return isNaN(parsed) ? fallback : parsed
    }

    const str = (id: string, fallback = '') => {
      const ans = answers.get(id)
      return ans && ans.value !== null ? String(ans.value) : fallback
    }

    const q8Val = str('q8')
    let creditScore: number | 'unknown' = 'unknown'
    if (q8Val.includes('750+')) creditScore = 780
    else if (q8Val.includes('700')) creditScore = 720
    else if (q8Val.includes('600')) creditScore = 650
    else if (q8Val.includes('Below 600')) creditScore = 550
    else creditScore = 'unknown'

    const propertyVal = num('e4', 0)

    return {
      id: selectedArchetypeKey || 'custom',
      name: selectedArchetypeKey ? ARCHETYPES[selectedArchetypeKey]?.label.split(' ')[0] : 'Borrower',
      age: num('q7', 30),
      incomeType: derivedEmploymentType,
      netMonthlyIncome: num('q4', 0),
      existingEmi: num('q5', 0),
      householdExpenses: num('q6', 0),
      desiredLoanAmount: num('q2', 0),
      loanPurpose: str('q1', 'Personal loan'),
      creditScore,
      emergencySavings: answers.get('q9')?.isUnknown ? null : num('q9', 0),
      employmentHistory: num('q10', 0),
      businessHistory: derivedEmploymentType === 'self-employed' ? num('e1', num('q10', 0)) : null,
      propertyValue: propertyVal > 0 ? propertyVal : (answers.get('e3')?.value?.toString().includes('Yes') ? 4500000 : null),
      propertyDebt: 0,
      cashIncomeLow: num('i1', null as any),
      cashIncomeHigh: null,
      existingLoans: [],
      responses: [],
    }
  }, [answers, derivedEmploymentType, selectedArchetypeKey])

  // Calculation Engine Outputs
  const calculations = useMemo(() => {
    if (profile.netMonthlyIncome <= 0 && profile.desiredLoanAmount <= 0) return null

    const creditScoreKnown = profile.creditScore !== 'unknown'
    const employmentStable =
      profile.incomeType === 'salaried'
        ? (profile.employmentHistory || 0) >= 2
        : profile.incomeType === 'self-employed'
          ? (profile.businessHistory || 0) >= 3
          : false

    // 1. Affordability
    const affordability = calculateAffordability({
      netMonthlyIncome: profile.netMonthlyIncome,
      existingEmi: profile.existingEmi,
      householdExpenses: profile.householdExpenses,
      employmentType: profile.incomeType,
      creditScoreKnown,
      employmentStable,
      annualInterestRate: 12,
    })

    // 2. Lender Likely Ceiling
    const lenderCeilingResult = calculateLenderLikelyCeiling({
      netMonthlyIncome: profile.netMonthlyIncome,
      incomeType:
        profile.incomeType === 'salaried'
          ? (rawQ3.includes('MNC') ? 'salaried-mnc' : 'salaried-small')
          : profile.incomeType === 'self-employed'
            ? (rawQ3.includes('ITR') ? 'self-employed-itr' : 'self-employed-no-itr')
            : 'informal',
      creditScore: typeof profile.creditScore === 'number' ? profile.creditScore : undefined,
      creditKnown: creditScoreKnown,
      existingEmi: profile.existingEmi,
      desiredLoanAmount: profile.desiredLoanAmount,
      propertyValue: profile.propertyValue || undefined,
      businessYears: profile.businessHistory || undefined,
      employmentType: profile.incomeType,
    })

    // 3. Fair Rate Range
    const rateResult = calculateFairRateRange({
      creditScore: typeof profile.creditScore === 'number' ? profile.creditScore : undefined,
      creditScoreKnown,
      employmentType: profile.incomeType,
      productType: 'personal',
      employmentStable,
      businessYears: profile.businessHistory || undefined,
    })

    // 4. Estimated APR
    const aprResult = calculateEstimatedAPR({
      principal: Math.max(10000, profile.desiredLoanAmount || 100000),
      annualRate: rateResult.fairRate.expectedHigh,
      tenureYears: 4,
      processingFeePercent: config.PROCESSING_FEE_PERCENT,
    })

    // 5. EMI & Tenure Trade-offs
    const emiResult = calculateEMI({
      principal: Math.max(10000, profile.desiredLoanAmount || 100000),
      annualRate: rateResult.fairRate.expectedHigh,
      tenureMonths: 48,
    })

    const tenureTradeoffs = calculateEMIsForTenures({
      principal: Math.max(10000, profile.desiredLoanAmount || 100000),
      annualRate: rateResult.fairRate.expectedHigh,
    })

    const recommendedMaxEMI = calculateRecommendedMaxEMI({
      netMonthlyIncome: profile.netMonthlyIncome,
      existingEmi: profile.existingEmi,
      householdExpenses: profile.householdExpenses,
      employmentType: profile.incomeType,
      creditScoreKnown,
      employmentStable,
      annualInterestRate: rateResult.fairRate.expectedHigh,
    })

    // 6. Borrow Decision
    const hasRecentBounce = answers.get('i4')?.value?.toString().includes('Yes') || false
    const hasHighCostDebt =
      answers.get('i3')?.value?.toString().includes('30%') ||
      answers.get('i2')?.value?.toString().includes('loans') ||
      false

    const borrowDecision = makeBorrowDecision({
      netMonthlyIncome: profile.netMonthlyIncome,
      existingEmi: profile.existingEmi,
      householdExpenses: profile.householdExpenses,
      proposedEMI: emiResult,
      creditScoreKnown,
      employmentStable,
      hasRecentEMIBounce: hasRecentBounce,
      hasHighCostDebt,
      incomeIsStable: profile.incomeType !== 'informal',
    })

    // 7. Product Routing
    const routingResult = getProductRouting({
      employmentType: profile.incomeType,
      incomeType: rawQ3,
      creditScore: typeof profile.creditScore === 'number' ? profile.creditScore : undefined,
      creditScoreKnown,
      businessYears: profile.businessHistory || undefined,
      propertyValue: profile.propertyValue || undefined,
      desiredLoanPurpose: profile.loanPurpose,
      netMonthlyIncome: profile.netMonthlyIncome,
    })

    // 8. Confidence Score
    const confidenceResult = calculateConfidence({
      loanPurposeProvided: Boolean(answers.get('q1')?.value),
      desiredAmountProvided: Number(answers.get('q2')?.value) > 0,
      incomeTypeProvided: Boolean(answers.get('q3')?.value),
      netMonthlyIncomeProvided: Number(answers.get('q4')?.value) > 0,
      existingEmiProvided: answers.has('q5'),
      householdExpensesProvided: answers.has('q6'),
      ageProvided: Number(answers.get('q7')?.value) > 0,
      creditScoreKnown,
      emergencySavingsProvided: !answers.get('q9')?.isUnknown,
      employmentHistoryProvided: answers.has('q10'),
    })

    // Safe ceiling vs recommended loan
    const borrowerSafeCeiling = affordability.borrowerSafeCeiling
    const lenderLikelyCeiling = lenderCeilingResult.lenderLikelyCeiling
    const recommendedAmount =
      borrowDecision.decision === 'DONT_BORROW'
        ? 0
        : Math.min(lenderLikelyCeiling, borrowerSafeCeiling, profile.desiredLoanAmount)

    const collateralWarning = getCollateralWarning(
      profile.incomeType === 'self-employed' ? 'self-employed-itr' : 'informal',
      profile.propertyValue || undefined,
      profile.businessHistory || undefined
    )

    return {
      affordability,
      lenderCeilingResult,
      lenderLikelyCeiling,
      borrowerSafeCeiling,
      recommendedAmount,
      rateResult,
      aprResult,
      emiResult,
      tenureTradeoffs,
      recommendedMaxEMI,
      borrowDecision,
      routingResult,
      confidenceResult,
      collateralWarning,
    }
  }, [profile, answers, rawQ3])

  // Active question helper
  const currentQ = activeQuestions[currentQuestionIndex]
  const currentAns = currentQ ? answers.get(currentQ.id) : undefined

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setScreen('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Borrower Copilot</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Borrower-First
                </span>
              </div>
              <p className="text-xs text-slate-400">Affordability ≠ Lender Sanction</p>
            </div>
          </div>

          {/* Archetype Quick Switcher */}
          <div className="flex items-center space-x-2 no-print">
            <span className="text-xs text-slate-400 hidden sm:inline">Test Profiles:</span>
            {Object.entries(ARCHETYPES).map(([key, arch]) => (
              <button
                key={key}
                id={`btn-archetype-${key}`}
                onClick={() => loadArchetype(key)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  selectedArchetypeKey === key && screen !== 'landing'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {arch.label.split(' — ')[0]}
              </button>
            ))}
            {screen !== 'landing' && (
              <button
                id="btn-nav-home"
                onClick={() => setScreen('landing')}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                title="Reset / Start Over"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* ==================== 1. LANDING SCREEN ==================== */}
        {screen === 'landing' && (
          <div className="space-y-12 max-w-4xl mx-auto py-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Borrower-Side Loan Decision Engine for Indian Borrowers</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Know what you can <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">safely afford</span> before you speak to a lender.
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                A bank’s sanction ceiling is based on their revenue and risk appetite. Your safe borrowing limit is based on your real cash flow, living expenses, and stress resilience.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <button
                  id="btn-start-questionnaire"
                  onClick={() => {
                    setSelectedArchetypeKey(null)
                    setAnswers(new Map())
                    setCurrentQuestionIndex(0)
                    setScreen('questionnaire')
                  }}
                  className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center space-x-2 transition-all hover:scale-[1.02]"
                >
                  <span>Start Custom Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Test Archetype Cards */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Or load one of the 3 realistic borrower profiles:
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {Object.entries(ARCHETYPES).map(([key, arch]) => {
                  const Icon = key === 'priya' ? Building2 : key === 'ravi' ? Briefcase : Bike
                  return (
                    <div
                      key={key}
                      id={`card-archetype-${key}`}
                      onClick={() => loadArchetype(key)}
                      className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-indigo-500/80 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {key === 'priya' ? 'Salaried' : key === 'ravi' ? 'Self-Employed' : 'Informal'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {arch.label}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {arch.desc}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-slate-700/50 mt-4 flex items-center justify-between text-xs text-indigo-400 font-medium group-hover:text-indigo-300">
                        <span>Evaluate Scenario</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Value Pillars */}
            <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
              <div className="space-y-2">
                <div className="text-indigo-400 flex items-center space-x-2 font-semibold text-sm">
                  <Coins className="w-4 h-4" />
                  <span>Sanction vs Safe Ceiling</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lenders will happily offer up to ₹39.6L to high-income borrowers. We calculate what you can afford without financial distress.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-amber-400 flex items-center space-x-2 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>20% Income Stress Test</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Before committing to a 4-year EMI, see if your budget survives an unexpected slowdown, job change, or medical event.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-emerald-400 flex items-center space-x-2 font-semibold text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Negotiation Card</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Arm yourself with fair interest rates, APR estimates with processing fees, and an 8-point checklist before speaking to bank agents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. QUESTIONNAIRE SCREEN ==================== */}
        {screen === 'questionnaire' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Step Header */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Question {currentQuestionIndex + 1} of {activeQuestions.length}
              </span>
              <span className="font-mono text-indigo-400">
                {Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            {currentQ && (
              <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-2xl space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {currentQ.id.startsWith('q')
                      ? 'Core Financial Profile'
                      : currentQ.id.startsWith('s')
                        ? 'Salaried Adaptive'
                        : currentQ.id.startsWith('e')
                          ? 'Self-Employed Adaptive'
                          : 'Informal Adaptive'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {currentQ.text}
                  </h2>
                </div>

                {/* Question Inputs */}
                <div className="pt-2">
                  {currentQ.type === 'select' && currentQ.options && (
                    <div className="space-y-2.5">
                      {currentQ.options.map((opt, i) => {
                        const isSelected = currentAns?.value === opt
                        return (
                          <button
                            key={i}
                            id={`option-${currentQ.id}-${i}`}
                            type="button"
                            onClick={() => setAnswer(currentQ.id, opt, opt.includes('do not know'))}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between text-sm ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold ring-1 ring-indigo-500'
                                : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {currentQ.type === 'number' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                          ₹
                        </span>
                        <input
                          id={`input-${currentQ.id}`}
                          type="number"
                          value={currentAns?.value !== undefined && currentAns?.value !== null ? currentAns.value : ''}
                          onChange={e => setAnswer(currentQ.id, e.target.value === '' ? null : Number(e.target.value), false)}
                          placeholder="Enter amount"
                          className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-lg font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      {/* Helper Quick Chips */}
                      {currentQ.id === 'q2' && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span>Common amounts:</span>
                          {[100000, 300000, 500000, 800000, 1500000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setAnswer(currentQ.id, amt, false)}
                              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-indigo-900/50 hover:text-indigo-300 border border-slate-700"
                            >
                              ₹{(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skip / Unknown Toggle */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAnswer(currentQ.id, 'I do not know / Unknown', true)}
                      className="text-xs text-slate-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>I do not know this exact number</span>
                    </button>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center space-x-2 ${
                      currentQuestionIndex === 0
                        ? 'opacity-40 cursor-not-allowed text-slate-500'
                        : 'text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentQuestionIndex < activeQuestions.length - 1 ? (
                    <button
                      id="btn-next-question"
                      type="button"
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="btn-calculate-results"
                      type="button"
                      onClick={() => setScreen('results')}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
                    >
                      <span>Generate Decision</span>
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. RESULTS DASHBOARD SCREEN ==================== */}
        {screen === 'results' && calculations && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span>Borrower Decision Analysis</span>
                  {selectedArchetypeKey && (
                    <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Profile: {ARCHETYPES[selectedArchetypeKey]?.label}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluated using transparent FOIR rules, stress buffers, and product constraints.
                </p>
              </div>
              <div className="flex items-center space-x-3 no-print">
                <button
                  id="btn-edit-inputs"
                  onClick={() => setScreen('questionnaire')}
                  className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                >
                  Edit Answers
                </button>
                <button
                  id="btn-view-negotiation"
                  onClick={() => setScreen('negotiation')}
                  className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>One-Page Negotiation Card</span>
                </button>
              </div>
            </div>

            {/* OUTPUT 1: BORROW DECISION BANNER */}
            <div
              className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl ${
                calculations.borrowDecision.decision === 'BORROW'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                  : calculations.borrowDecision.decision === 'BORROW_LESS'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-100'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    calculations.borrowDecision.decision === 'BORROW'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : calculations.borrowDecision.decision === 'BORROW_LESS'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {calculations.borrowDecision.decision === 'BORROW' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : calculations.borrowDecision.decision === 'BORROW_LESS' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase tracking-wider font-bold opacity-75">
                      Decision Outcome
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        calculations.borrowDecision.decision === 'BORROW'
                          ? 'bg-emerald-500/30 text-emerald-300'
                          : calculations.borrowDecision.decision === 'BORROW_LESS'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-rose-500/30 text-rose-300'
                      }`}
                    >
                      {calculations.borrowDecision.decision.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">
                    {calculations.borrowDecision.decision === 'BORROW'
                      ? 'Financially Plausible within Recommended Limits'
                      : calculations.borrowDecision.decision === 'BORROW_LESS'
                        ? 'Downsize Requested Amount or Extend Tenure'
                        : 'Do Not Borrow at Current Financial Position'}
                  </h2>
                  <ul className="text-xs space-y-1 pt-1 opacity-90">
                    {calculations.borrowDecision.mainReasons.map((r, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="opacity-50">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quick Key Metric */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex-shrink-0 min-w-[200px] text-right md:text-left">
                <span className="text-[11px] text-slate-400 block uppercase font-medium">
                  Recommended Loan
                </span>
                <span className="text-2xl font-bold text-white font-mono">
                  ₹{calculations.recommendedAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Requested: ₹{profile.desiredLoanAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* OUTPUT 2: LENDER CEILING VS BORROWER SAFE CEILING */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Lender Likely Ceiling */}
              <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Lender Likely Sanction</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      Multiplier Model
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    ₹{calculations.lenderLikelyCeiling.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    What aggressive sales agents or bank algorithms may plausibly approve based solely on income multipliers and basic policy caps.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> Never treat the maximum sanction amount as your target loan size. Lenders do not account for your true living costs or stress events.
                  </span>
                </div>
              </div>

              {/* Borrower Safe Ceiling */}
              <div className="p-6 rounded-2xl bg-slate-800/60 border border-indigo-500/40 flex flex-col justify-between space-y-4 shadow-lg shadow-indigo-500/5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Borrower-Safe Ceiling</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Cash-Flow Safe
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                    ₹{calculations.borrowerSafeCeiling.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Maximum borrowing amount sustainable after deducting essential household expenses, existing EMIs, and a conservative emergency buffer.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Safe Monthly Outflow:</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{calculations.affordability.safeMonthlyOutflow.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Collateral & Special Routing Warnings */}
            {calculations.collateralWarning && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-3">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Collateral Caveat:</strong>
                  {calculations.collateralWarning}
                </div>
              </div>
            )}

            {/* OUTPUT 3: FAIR RATE, APR & CONFIDENCE */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Fair Rate Range */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <span className="text-xs uppercase font-semibold text-slate-400 block">
                  Fair Interest Rate Range
                </span>
                <div className="text-2xl font-bold text-white font-mono">
                  {calculations.rateResult.fairRate.expectedLow.toFixed(1)}% – {calculations.rateResult.fairRate.expectedHigh.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>
                    Expected for your profile:{' '}
                    <span className="text-slate-200 font-medium">
                      {calculations.rateResult.fairRate.expectedLow.toFixed(1)}% to {calculations.rateResult.fairRate.expectedHigh.toFixed(1)}%
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Full planning spread: {calculations.rateResult.fairRate.low.toFixed(1)}% - {calculations.rateResult.fairRate.high.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Estimated APR with Fees */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <span className="text-xs uppercase font-semibold text-slate-400 block">
                  Estimated All-In APR
                </span>
                <div className="text-2xl font-bold text-sky-400 font-mono">
                  {calculations.aprResult.estimatedAPR.toFixed(1)}% p.a.
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Includes {config.PROCESSING_FEE_PERCENT}% processing fee (₹{calculations.aprResult.totalProcessingFee.toLocaleString('en-IN')}) amortized across loan tenure.
                </p>
              </div>

              {/* Confidence Tier */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-slate-400 block">
                    Confidence Level
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      calculations.confidenceResult.level === 'HIGH'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : calculations.confidenceResult.level === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {calculations.confidenceResult.level} ({calculations.confidenceResult.score}/10)
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {getConfidenceLanguage(calculations.confidenceResult.level).rangeNote}
                </p>
                <p className="text-[11px] text-slate-500">
                  We deliberately use ranges instead of fabricating exact approval amounts.
                </p>
              </div>
            </div>

            {/* OUTPUT 4: EMI & TENURE TRADE-OFFS */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">Monthly EMI & Tenure Trade-Offs</h3>
                  <p className="text-xs text-slate-400">
                    Calculated at estimated rate of {calculations.rateResult.fairRate.expectedHigh}% p.a. for requested amount of ₹{profile.desiredLoanAmount.toLocaleString('en-IN')}.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Recommended Max EMI Ceiling</span>
                  <span className="font-mono text-emerald-400 font-bold text-lg">
                    ₹{calculations.recommendedMaxEMI.toLocaleString('en-IN')}/mo
                  </span>
                </div>
              </div>

              {/* 36 / 48 / 60 Months Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {calculations.tenureTradeoffs.emis.map((t, i) => {
                  const isSafe = t.monthlyEMI <= calculations.recommendedMaxEMI && calculations.recommendedMaxEMI > 0
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                        isSafe
                          ? 'bg-slate-900/80 border-slate-700'
                          : 'bg-rose-950/20 border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{t.tenureMonths} Months ({t.tenureMonths / 12} Yrs)</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            isSafe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isSafe ? 'Affordable' : 'Exceeds Budget'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 block">Monthly Installment</span>
                        <div className="text-xl font-mono font-bold text-white">
                          ₹{t.monthlyEMI.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Interest:</span>
                          <span className="font-mono text-slate-200">₹{t.totalInterest.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-slate-300">
                          <span>Total Cost:</span>
                          <span className="font-mono">₹{t.totalRepayment.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Rule of Thumb: Longer tenure lowers monthly EMI burden, but drastically multiplies total interest paid to the lender.
              </p>
            </div>

            {/* STRESS TEST & PRODUCT ROUTING */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 20% Income Drop Stress Test */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>20% Income Drop Stress Test</span>
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      calculations.borrowDecision.stressResult.affordableUnderStress
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {calculations.borrowDecision.stressResult.affordableUnderStress ? 'Survives Shock' : 'Stress Failure'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    If monthly income drops by 20% (from ₹{profile.netMonthlyIncome.toLocaleString('en-IN')} to ₹{Math.round(profile.netMonthlyIncome * 0.8).toLocaleString('en-IN')}):
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Safe EMI under stress:</span>
                      <span className="font-mono text-white">
                        ₹{calculations.borrowDecision.stressResult.stressSafeEMI.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Proposed EMI:</span>
                      <span className="font-mono text-white">
                        ₹{calculations.borrowDecision.stressResult.stressEMI.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {calculations.borrowDecision.stressResult.affordableUnderStress
                      ? '✓ Repayments remain manageable even after accounting for typical economic disruptions.'
                      : '⚠ Repayments would consume basic necessities under an income shock. Downsize loan amount.'}
                  </p>
                </div>
              </div>

              {/* Product Routing & Strategy */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span>Recommended Loan Structure</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    {calculations.routingResult.recommendedProduct.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>{calculations.routingResult.productRationale}</p>
                  {calculations.routingResult.warnings.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-[11px] font-semibold text-amber-300 block mb-1">
                        Critical Guidance:
                      </span>
                      <ul className="space-y-1 text-slate-400 text-[11px]">
                        {calculations.routingResult.warnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Button to Negotiation Card */}
            <div className="pt-4 flex justify-center no-print">
              <button
                id="btn-open-negotiation-card"
                onClick={() => setScreen('negotiation')}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/20 flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Open One-Page Negotiation Card for Lenders</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== 4. NEGOTIATION CARD SCREEN ==================== */}
        {screen === 'negotiation' && calculations && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between no-print border-b border-slate-800 pb-4">
              <button
                onClick={() => setScreen('results')}
                className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Full Analysis</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Negotiation Card</span>
              </button>
            </div>

            {/* Print Card Container */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 space-y-8 print:p-0 print:border-none print:shadow-none">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 block">
                    Borrower Copilot • Pre-Loan Negotiation Brief
                  </span>
                  <h1 className="text-3xl font-black text-slate-900 mt-1">
                    Lender Negotiation Dossier
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Borrower: <span className="font-semibold text-slate-900">{profile.name}</span> | Type:{' '}
                    <span className="capitalize font-semibold text-slate-900">{profile.incomeType}</span> | Prepared for Borrower Self-Advocacy
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded border-2 border-slate-900 font-mono text-xs font-bold uppercase">
                    CONFIDENTIAL
                  </div>
                </div>
              </div>

              {/* Crucial Decision Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Requested Loan</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    ₹{profile.desiredLoanAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Borrower Safe Ceiling</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    ₹{calculations.borrowerSafeCeiling.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Target Fair Rate</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {calculations.rateResult.fairRate.expectedLow.toFixed(1)}% - {calculations.rateResult.fairRate.expectedHigh.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Max Safe EMI</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    ₹{calculations.recommendedMaxEMI.toLocaleString('en-IN')}/mo
                  </span>
                </div>
              </div>

              {/* Talking Points & Positioning */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                  1. Borrower Financial Positioning & Rationale
                </h3>
                <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p>
                    • <strong>Primary Decision:</strong>{' '}
                    <span className="font-bold text-slate-900">
                      {calculations.borrowDecision.decision === 'BORROW'
                        ? 'BORROW within recommended limits'
                        : calculations.borrowDecision.decision === 'BORROW_LESS'
                          ? 'BORROW LESS — Downsize loan or extend tenure'
                          : 'DO NOT BORROW — Restructure existing obligations'}
                    </span>
                  </p>
                  <p>
                    • <strong>Lender vs Borrower Disconnect:</strong> A lender may consider up to ₹
                    {calculations.lenderLikelyCeiling.toLocaleString('en-IN')}, but actual cash flow supports up to ₹
                    {calculations.borrowerSafeCeiling.toLocaleString('en-IN')}.
                  </p>
                  <p>
                    • <strong>Stress Test Buffer:</strong> The proposed repayment structure is tested against a 20% income reduction scenario.
                  </p>
                  {calculations.collateralWarning && (
                    <p className="text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                      • <strong>Collateral Strategy:</strong> {calculations.collateralWarning}
                    </p>
                  )}
                </div>
              </div>

              {/* 8-Point Negotiation Checklist */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                  2. Mandatory Checklist to Negotiate with Lender
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">1. Quoted Interest Rate vs APR</strong>
                    Demand disclosure of effective APR including processing fees and administrative charges.
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">2. Upfront Processing Fees</strong>
                    Target fee ≤ 1.5% - 2.0% of principal. Request complete fee waiver or cap.
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">3. Foreclosure & Prepayment</strong>
                    Confirm zero foreclosure charges on floating rate personal loans per RBI guidelines.
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">4. Mandatory Insurance Tie-Ins</strong>
                    Lenders cannot compel you to purchase credit life insurance from their affiliate insurer.
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">5. Bounce & Penal Interest</strong>
                    Review bounce charges and penal interest terms in Key Fact Statement (KFS).
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block font-semibold">6. Sanction Ceiling Trap</strong>
                    Do not accept a higher sanction amount than your borrower-safe ceiling of ₹{calculations.borrowerSafeCeiling.toLocaleString('en-IN')}.
                  </div>
                </div>
              </div>

              {/* Prominent Disclaimer Footer */}
              <div className="pt-4 border-t-2 border-slate-900 flex items-start space-x-3 text-xs text-slate-600">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Notice:</strong> Borrower Copilot is an independent financial planning and self-advocacy tool. It is not an NBFC, lender, or credit broker. Calculations are planning estimates based on Indian lending norms and conservative FOIR assumptions.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 no-print">
        <p>Borrower Copilot • Designed for Indian Borrowers • Rules Engine completely isolated in pure TypeScript</p>
      </footer>
    </div>
  )
}