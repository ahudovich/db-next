'use server'

import { z } from 'zod'
import { CreditPurpose } from '@/enums/form/CreditPurpose.enum'
import { env } from '@/env'

const SOURCE = 'danskboliglaan'

const BASE_URL = `${env.SIMPEL_KREDIT_API_URL}/cases`
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${env.SIMPEL_KREDIT_TOKEN}`,
  'Content-Type': 'application/json',
}

const createCaseSchema = z.object({
  base: z
    .object({
      creditPurpose: z.enum(CreditPurpose),
      loanAmount: z.number().min(1, 'Loan amount is required'),
      payout: z.number().min(1).nullable().optional(),
      equity: z.number().min(1).nullable().optional(),
    })
    .refine((data) => (data.payout && !data.equity) || (!data.payout && data.equity), {
      message: 'Either payout or equity is required, but not both',
    }),
  debtor: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    email: z.email('Invalid email address').min(1, 'Email is required'),
  }),
})

type CreateCaseResponse =
  | { status: 'success'; data: { caseId: string } }
  | { status: 'error'; error: string }

/**
 * Creates a case in the Simpel Kredit API
 * @param data - The data to create the case with
 * @returns The response data from the API
 */
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
      }
    }

    return {
      status: 'success',
      data: {
        caseId: responseData.data.caseId,
      },
    }
  } catch (error) {
    console.error(error)

    // Other errors
    return {
      status: 'error',
      error: 'Failed to create project. Please try again.',
    }
  }
}
