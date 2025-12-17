'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LoanFormProgress } from '@/components/forms/loan/LoanFormProgress'
import { LoanFormTrustSidebar } from '@/components/forms/loan/LoanFormTrustSidebar'
import { LoanFormAmountStep } from '@/components/forms/loan/steps/LoanFormAmountStep'
import { LoanFormChildrenStep } from '@/components/forms/loan/steps/LoanFormChildrenStep'
import { LoanFormContactStep } from '@/components/forms/loan/steps/LoanFormContactStep'
import { LoanFormDebtorsStep } from '@/components/forms/loan/steps/LoanFormDebtorsStep'
import { LoanFormHousingStep } from '@/components/forms/loan/steps/LoanFormHousingStep'
import { LoanFormIdentityStep } from '@/components/forms/loan/steps/LoanFormIdentityStep'
import { LoanFormMaritalStatusStep } from '@/components/forms/loan/steps/LoanFormMaritalStatusStep'
import { LoanFormPropertyReviewStep } from '@/components/forms/loan/steps/LoanFormPropertyReviewStep'
import { LoanFormSubmissionStep } from '@/components/forms/loan/steps/LoanFormSubmissionStep'
import { LoanFormSuccessStep } from '@/components/forms/loan/steps/LoanFormSuccessStep'
import { LoanFormPropertyStep } from '@/components/forms/loan/steps/property/LoanFormPropertyStep'
import { BaseSeparator } from '@/components/ui/BaseSeparator'
import { TrustpilotWidget } from '@/components/ui/TrustpilotWidget'
import { useLoanFormContext } from '@/contexts/loan-form'
import { cn } from '@/lib/utils'
import { EntryPath } from '@/types/loan-form'

const LoanFormStep: Readonly<Record<string, number>> = {
  Contact: 1,
  Property: 2,
  PropertyReview: 3,
  Housing: 4,
  MaritalStatus: 5,
  Debtors: 6,
  Children: 7,
  Identity: 8,
  Submission: 9,
}

const TOTAL_STEPS = Object.keys(LoanFormStep).length

export function LoanForm({ className }: { className?: string }) {
  const formRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { formData, step, nextStep, previousStep } = useLoanFormContext()

  const isInitialStep = formData.entryPath === EntryPath.Planner && step === LoanFormStep.Contact

  // Scroll to top of form when step changes
  useEffect(() => {
    // Don't scroll on the initial step
    if (isInitialStep) {
      return
    }

    if (formRef.current) {
      formRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [step, isInitialStep])

  function handleNextStep() {
    nextStep()
  }

  function handlePropertyNextStep(address: string) {
    if (!address) {
      // Skip property review step if address is not provided
      nextStep(LoanFormStep.Housing)
    } else {
      handleNextStep()
    }
  }

  function handlePreviousStep() {
    if (formData.entryPath === EntryPath.Planner) {
      // Skip property review step if address is not provided
      if (step === LoanFormStep.Housing && !formData.property?.address) {
        previousStep(LoanFormStep.Property)
        return
      }

      if (step === LoanFormStep.Contact) {
        router.back()
        return
      }

      previousStep()
    }
  }

  return (
    <div
      ref={formRef}
      className={cn(
        'bg-brand-card relative xl:overflow-hidden xl:rounded-3xl xl:shadow-2xl',
        className
      )}
    >
      {step <= TOTAL_STEPS && (
        <LoanFormProgress
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          address={formData.property?.address ?? null}
          loanAmount={formData.base?.loanAmount ?? null}
          downPayment={formData.base?.payout ?? null}
          currentListingPrice={formData.aiPricing?.currentListingPrice ?? null}
          pricePerSqm={formData.aiPricing?.pricePerSqm ?? null}
        />
      )}

      <div className="xl:grid xl:grid-cols-[1fr_auto]">
        <div className="pt-8 lg:px-12 lg:pt-12 lg:pb-18">
          {step === 0 && (
            <LoanFormAmountStep onNextStep={handleNextStep} onPreviousStep={handlePreviousStep} />
          )}

          {step === 1 && (
            <LoanFormContactStep onNextStep={handleNextStep} onPreviousStep={handlePreviousStep} />
          )}

          {step === 2 && (
            <LoanFormPropertyStep
              isOptional={true}
              onNextStep={handlePropertyNextStep}
              onPreviousStep={handlePreviousStep}
            />
          )}

          {step === 3 && (
            <LoanFormPropertyReviewStep
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}
            />
          )}

          {/* Shared steps */}
          {step === 4 && (
            <LoanFormHousingStep onNextStep={handleNextStep} onPreviousStep={handlePreviousStep} />
          )}

          {step === 5 && (
            <LoanFormMaritalStatusStep
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}
            />
          )}

          {step === 6 && (
            <LoanFormDebtorsStep onNextStep={handleNextStep} onPreviousStep={handlePreviousStep} />
          )}

          {step === 7 && (
            <LoanFormChildrenStep onNextStep={handleNextStep} onPreviousStep={handlePreviousStep} />
          )}

          {step === 8 && (
            <LoanFormIdentityStep onNextStep={handleNextStep} onPreviousStep={handlePreviousStep} />
          )}

          {step === 9 && (
            <LoanFormSubmissionStep
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}
            />
          )}

          {/* Success */}
          {step === TOTAL_STEPS + 1 && <LoanFormSuccessStep />}
        </div>

        <LoanFormTrustSidebar className="hidden xl:block xl:w-sm" />
      </div>

      {/* Trustpilot widget */}
      <div className="mt-12 xl:hidden">
        <BaseSeparator />

        <div className="my-8 flex justify-center">
          <TrustpilotWidget />
        </div>
      </div>
    </div>
  )
}
