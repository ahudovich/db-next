'use client'

import { createContext, useContext, useState } from 'react'
import { EntryPath } from '@/types/loan-form'
import type { LoanFormState } from '@/types/loan-form'

const INITIAL_STEP = 1

interface LoanFormContextType {
  step: number
  formData: Partial<LoanFormState>
  previousStep: (step?: number) => void
  nextStep: (step?: number) => void
  updateFormData: (updates: Partial<LoanFormState>) => void
}

const LoanFormContext = createContext<LoanFormContextType | null>(null)

export function useLoanFormContext() {
  const context = useContext(LoanFormContext)

  if (!context) {
    throw new Error('useLoanFormContext must be used within a LoanFormProvider')
  }

  return context
}

export function LoanFormProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(INITIAL_STEP)

  const [formData, setFormData] = useState<Partial<LoanFormState>>({
    caseId: null,
    entryPath: EntryPath.Planner, // Default entry path until "Dreamer" is implemented
    base: {
      creditPurpose: null,
      loanAmount: null,
      payout: null,
      equity: null,
    },
    property: {
      address: '',
      dawaResult: null,
    },
    aiPricing: {
      currentListingPrice: null,
      pricePerSqm: null,
    },
    numberOfDebtors: null,
    debtors: [],
    maritalStatus: null,
    housingConditions: null,
    numberOfChildren: null,
    agesOfChildren: [],
    comment: null,

    // Consents are off by default
    consentTerms: false,
    consentMarketing: false,
  })

  function previousStep(step?: number) {
    setStep((prevStep) => (step ? step : Math.max(INITIAL_STEP, prevStep - 1)))
  }

  function nextStep(step?: number) {
    setStep((prevStep) => (step ? step : prevStep + 1))
  }

  function updateFormData(updates: Partial<LoanFormState>) {
    setFormData((prevState) => ({
      ...prevState,
      ...updates,
    }))
  }

  return (
    <LoanFormContext value={{ step, formData, previousStep, nextStep, updateFormData }}>
      {children}
    </LoanFormContext>
  )
}
