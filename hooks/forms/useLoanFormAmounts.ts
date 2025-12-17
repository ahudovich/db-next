import { useState } from 'react'
import { useLoanFormContext } from '@/contexts/loan-form'
import { CreditPurpose } from '@/enums/form/CreditPurpose.enum'

export function useLoanFormAmounts() {
  const [loanAmount, setLoanAmount] = useState<Array<number>>([1_000_000])
  const [payout, setPayout] = useState<Array<number>>([100_000])
  const [equity, setEquity] = useState<Array<number>>([1_000_000])
  const [creditPurpose, setCreditPurpose] = useState<CreditPurpose>(CreditPurpose.Purchase)

  const { updateFormData } = useLoanFormContext()

  function updateData() {
    updateFormData({
      base: {
        creditPurpose,
        loanAmount: loanAmount[0],
        payout: creditPurpose === CreditPurpose.Purchase ? payout[0] : null,
        equity: creditPurpose === CreditPurpose.Supplement ? equity[0] : null,
      },
    })
  }

  return {
    loanAmount,
    setLoanAmount,
    payout,
    setPayout,
    equity,
    setEquity,
    creditPurpose,
    setCreditPurpose,
    updateData,
  }
}
