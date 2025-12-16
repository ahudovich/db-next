'use client'

import { useId } from 'react'
import { useRouter } from 'next/navigation'
import { HeroFormSlider } from '@/components/forms/hero/HeroFormSlider'
import { HeroFormToggle, HeroFormToggleItem } from '@/components/forms/hero/HeroFormToggle'
import { BaseCtaButton } from '@/components/ui/BaseCtaButton'
import { CreditPurpose } from '@/enums/form/CreditPurpose.enum'
import { useLoanFormInitialValues } from '@/hooks/forms/useLoanFormInitialValues'
import { cn } from '@/lib/utils'

export function HeroForm({ className }: { className?: string }) {
  const id = useId()
  const router = useRouter()

  const {
    loanAmount,
    setLoanAmount,
    payout,
    setPayout,
    equity,
    setEquity,
    creditPurpose,
    setCreditPurpose,
    updateData,
  } = useLoanFormInitialValues()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    updateData()
    router.push(`/form`)
  }

  return (
    <div className={cn('', className)}>
      <HeroFormToggle
        className="-mx-[calc(var(--container-padding))] w-[calc(100%+var(--container-padding)*2)] lg:mx-0 lg:w-auto"
        defaultValue={CreditPurpose.Purchase}
        type="single"
        value={creditPurpose}
        onValueChange={(value) => {
          if (value) setCreditPurpose(value as CreditPurpose)
        }}
      >
        <HeroFormToggleItem value={CreditPurpose.Purchase}>Lån til Boligkøb</HeroFormToggleItem>
        <HeroFormToggleItem value={CreditPurpose.Supplement}>Lån i Friværdi</HeroFormToggleItem>
      </HeroFormToggle>

      <form className="bg-brand-card px-5 py-9 md:px-9 md:py-13" onSubmit={handleSubmit}>
        <div className="space-y-6 md:space-y-12">
          <HeroFormSlider
            id={`${id}-loan-amount`}
            label="Lånebeløb"
            value={loanAmount}
            onValueChange={setLoanAmount}
            min={200_000}
            max={5_000_000}
            step={50_000}
          />

          {creditPurpose === CreditPurpose.Purchase && (
            <HeroFormSlider
              id={`${id}-payout`}
              label="Din udbetaling til boligkøbet"
              value={payout}
              onValueChange={setPayout}
              min={0}
              max={1_250_000}
              step={25_000}
            />
          )}

          {creditPurpose === CreditPurpose.Supplement && (
            <HeroFormSlider
              id={`${id}-equity`}
              label="Friværdi i boligen"
              value={equity}
              onValueChange={setEquity}
              min={200_000}
              max={5_000_000}
              step={50_000}
            />
          )}
        </div>

        <div className="mt-6 text-center md:mt-8.5">
          <BaseCtaButton type="submit">Start låneansøgning</BaseCtaButton>
        </div>
      </form>
    </div>
  )
}
