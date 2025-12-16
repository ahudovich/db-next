import { useState } from 'react'
import { Building2Icon, HomeIcon, KeyIcon, UsersIcon } from 'lucide-react'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import { LoanFormHeader, LoanFormHeaderTitle } from '@/components/forms/loan/LoanFormHeader'
import { LoanFormSelectionCard } from '@/components/forms/loan/steps/LoanFormSelectionCard'
import { useLoanFormContext } from '@/contexts/loan-form'
import { HousingCondition } from '@/enums/form/HousingCondition.enum'
import type { LucideIcon } from 'lucide-react'

const options: Readonly<Array<{ label: string; value: HousingCondition; icon: LucideIcon }>> = [
  { label: 'Ejerbolig', value: HousingCondition.Own, icon: HomeIcon },
  { label: 'Andelsbolig', value: HousingCondition.Cooperative, icon: Building2Icon },
  { label: 'Lejebolig', value: HousingCondition.Rented, icon: KeyIcon },
  { label: 'Hjemmeboende', value: HousingCondition.Home, icon: UsersIcon },
]

export function LoanFormHousingStep({
  onNextStep,
  onPreviousStep,
}: {
  onNextStep: () => void
  onPreviousStep: () => void
}) {
  const { formData, updateFormData } = useLoanFormContext()

  const [selectedHousing, setSelectedHousing] = useState<HousingCondition | null>(
    formData.housingConditions ?? null
  )

  function handleSelection(value: HousingCondition) {
    setSelectedHousing(value)

    updateFormData({
      housingConditions: value,
    })

    onNextStep()
  }

  return (
    <>
      <LoanFormHeader>
        <LoanFormHeaderTitle>Hvordan bor du i dag?</LoanFormHeaderTitle>
      </LoanFormHeader>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <LoanFormSelectionCard
            key={option.value}
            isSelected={selectedHousing === option.value}
            onClick={() => handleSelection(option.value)}
            {...option}
          />
        ))}
      </div>

      <LoanFormFooter isNextButtonHidden={true} onPrevious={onPreviousStep} />
    </>
  )
}
