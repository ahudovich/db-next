'use client'

import { useId, useState, useTransition } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import { CheckCircleIcon, CircleAlertIcon, InfoIcon, MapPinIcon } from 'lucide-react'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import {
  LoanFormHeader,
  LoanFormHeaderDescription,
  LoanFormHeaderTitle,
} from '@/components/forms/loan/LoanFormHeader'
import LoanFormPropertyStepInput from '@/components/forms/loan/steps/property/LoanFormPropertyStepInput'
import { StandardMap } from '@/components/maps/StandardMap'
import { StreetViewMap } from '@/components/maps/StreetViewMap'
import { BaseAlert, BaseAlertDescription, BaseAlertTitle } from '@/components/ui/BaseAlert'
import { useLoanFormContext } from '@/contexts/loan-form'
import { env } from '@/env'
import { updateCasePropertyIdAction } from '@/lib/actions/cases'
import type { DawaAddressAutocompleteResult } from '@/types/dawa'

export function LoanFormPropertyStep({
  className,
  isOptional = false,
  onNextStep,
  onPreviousStep,
}: {
  className?: string
  isOptional?: boolean
  onNextStep: (address: string) => void
  onPreviousStep: () => void
}) {
  const id = useId()
  const { formData, updateFormData } = useLoanFormContext()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const [searchValue, setSearchValue] = useState(formData.property?.address ?? '')
  const [selectedValue, setSelectedValue] = useState<DawaAddressAutocompleteResult | null>(
    formData.property?.dawaResult ?? null
  )

  const isNextButtonDimmed = !selectedValue

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const address = selectedValue?.tekst ?? ''

    updateFormData({
      property: {
        address,
        dawaResult: selectedValue,
      },
    })

    setError(null)

    startTransition(async () => {
      // Don't call API if the property ID or case ID is missing
      if (!selectedValue?.adresse.id || !formData.caseId) {
        onNextStep(address)
        return
      }

      const response = await updateCasePropertyIdAction({
        caseId: formData.caseId,
        propertyId: selectedValue.adresse.id,
      })

      console.log(response)

      startTransition(() => {
        if (response.status === 'success') {
          onNextStep(address)
        }

        if (response.status === 'error') {
          setError(new Error('Noget gik galt. Prøv venligst igen.'))
        }
      })
    })
  }

  return (
    <>
      <LoanFormHeader>
        <LoanFormHeaderTitle isOptional={isOptional}>
          Hvilken bolig kigger du på?
        </LoanFormHeaderTitle>
        <LoanFormHeaderDescription>
          Vi henter automatisk oplysninger om boligen.
        </LoanFormHeaderDescription>
      </LoanFormHeader>

      {error && (
        <BaseAlert className="mb-8" variant="error">
          <CircleAlertIcon />
          <BaseAlertDescription>{error.message}</BaseAlertDescription>
        </BaseAlert>
      )}

      <form className={className} onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <LoanFormPropertyStepInput
            id={`${id}-address`}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />

          {!selectedValue ? (
            <BaseAlert>
              <InfoIcon />
              <BaseAlertDescription>
                <span>
                  <strong>Tip:</strong> Ved at indtaste adressen kan vi give dig et mere præcist
                  lånetilbud.
                </span>
              </BaseAlertDescription>
            </BaseAlert>
          ) : (
            <PropertyDetails key={selectedValue?.adresse.id} selectedValue={selectedValue} />
          )}
        </div>

        <LoanFormFooter
          isNextStepDisabled={isPending}
          isNextButtonDimmed={isNextButtonDimmed}
          nextButtonText={isNextButtonDimmed ? 'Spring over' : 'Fortsæt'}
          onPrevious={onPreviousStep}
        />
      </form>
    </>
  )
}

function PropertyDetails({ selectedValue }: { selectedValue: DawaAddressAutocompleteResult }) {
  return (
    <>
      <div className="space-y-4">
        {selectedValue.adresse.x && selectedValue.adresse.y ? (
          // If the address has coordinates - show the map
          <div className="space-y-6">
            <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
              <div className="aspect-video w-full overflow-hidden rounded-xl">
                <StandardMap
                  position={{
                    lat: selectedValue.adresse.y,
                    lng: selectedValue.adresse.x,
                  }}
                />
              </div>

              <div className="aspect-video w-full overflow-hidden rounded-xl">
                <StreetViewMap
                  position={{
                    lat: selectedValue.adresse.y,
                    lng: selectedValue.adresse.x,
                  }}
                />
              </div>
            </APIProvider>
          </div>
        ) : (
          // If the address has no coordinates - show a placeholder
          <div className="bg-brand-spring/25 border-brand-border overflow-hidden rounded-xl border p-8 text-center">
            <MapPinIcon className="text-brand-dark/50 mx-auto mb-4 size-8" />
            <p className="text-lg font-medium">{selectedValue.tekst}</p>
            {selectedValue.adresse && (
              <p className="text-brand-dark/65 mt-2">
                {selectedValue.adresse.postnr} {selectedValue.adresse.postnrnavn}
              </p>
            )}
          </div>
        )}
      </div>

      <BaseAlert>
        <CheckCircleIcon />
        <BaseAlertTitle>Vi har fundet boligen!</BaseAlertTitle>
        <BaseAlertDescription>
          Er det her den rigtige bolig? Klik &quot;Gå videre&quot; for at fortsætte.
        </BaseAlertDescription>
      </BaseAlert>
    </>
  )
}
