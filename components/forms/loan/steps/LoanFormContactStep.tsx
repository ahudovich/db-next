'use client'

import { useId, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'
import { z } from 'zod'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import {
  LoanFormHeader,
  LoanFormHeaderDescription,
  LoanFormHeaderTitle,
} from '@/components/forms/loan/LoanFormHeader'
import { BaseAlert, BaseAlertDescription } from '@/components/ui/BaseAlert'
import { BaseField, BaseFieldError, BaseFieldLabel } from '@/components/ui/BaseField'
import { BaseInput } from '@/components/ui/BaseInput'
import { useLoanFormContext } from '@/contexts/loan-form'
import { createCaseAction } from '@/lib/actions/cases'
import type { CreditPurpose } from '@/enums/form/CreditPurpose.enum'

const formSchema = z.object({
  firstName: z.string().min(1, 'Fornavn er påkrævet').trim(),
  lastName: z.string().min(1, 'Efternavn er påkrævet').trim(),
  email: z.email('Ugyldig e-mail adresse').min(1, 'E-mail adresse er påkrævet').trim(),
  phoneNumber: z.string().min(1, 'Mobilnummer er påkrævet').trim(),
})

export function LoanFormContactStep({
  className,
  onNextStep,
  onPreviousStep,
}: {
  className?: string
  onNextStep: () => void
  onPreviousStep: () => void
}) {
  const id = useId()
  const { formData, updateFormData } = useLoanFormContext()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: formData.debtors?.[0]?.firstName ?? '',
      lastName: formData.debtors?.[0]?.lastName ?? '',
      email: formData.debtors?.[0]?.email ?? '',
      phoneNumber: formData.debtors?.[0]?.phoneNumber ?? '',
    },
  })

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    setError(null)

    startTransition(async () => {
      if (!formData.base) return

      const response = await createCaseAction({
        base: {
          creditPurpose: formData.base.creditPurpose as CreditPurpose,
          loanAmount: formData.base.loanAmount as number,
          payout: formData.base.payout,
          equity: formData.base.equity,
        },
        debtor: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
        },
      })

      startTransition(() => {
        if (response.status === 'success') {
          updateFormData({
            caseId: response.data.caseId,
            debtors: [
              {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                cprNumber: response.data.temporaryCprNumber,
              },
            ],
          })

          onNextStep()
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
        <LoanFormHeaderTitle>Hvem skal vi sende beregningen til?</LoanFormHeaderTitle>
        <LoanFormHeaderDescription>
          Helt uforpligtende. Vi spammer aldrig.
        </LoanFormHeaderDescription>
      </LoanFormHeader>

      {error && (
        <BaseAlert className="mb-8" variant="error">
          <CircleAlertIcon />
          <BaseAlertDescription>{error.message}</BaseAlertDescription>
        </BaseAlert>
      )}

      <form className={className} onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <BaseFieldLabel htmlFor={`${id}-firstName`}>Fornavn</BaseFieldLabel>
                <BaseInput
                  id={`${id}-firstName`}
                  autoComplete="given-name"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <BaseFieldLabel htmlFor={`${id}-lastName`}>Efternavn</BaseFieldLabel>
                <BaseInput
                  id={`${id}-lastName`}
                  autoComplete="family-name"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <BaseFieldLabel htmlFor={`${id}-email`}>E-mail adresse</BaseFieldLabel>
                <BaseInput
                  id={`${id}-email`}
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <Controller
            name="phoneNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <BaseFieldLabel htmlFor={`${id}-phoneNumber`}>Mobilnummer</BaseFieldLabel>
                <BaseInput
                  id={`${id}-phoneNumber`}
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <BaseAlert>
            <CircleCheckIcon />
            <BaseAlertDescription>
              Dine kontaktoplysninger bruges kun til at sende din låneberegning.
            </BaseAlertDescription>
          </BaseAlert>
        </div>

        <LoanFormFooter isNextStepDisabled={isPending} onPrevious={onPreviousStep} />
      </form>
    </>
  )
}
