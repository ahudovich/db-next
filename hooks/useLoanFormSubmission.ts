import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  addDebtorToCase,
  addPropertyToCase,
  createCase,
  getClientIpAddress,
  getGaClientId,
  updateCase,
  updateDebtorCpr,
} from '@/services/api'
import type { AddDebtorRequest, CreateCaseRequest, UpdateCaseRequest } from '@/services/api'
import type { LoanFormState } from '@/types/loan-form'

/**
 * Custom hook to manage the multi-step loan form submission process
 * Handles the sequential API calls as the user progresses through the form
 */
export function useLoanFormSubmission() {
  const [caseId, setCaseId] = useState<string | null>(null)
  const [primaryDebtorCprFromApi, setPrimaryDebtorCprFromApi] = useState<string | null>(null)

  // Step 1: Create case mutation
  const createCaseMutation = useMutation({
    mutationFn: async (formData: LoanFormState) => {
      // Get IP address and GA client ID
      const ipAddress = await getClientIpAddress()
      const gaClientId = getGaClientId()

      const primaryDebtor = formData.debtors[0]

      const requestData: CreateCaseRequest = {
        creditPurpose: formData.base.creditPurpose!,
        deposit: formData.base.equity || 0,
        propertyValue: formData.aiPricing.currentListingPrice || 0,
        specifiedFinancingNeed: formData.base.loanAmount || 0,
        source: formData.entryPath || 'unknown',
        debtors: [
          {
            firstName: primaryDebtor.firstName,
            lastName: primaryDebtor.lastName,
            phoneNumber: primaryDebtor.phoneNumber,
            email: primaryDebtor.email,
          },
        ],
        clientDescription: formData.comment || undefined,
        utmSource: undefined, // Can be populated from URL params
        gaClientId,
        consentTerms: formData.consentTerms,
        consentMarketing: formData.consentMarketing,
        ipAddress,
      }

      return createCase(requestData)
    },
    onSuccess: (data) => {
      setCaseId(data.caseId)
      // Save the primary debtor's CPR number returned from the API
      if (data.debtors && data.debtors.length > 0) {
        setPrimaryDebtorCprFromApi(data.debtors[0].cprNumber)
      }
    },
  })

  // Step 2: Add property mutation
  const addPropertyMutation = useMutation({
    mutationFn: async ({ propertyId }: { propertyId: string }) => {
      if (!caseId) {
        throw new Error('Case ID not found. Please create a case first.')
      }
      return addPropertyToCase(caseId, propertyId)
    },
  })

  // Step 6: Update case with living conditions, marital status, and children
  const updateCaseMutation = useMutation({
    mutationFn: async (formData: LoanFormState) => {
      if (!caseId) {
        throw new Error('Case ID not found. Please create a case first.')
      }

      const requestData: UpdateCaseRequest = {
        maritalStatus: formData.maritalStatus || undefined,
        housingConditions: formData.housingConditions || undefined,
        numberOfChildren: formData.numberOfChildren || undefined,
        agesOfChildren: formData.agesOfChildren.length > 0 ? formData.agesOfChildren : undefined,
        // numberOfOwnedCars: 0, // Not currently tracked in the form
      }

      return updateCase(caseId, requestData)
    },
  })

  // Step 7: Update primary debtor with CPR number
  const updatePrimaryDebtorCprMutation = useMutation({
    mutationFn: async ({ cprNumber }: { cprNumber: string }) => {
      if (!caseId) {
        throw new Error('Case ID not found. Please create a case first.')
      }
      if (!primaryDebtorCprFromApi) {
        throw new Error('Primary debtor CPR from API not found.')
      }

      return updateDebtorCpr(caseId, primaryDebtorCprFromApi, { cprNumber })
    },
  })

  // Step 7: Add additional debtors
  const addAdditionalDebtorMutation = useMutation({
    mutationFn: async ({ cprNumber, debtor }: { cprNumber: string; debtor: AddDebtorRequest }) => {
      if (!caseId) {
        throw new Error('Case ID not found. Please create a case first.')
      }

      return addDebtorToCase(caseId, cprNumber, debtor)
    },
  })

  // Helper function to submit all debtors
  const submitAllDebtors = async (formData: LoanFormState) => {
    const primaryDebtor = formData.debtors[0]

    // Update primary debtor with CPR if available
    if (primaryDebtor.cprNumber) {
      await updatePrimaryDebtorCprMutation.mutateAsync({
        cprNumber: primaryDebtor.cprNumber,
      })
    }

    // Add additional debtors
    const additionalDebtors = formData.debtors.slice(1)
    for (const debtor of additionalDebtors) {
      if (debtor.cprNumber) {
        await addAdditionalDebtorMutation.mutateAsync({
          cprNumber: debtor.cprNumber,
          debtor: {
            firstName: debtor.firstName,
            lastName: debtor.lastName,
            phoneNumber: debtor.phoneNumber,
            email: debtor.email,
          },
        })
      }
    }
  }

  // Combined mutation for submitting all debtors
  const submitDebtorsMutation = useMutation({
    mutationFn: submitAllDebtors,
  })

  return {
    caseId,
    createCaseMutation,
    addPropertyMutation,
    updateCaseMutation,
    updatePrimaryDebtorCprMutation,
    addAdditionalDebtorMutation,
    submitDebtorsMutation,
  }
}
