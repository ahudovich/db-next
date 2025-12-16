import { useState, useTransition } from 'react'
import { NumberField } from '@base-ui/react/number-field'
import { CircleAlertIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import {
  LoanFormHeader,
  LoanFormHeaderDescription,
  LoanFormHeaderTitle,
} from '@/components/forms/loan/LoanFormHeader'
import { BaseAlert, BaseAlertDescription } from '@/components/ui/BaseAlert'
import { BaseInput } from '@/components/ui/BaseInput'
import { useLoanFormContext } from '@/contexts/loan-form'
import { updateCaseLifeSituationAction } from '@/lib/actions/cases'
import type { HousingCondition } from '@/enums/form/HousingCondition.enum'
import type { MaritalStatus } from '@/enums/form/MaritalStatus.enum'

const MAX_CHILDREN_COUNT = 10

export function LoanFormChildrenStep({
  onNextStep,
  onPreviousStep,
}: {
  onNextStep: () => void
  onPreviousStep: () => void
}) {
  const { formData, updateFormData } = useLoanFormContext()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const [childrenCount, setChildrenCount] = useState(formData.numberOfChildren ?? 0)
  const [childrenAges, setChildrenAges] = useState<Array<number | ''>>(
    formData.agesOfChildren ?? []
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    updateFormData({
      numberOfChildren: childrenCount,
      agesOfChildren: childrenAges as Array<number>,
    })

    setError(null)

    startTransition(async () => {
      // Don't call API if the case ID is missing
      if (!formData.caseId) {
        onNextStep()
        return
      }

      const response = await updateCaseLifeSituationAction({
        caseId: formData.caseId,
        housingConditions: formData.housingConditions as HousingCondition,
        maritalStatus: formData.maritalStatus as MaritalStatus,
        numberOfChildren: childrenCount,
        agesOfChildren: childrenAges as Array<number>,
      })

      startTransition(() => {
        if (response.status === 'success') {
          onNextStep()
        }

        if (response.status === 'error') {
          setError(new Error('Noget gik galt. Prøv venligst igen.'))
        }
      })
    })
  }

  function handleAgeChange(event: React.ChangeEvent<HTMLInputElement>, index: number) {
    const newAges = [...childrenAges]
    newAges[index] = event.target.value && Number.parseInt(event.target.value)
    setChildrenAges(newAges)
  }

  return (
    <>
      <LoanFormHeader>
        <LoanFormHeaderTitle>Har du hjemmeboende børn?</LoanFormHeaderTitle>
        <LoanFormHeaderDescription>
          Børn påvirker rådighedsbeløbet &ndash; vi hjælper med beregningen.
        </LoanFormHeaderDescription>
      </LoanFormHeader>

      {error && (
        <BaseAlert className="mb-8" variant="error">
          <CircleAlertIcon />
          <BaseAlertDescription>{error.message}</BaseAlertDescription>
        </BaseAlert>
      )}

      <form onSubmit={handleSubmit}>
        <NumberField.Root
          className="flex items-center gap-8"
          min={0}
          max={MAX_CHILDREN_COUNT}
          value={childrenCount}
          onValueChange={(value) => setChildrenCount(value ?? 0)}
        >
          <NumberField.Decrement className="hover:bg-brand-primary/10 border-brand-border grid size-16 cursor-pointer place-content-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-50">
            <MinusIcon className="text-brand-dark size-6" />
          </NumberField.Decrement>

          <div className="text-center">
            <NumberField.Input className="text-brand-primary w-20 text-center text-5xl font-bold outline-none" />
            <div className="text-brand-dark/75 mt-1 text-sm">
              {childrenCount === 0 ? 'Ingen børn' : childrenCount === 1 ? 'Barn' : 'Børn'}
            </div>
          </div>

          <NumberField.Increment className="hover:bg-brand-primary/10 border-brand-border grid size-16 cursor-pointer place-content-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-50">
            <PlusIcon className="text-brand-dark size-6" />
          </NumberField.Increment>
        </NumberField.Root>

        {childrenCount > 0 && (
          <div className="mt-10">
            <h3 className="text-brand-dark mb-5 text-xl font-medium">Alder på børnene</h3>
            <div className="grid gap-4">
              {Array.from({ length: childrenCount }).map((_, index) => (
                <BaseInput
                  key={index}
                  type="number"
                  min={0}
                  max={18}
                  inputMode="numeric"
                  placeholder={`Barn ${index + 1} alder`}
                  value={childrenAges[index] ?? ''}
                  onChange={(event) => handleAgeChange(event, index)}
                />
              ))}
            </div>
          </div>
        )}

        <LoanFormFooter
          isNextStepDisabled={
            isPending ||
            (childrenCount > 0 &&
              (childrenAges.length !== childrenCount || childrenAges.some((age) => age === '')))
          }
          onPrevious={onPreviousStep}
        />
      </form>
    </>
  )
}
