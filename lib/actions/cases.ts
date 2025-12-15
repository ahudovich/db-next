'use server'

import { z } from 'zod'
import { CreditPurpose } from '@/enums/form/CreditPurpose.enum'
import { HousingCondition } from '@/enums/form/HousingCondition.enum'
import { MaritalStatus } from '@/enums/form/MaritalStatus.enum'
import { env } from '@/env'

const SOURCE = 'danskboliglaan'
const BASE_URL = `${env.SIMPEL_KREDIT_API_URL}/cases`

const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${env.SIMPEL_KREDIT_TOKEN}`,
  'Content-Type': 'application/json',
}

/**
 * Creates a case
 */
const createCaseSchema = z.object({
  base: z
    .object({
      creditPurpose: z.enum(CreditPurpose),
      loanAmount: z.number().min(1, 'Loan amount is missing'),
      payout: z.number().min(1).nullable().optional(),
      equity: z.number().min(1).nullable().optional(),
    })
    .refine((data) => (data.payout && !data.equity) || (!data.payout && data.equity), {
      message: 'Either payout or equity is required, but not both',
    }),
  debtor: z.object({
    firstName: z.string().min(1, 'First name is missing'),
    lastName: z.string().min(1, 'Last name is missing'),
    phoneNumber: z.string().min(1, 'Phone number is missing'),
    email: z.email('Invalid email address').min(1, 'Email is missing'),
  }),
})

type CreateCaseResponse =
  | { status: 'success'; data: { caseId: string; temporaryCprNumber: string } }
  | { status: 'error'; error: string }

export async function createCaseAction(
  data: z.infer<typeof createCaseSchema>
): Promise<CreateCaseResponse> {
  try {
    const result = createCaseSchema.safeParse(data)

    if (!result.success) {
      throw result.error
    }

    const body: any = {
      creditPurpose: result.data.base.creditPurpose,
      specifiedFinancingNeed: result.data.base.loanAmount,
      source: SOURCE,
      debtors: [result.data.debtor],
    }

    // Only one is ever set, so include whichever is non-null
    if (data.base.payout !== null) {
      body.deposit = data.base.payout ?? 0
    } else if (data.base.equity !== null) {
      body.propertyValue = data.base.equity ?? 0
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('API error')
    }

    const responseData = (await response.json()) as {
      data: {
        caseId: string
        debtors: Array<{
          cprNumber: string // temporary CPR number
        }>
      }
    }

    return {
      status: 'success',
      data: {
        caseId: responseData.data.caseId,
        temporaryCprNumber: responseData.data.debtors[0].cprNumber,
      },
    }
  } catch (error) {
    console.error(error)

    return {
      status: 'error',
      error: 'Failed to create case.',
    }
  }
}

/**
 * Updates a case with a property ID
 */
const updateCasePropertyIdSchema = z.object({
  caseId: z.string().min(1, 'Case ID is missing'),
  propertyId: z.string().min(1, 'Property ID is missing'),
})

// prettier-ignore
type UpdateCasePropertyIdResponse =
  | { status: 'success' }
  | { status: 'error'; error: string }

export async function updateCasePropertyIdAction(
  data: z.infer<typeof updateCasePropertyIdSchema>
): Promise<UpdateCasePropertyIdResponse> {
  try {
    const result = updateCasePropertyIdSchema.safeParse(data)

    if (!result.success) {
      throw result.error
    }

    const response = await fetch(
      `${BASE_URL}/${result.data.caseId}/addProperty/${result.data.propertyId}`,
      {
        method: 'PUT',
        headers: HEADERS,
      }
    )

    if (!response.ok) {
      throw new Error('API error')
    }

    return {
      status: 'success',
    }
  } catch (error) {
    console.error(error)

    return {
      status: 'error',
      error: 'Failed to update case with property ID.',
    }
  }
}

/**
 * Updates a case with housing conditions, marital status, and children
 */
const updateCaseLifeSituationSchema = z.object({
  caseId: z.string().min(1, 'Case ID is missing'),
  housingConditions: z.enum(HousingCondition),
  maritalStatus: z.enum(MaritalStatus),
  numberOfChildren: z.number().nullable(),
  agesOfChildren: z.array(z.number()),
})

// prettier-ignore
type UpdateCaseLifeSituationResponse =
  | { status: 'success' }
  | { status: 'error'; error: string }

export async function updateCaseLifeSituationAction(
  data: z.infer<typeof updateCaseLifeSituationSchema>
): Promise<UpdateCaseLifeSituationResponse> {
  try {
    const result = updateCaseLifeSituationSchema.safeParse(data)

    if (!result.success) {
      throw result.error
    }

    const response = await fetch(`${BASE_URL}/${result.data.caseId}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        housingConditions: result.data.housingConditions,
        maritalStatus: result.data.maritalStatus,
        numberOfChildren: result.data.numberOfChildren,
        agesOfChildren: result.data.agesOfChildren,
      }),
    })

    if (!response.ok) {
      throw new Error('API error')
    }

    return {
      status: 'success',
    }
  } catch (error) {
    console.error(error)

    return {
      status: 'error',
      error: 'Failed to update case with life situation.',
    }
  }
}

/**
 * Saves debtors information to a case
 */
const saveCaseDebtorSchema = z.object({
  caseId: z.string().min(1, 'Case ID is missing'),
  mainDebtor: z.object({
    oldCprNumber: z.string().min(1, 'Old CPR number is missing'), // temporary CPR number
    newCprNumber: z.string().min(1, 'New CPR number is missing'),
  }),
  additionalDebtors: z
    .array(
      z.object({
        firstName: z.string().min(1, 'First name is missing'),
        lastName: z.string().min(1, 'Last name is missing'),
        email: z.email('Invalid email address').min(1, 'Email is missing'),
        phoneNumber: z.string().min(1, 'Phone number is missing'),
        cprNumber: z.string().min(1, 'CPR number is missing'),
      })
    )
    .nullable(),
})

// prettier-ignore
type SaveCaseDebtorResponse =
  | { status: 'success' }
  | { status: 'error'; error: string }

export async function saveCaseDebtorsAction(
  data: z.infer<typeof saveCaseDebtorSchema>
): Promise<SaveCaseDebtorResponse> {
  try {
    const result = saveCaseDebtorSchema.safeParse(data)

    if (!result.success) {
      throw result.error
    }

    // Save main debtor first
    const mainDebtorResponse = await fetch(
      `${BASE_URL}/${result.data.caseId}/addDebtor/${result.data.mainDebtor.oldCprNumber}`,
      {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify({
          cprNumber: result.data.mainDebtor.newCprNumber.replace('-', ''),
        }),
      }
    )

    if (!mainDebtorResponse.ok) {
      throw new Error('API error')
    }

    if (!result.data.additionalDebtors) {
      return { status: 'success' }
    }

    // Save additional debtors
    const promisesArray = result.data.additionalDebtors.map((debtor) => {
      const cprNumber = debtor.cprNumber.replace('-', '')

      return fetch(`${BASE_URL}/${result.data.caseId}/addDebtor/${cprNumber}`, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify({
          firstName: debtor.firstName,
          lastName: debtor.lastName,
          email: debtor.email,
          phoneNumber: debtor.phoneNumber,
        }),
      })
    })

    const additionalDebtorsResponses = await Promise.all(promisesArray ?? [])

    for (const response of additionalDebtorsResponses) {
      if (!response.ok) {
        throw new Error('API error')
      }
    }

    return { status: 'success' }
  } catch (error) {
    console.error(error)

    return {
      status: 'error',
      error: 'Failed to save debtors information to a case.',
    }
  }
}
