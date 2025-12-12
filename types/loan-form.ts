import type { CreditPurpose } from '@/enums/form/CreditPurpose.enum'
import type { HousingCondition } from '@/enums/form/HousingCondition.enum'
import type { MaritalStatus } from '@/enums/form/MaritalStatus.enum'
import type { DawaAddressAutocompleteResult } from '@/types/dawa'

export enum EntryPath {
  Planner = 'planner',
  Dreamer = 'dreamer',
}

export type NumberOfDebtors = 1 | 2 | 3 | 4

export interface LoanFormState {
  entryPath: EntryPath | null

  base: {
    creditPurpose: CreditPurpose | null
    loanAmount: number | null
    payout: number | null
    equity: number | null
  }

  property: {
    address: string
    dawaResult: DawaAddressAutocompleteResult | null
  }

  aiPricing: {
    currentListingPrice: number | null
    pricePerSqm: number | null
  }

  // Debtors
  numberOfDebtors: NumberOfDebtors | null
  debtors: Array<{
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
    cprNumber: string | null // Could be unavailable on the first form step
  }>

  // Life situation
  maritalStatus: MaritalStatus | null
  housingConditions: HousingCondition | null

  // Children
  numberOfChildren: number | null
  agesOfChildren: Array<number>

  // Consents
  consentTerms: boolean
  consentMarketing: boolean

  // Optional comment
  comment: string | null
}
