'use client'

import { useId } from 'react'
import PhoneInput from 'react-phone-number-input'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import {
  LoanFormHeader,
  LoanFormHeaderDescription,
  LoanFormHeaderTitle,
} from '@/components/forms/loan/LoanFormHeader'
import { BaseField, BaseFieldError, BaseFieldLabel } from '@/components/ui/BaseField'
import { BaseInput } from '@/components/ui/BaseInput'
import { useLoanFormAmounts } from '@/hooks/forms/useLoanFormAmounts'

export function LoanFormAmountStep({
  className,
  onNextStep,
  onPreviousStep,
}: {
  className?: string
  onNextStep: () => void
  onPreviousStep: () => void
}) {
  const id = useId()
  const { loanAmount, payout, equity, creditPurpose } = useLoanFormAmounts()

  async function handleSubmit() {}

  return (
    <>
      <LoanFormHeader>
        <LoanFormHeaderTitle>-- TITLE --</LoanFormHeaderTitle>
        <LoanFormHeaderDescription>-- DESCRIPTION --</LoanFormHeaderDescription>
      </LoanFormHeader>

      <form className={className} onSubmit={handleSubmit}>
        <div className="grid gap-6">
          
        </div>

        <LoanFormFooter onPrevious={onPreviousStep} />
      </form>
    </>
  )
}
