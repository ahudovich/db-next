'use client'

import { useId, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon } from 'lucide-react'
import { z } from 'zod'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import {
  LoanFormHeader,
  LoanFormHeaderDescription,
  LoanFormHeaderTitle,
} from '@/components/forms/loan/LoanFormHeader'
import { BaseAlert, BaseAlertDescription } from '@/components/ui/BaseAlert'
import { BaseCheckbox } from '@/components/ui/BaseCheckbox'
import { BaseField, BaseFieldError, BaseFieldLabel } from '@/components/ui/BaseField'
import { BaseTextarea } from '@/components/ui/BaseTextarea'
import { useLoanFormContext } from '@/contexts/loan-form'
import { updateCaseConsentsAndCommentAction } from '@/lib/actions/cases'

const formSchema = z.object({
  comment: z.string().trim().optional(),
  consentTerms: z.boolean().refine((v) => v === true, {
    message: 'Du skal acceptere vilkårene for at fortsætte',
  }),
  consentMarketing: z.boolean().optional(),
})

export function LoanFormSubmissionStep({
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
      comment: formData.comment ?? '',
      consentTerms: formData.consentTerms ?? false,
      consentMarketing: formData.consentMarketing ?? false,
    },
  })

  function handleSubmit(data: z.infer<typeof formSchema>) {
    setError(null)

    startTransition(async () => {
      if (!formData.caseId) return

      const response = await updateCaseConsentsAndCommentAction({
        caseId: formData.caseId,
        consentTerms: data.consentTerms,
        consentMarketing: !!data.consentMarketing,
        comment: data.comment ?? null,
      })

      startTransition(() => {
        if (response.status === 'success') {
          updateFormData({
            comment: data.comment ?? null,
            consentTerms: data.consentTerms,
            consentMarketing: data.consentMarketing,
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
        <LoanFormHeaderTitle>Sidste tjek før beregning</LoanFormHeaderTitle>
        <LoanFormHeaderDescription>Vi er klar til at beregne dit lån</LoanFormHeaderDescription>
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
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <BaseFieldLabel htmlFor={`${id}-comment`}>
                  Har du en kommentar? (Valgfri)
                </BaseFieldLabel>
                <BaseTextarea
                  id={`${id}-comment`}
                  placeholder="F.eks. om din arbejdssituation eller særlige ønsker..."
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <Controller
            name="consentTerms"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <div className="relative pl-7">
                  <BaseCheckbox
                    id={`${id}-consentTerms`}
                    className="absolute top-0.75 left-0"
                    aria-invalid={fieldState.invalid}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <BaseFieldLabel htmlFor={`${id}-consentTerms`}>
                    Jeg accepterer handelsbetingelser og privatlivspolitik
                  </BaseFieldLabel>
                </div>
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <Controller
            name="consentMarketing"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <div className="relative pl-7">
                  <BaseCheckbox
                    id={`${id}-consentMarketing`}
                    className="absolute top-0.75 left-0"
                    aria-invalid={fieldState.invalid}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <BaseFieldLabel htmlFor={`${id}-consentMarketing`}>
                    Jeg vil gerne modtage nyhedsbreve og oplysninger om nye produkter og tjenester
                  </BaseFieldLabel>
                </div>
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />
        </div>

        <LoanFormFooter isNextStepDisabled={isPending} onPrevious={onPreviousStep} />
      </form>
    </>
  )
}
