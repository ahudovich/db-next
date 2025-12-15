import { useId, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, LockIcon } from 'lucide-react'
import z from 'zod'
import { LoanFormFooter } from '@/components/forms/loan/LoanFormFooter'
import {
  LoanFormHeader,
  LoanFormHeaderDescription,
  LoanFormHeaderTitle,
} from '@/components/forms/loan/LoanFormHeader'
import { BaseAlert, BaseAlertDescription } from '@/components/ui/BaseAlert'
import { BaseField, BaseFieldError, BaseFieldLabel } from '@/components/ui/BaseField'
import { BaseInput } from '@/components/ui/BaseInput'
import { BaseSeparator } from '@/components/ui/BaseSeparator'
import { useLoanFormContext } from '@/contexts/loan-form'
import { saveCaseDebtorsAction } from '@/lib/actions/cases'
import { cprSchema } from '@/types/schemas/cpr-number'
import { formatCprNumber } from '@/utils/validation'
import type { LoanFormState } from '@/types/loan-form'

const additionalDebtorSchema = z.object({
  firstName: z.string().min(1, 'Fornavn er påkrævet').trim(),
  lastName: z.string().min(1, 'Efternavn er påkrævet').trim(),
  email: z.email('Ugyldig e-mail adresse').min(1, 'E-mail adresse er påkrævet').trim(),
  phoneNumber: z.string().min(1, 'Mobilnummer er påkrævet').trim(),
  cprNumber: cprSchema,
})

type AdditionalDebtor = z.infer<typeof additionalDebtorSchema>

function createFormSchema(numberOfDebtors: number) {
  const schema: Record<string, z.ZodTypeAny> = {
    mainDebtorCprNumber: cprSchema,
  }

  // Add schema for additional debtors (starting from debtor 2)
  for (let i = 1; i < numberOfDebtors; i++) {
    schema[`additionalDebtor${i}`] = additionalDebtorSchema
  }

  return z.object(schema)
}

export function LoanFormIdentityStep({
  onNextStep,
  onPreviousStep,
}: {
  onNextStep: () => void
  onPreviousStep: () => void
}) {
  const id = useId()
  const { formData, updateFormData } = useLoanFormContext()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  // Always available on this step
  const mainDebtorInfo = formData.debtors?.[0] as LoanFormState['debtors'][0]
  const numberOfDebtors = formData.numberOfDebtors ?? 1

  const form = useForm<Record<string, any>>({
    resolver: zodResolver(createFormSchema(numberOfDebtors)),
    defaultValues: getDefaultValues(),
  })

  function getDefaultValues() {
    const values: Record<string, any> = {
      mainDebtorCprNumber: '',
    }

    // Add default values for additional debtors
    // 0 index is a main debtor, it's skipped here
    for (let i = 1; i < numberOfDebtors; i++) {
      const existingDebtor = formData.debtors?.[i]

      values[`additionalDebtor${i}`] = {
        firstName: existingDebtor?.firstName ?? '',
        lastName: existingDebtor?.lastName ?? '',
        email: existingDebtor?.email ?? '',
        phoneNumber: existingDebtor?.phoneNumber ?? '',
        cprNumber: existingDebtor?.cprNumber ?? '',
      }
    }

    return values
  }

  function handleSubmit(data: Record<string, any>) {
    const updatedDebtors = [...(formData.debtors ?? [])]

    // Update main debtor's CPR
    updatedDebtors[0] = {
      ...updatedDebtors[0],
      cprNumber: data.mainDebtorCprNumber as string,
    }

    // Add additional debtors
    for (let i = 1; i < numberOfDebtors; i++) {
      const additionalDebtorData = data[`additionalDebtor${i}`] as AdditionalDebtor

      if (additionalDebtorData) {
        updatedDebtors[i] = {
          firstName: additionalDebtorData.firstName,
          lastName: additionalDebtorData.lastName,
          email: additionalDebtorData.email,
          phoneNumber: additionalDebtorData.phoneNumber,
          cprNumber: additionalDebtorData.cprNumber,
        }
      }
    }

    setError(null)

    startTransition(async () => {
      if (!formData.caseId || !mainDebtorInfo.cprNumber) return

      const additionalDebtors = updatedDebtors.length > 1 ? updatedDebtors.slice(1) : null

      const response = await saveCaseDebtorsAction({
        caseId: formData.caseId,
        mainDebtor: {
          oldCprNumber: mainDebtorInfo.cprNumber,
          newCprNumber: data.mainDebtorCprNumber,
        },
        additionalDebtors: additionalDebtors
          ? additionalDebtors.map((debtor) => ({
              ...(debtor as AdditionalDebtor),
            }))
          : null,
      })

      startTransition(() => {
        if (response.status === 'success') {
          updateFormData({
            debtors: updatedDebtors,
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
        <LoanFormHeaderTitle>Sikkerhed & Identitet</LoanFormHeaderTitle>
        <LoanFormHeaderDescription>
          Vi skal bruge dit CPR til at hente dine skatteoplysninger automatisk. Så slipper du for
          papirarbejdet.
        </LoanFormHeaderDescription>
      </LoanFormHeader>

      {error && (
        <BaseAlert className="mb-8" variant="error">
          <CircleAlertIcon />
          <BaseAlertDescription>{error.message}</BaseAlertDescription>
        </BaseAlert>
      )}

      <div className="mb-6">
        <h3 className="mb-6 text-xl font-semibold">
          Hej {mainDebtorInfo?.firstName}, vi mangler kun dit CPR for at tjekke skat.
        </h3>

        <dl className="bg-brand-spring/25 grid max-w-lg gap-3 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between gap-6 overflow-hidden">
            <dt className="text-brand-dark/75 font-medium">Navn</dt>
            <dd className="truncate text-lg font-semibold">
              {mainDebtorInfo.firstName} {mainDebtorInfo.lastName}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-6 overflow-hidden">
            <dt className="text-brand-dark/75 font-medium">Email</dt>
            <dd className="truncate text-lg font-semibold">{mainDebtorInfo.email}</dd>
          </div>

          <div className="flex items-center justify-between gap-6 overflow-hidden">
            <dt className="text-brand-dark/75 font-medium">Telefon</dt>
            <dd className="truncate text-lg font-semibold">{mainDebtorInfo.phoneNumber}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6">
          <Controller
            name="mainDebtorCprNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <BaseField data-invalid={fieldState.invalid}>
                <BaseFieldLabel htmlFor={`${id}-mainDebtorCprNumber`}>CPR nummer</BaseFieldLabel>
                <BaseInput
                  id={`${id}-mainDebtorCprNumber`}
                  placeholder="DDMMÅÅ-XXXX"
                  aria-invalid={fieldState.invalid}
                  inputMode="numeric"
                  {...field}
                  // Override the onChange handler to format CPR number
                  onChange={(event) => {
                    const formatted = formatCprNumber(event.target.value)
                    field.onChange(formatted)
                  }}
                />
                {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
              </BaseField>
            )}
          />

          <BaseAlert>
            <LockIcon />
            <BaseAlertDescription>
              Dine data sendes krypteret direkte til CPR-registret.
            </BaseAlertDescription>
          </BaseAlert>
        </div>

        {numberOfDebtors > 1 && (
          <>
            {Array.from({ length: numberOfDebtors - 1 }, (_, index) => {
              const debtorNumber = index + 2 // Start from 2 (debtor 2, 3, 4...)
              const fieldPrefix = `additionalDebtor${index + 1}` as const

              return (
                <div key={debtorNumber}>
                  <BaseSeparator className="my-12" />

                  <div className="grid gap-6">
                    <h3 className="text-xl font-semibold">Låntager nr. {debtorNumber}</h3>

                    <Controller
                      name={`${fieldPrefix}.firstName`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <BaseField data-invalid={fieldState.invalid}>
                          <BaseFieldLabel htmlFor={`${id}-${fieldPrefix}-firstName`}>
                            Fornavn
                          </BaseFieldLabel>
                          <BaseInput
                            id={`${id}-${fieldPrefix}-firstName`}
                            autoComplete="given-name"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
                        </BaseField>
                      )}
                    />

                    <Controller
                      name={`${fieldPrefix}.lastName`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <BaseField data-invalid={fieldState.invalid}>
                          <BaseFieldLabel htmlFor={`${id}-${fieldPrefix}-lastName`}>
                            Efternavn
                          </BaseFieldLabel>
                          <BaseInput
                            id={`${id}-${fieldPrefix}-lastName`}
                            autoComplete="family-name"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
                        </BaseField>
                      )}
                    />

                    <Controller
                      name={`${fieldPrefix}.email`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <BaseField data-invalid={fieldState.invalid}>
                          <BaseFieldLabel htmlFor={`${id}-${fieldPrefix}-email`}>
                            E-mail adresse
                          </BaseFieldLabel>
                          <BaseInput
                            id={`${id}-${fieldPrefix}-email`}
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
                      name={`${fieldPrefix}.phoneNumber`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <BaseField data-invalid={fieldState.invalid}>
                          <BaseFieldLabel htmlFor={`${id}-${fieldPrefix}-phoneNumber`}>
                            Mobilnummer
                          </BaseFieldLabel>
                          <BaseInput
                            id={`${id}-${fieldPrefix}-phoneNumber`}
                            autoComplete="tel"
                            inputMode="tel"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
                        </BaseField>
                      )}
                    />

                    <Controller
                      name={`${fieldPrefix}.cprNumber`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <BaseField data-invalid={fieldState.invalid}>
                          <BaseFieldLabel htmlFor={`${id}-${fieldPrefix}-cprNumber`}>
                            CPR nummer
                          </BaseFieldLabel>
                          <BaseInput
                            id={`${id}-${fieldPrefix}-cprNumber`}
                            placeholder="DDMMÅÅ-XXXX"
                            aria-invalid={fieldState.invalid}
                            inputMode="numeric"
                            {...field}
                            // Override the onChange handler to format CPR number
                            onChange={(event) => {
                              const formatted = formatCprNumber(event.target.value)
                              field.onChange(formatted)
                            }}
                          />
                          {fieldState.invalid && <BaseFieldError errors={[fieldState.error]} />}
                        </BaseField>
                      )}
                    />
                  </div>
                </div>
              )
            })}
          </>
        )}

        <LoanFormFooter isNextStepDisabled={isPending} onPrevious={onPreviousStep} />
      </form>
    </>
  )
}
