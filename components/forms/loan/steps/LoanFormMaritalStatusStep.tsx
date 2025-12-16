import { useState } from 'react'
import { FlowerIcon, HeartIcon, HomeIcon, UserCheckIcon, UserIcon } from 'lucide-react'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import { LoanFormHeader, LoanFormHeaderTitle } from '@/components/forms/loan/LoanFormHeader'
import { LoanFormSelectionCard } from '@/components/forms/loan/steps/LoanFormSelectionCard'
import { useLoanFormContext } from '@/contexts/loan-form'
import { MaritalStatus } from '@/enums/form/MaritalStatus.enum'
import type { LucideIcon } from 'lucide-react'

const options: Readonly<Array<{ label: string; value: MaritalStatus; icon: LucideIcon }>> = [
  { label: 'Gift', value: MaritalStatus.Married, icon: HeartIcon },
  { label: 'Samlever', value: MaritalStatus.Cohabiting, icon: HomeIcon },
  { label: 'Enlig', value: MaritalStatus.Single, icon: UserIcon },
  { label: 'Skilt', value: MaritalStatus.Divorced, icon: UserCheckIcon },
  { label: 'Enke', value: MaritalStatus.Widow, icon: FlowerIcon },
]

export function LoanFormMaritalStatusStep({
  onNextStep,
  onPreviousStep,
}: {
  onNextStep: () => void
  onPreviousStep: () => void
}) {
  const { formData, updateFormData } = useLoanFormContext()

  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<MaritalStatus | null>(
    formData.maritalStatus ?? null
  )

  function handleSelection(value: MaritalStatus) {
    setSelectedMaritalStatus(value)

    updateFormData({
      maritalStatus: value,
    })

    onNextStep()
  }

  return (
    <>
      <LoanFormHeader>
        <LoanFormHeaderTitle>Hvad er din civilstatus?</LoanFormHeaderTitle>
      </LoanFormHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {options.map((option) => (
          <LoanFormSelectionCard
            key={option.value}
            isSelected={selectedMaritalStatus === option.value}
            onClick={() => handleSelection(option.value)}
            {...option}
          />
        ))}
      </div>

      <LoanFormFooter isNextButtonHidden={true} onPrevious={onPreviousStep} />
    </>
  )
}
