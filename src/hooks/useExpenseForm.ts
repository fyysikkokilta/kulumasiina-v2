import { friendlyFormatIBAN } from 'ibantools'
import { useAction } from 'next-safe-action/hooks'
import { useCallback, useMemo, useState } from 'react'

import { createEntryAction } from '@/lib/actions/createEntry'
import type { NewItemWithAttachments, NewMileage } from '@/lib/db/schema'
import { env } from '@/lib/env'

// Types
export interface ExpenseFormData {
  name: string
  contact: string
  iban: string
  govId?: string
  title: string
}

type EntryType = 'item' | 'mileage'

export type FormEntry = {
  id: number
} & (
  | {
      type: 'item'
      data: Omit<NewItemWithAttachments, 'entryId'>
    }
  | {
      type: 'mileage'
      data: Omit<NewMileage, 'entryId'>
    }
)

interface FormState {
  status: 'idle' | 'success' | 'failure'
  entries: FormEntry[]
  modalState: {
    type: EntryType | null
    isOpen: boolean
    editingId: number | null
  }
}

export function useExpenseForm() {
  const [state, setState] = useState<FormState>({
    status: 'idle',
    entries: [],
    modalState: {
      type: null,
      isOpen: false,
      editingId: null
    }
  })

  // Server action
  const { execute, status: actionStatus } = useAction(createEntryAction, {
    onSuccess: () => {
      setState({
        status: 'success',
        entries: [],
        modalState: { type: null, isOpen: false, editingId: null }
      })
    },
    onError: (error) => {
      console.error('Form submission error:', error)
      setState((prev) => ({ ...prev, status: 'failure' }))
    }
  })

  // Computed values
  const hasMileages = useMemo(
    () => state.entries.some((entry) => entry.type === 'mileage'),
    [state.entries]
  )

  const total = useMemo(() => {
    return state.entries.reduce((sum, entry) => {
      if (entry.type === 'mileage') {
        const mileage = entry.data
        return sum + mileage.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE
      } else {
        const item = entry.data
        if (item.attachments) {
          const itemTotal = item.attachments.reduce((itemSum, attachment) => {
            if (!attachment.isNotReceipt && attachment.value) {
              return itemSum + attachment.value
            }
            return itemSum
          }, 0)
          return sum + itemTotal
        }
      }
      return sum
    }, 0)
  }, [state.entries])

  const editingEntry = useMemo(() => {
    if (!state.modalState.editingId) return null
    return state.entries.find((entry) => entry.id === state.modalState.editingId)
  }, [state.modalState.editingId, state.entries])

  // Handlers
  const handleSubmit = useCallback(
    (values: ExpenseFormData) => {
      if (state.entries.length === 0) {
        return
      }

      const items = state.entries
        .filter((entry) => entry.type === 'item')
        .map((entry) => entry.data)

      const mileages = state.entries
        .filter((entry) => entry.type === 'mileage')
        .map((entry) => entry.data)

      execute({
        ...values,
        iban: friendlyFormatIBAN(values.iban.replace(/\s/g, ''))!,
        items,
        mileages
      })
    },
    [state.entries, execute]
  )

  const openModal = useCallback((type: EntryType, editingId?: number) => {
    setState((prev) => ({
      ...prev,
      modalState: {
        type,
        isOpen: true,
        editingId: editingId || null
      }
    }))
  }, [])

  const closeModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalState: {
        type: null,
        isOpen: false,
        editingId: null
      }
    }))
  }, [])

  const handleAddOrUpdateEntry = useCallback((data: FormEntry) => {
    setState((prev) => {
      const { editingId } = prev.modalState
      const newEntries = [...prev.entries]

      if (editingId) {
        const index = newEntries.findIndex((entry) => entry.id === editingId)
        if (index !== -1) {
          newEntries[index] = { ...newEntries[index], ...data }
        }
      } else {
        newEntries.push({
          ...data,
          id: Date.now()
        })
      }

      return {
        ...prev,
        entries: newEntries,
        modalState: { type: null, isOpen: false, editingId: null }
      }
    })
  }, [])

  const handleRemoveEntry = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id)
    }))
  }, [])

  const resetForm = useCallback(() => {
    setState({
      status: 'idle',
      entries: [],
      modalState: { type: null, isOpen: false, editingId: null }
    })
  }, [])

  return {
    state,
    actionStatus,
    hasMileages,
    total,
    editingEntry,
    handleSubmit,
    openModal,
    closeModal,
    handleAddOrUpdateEntry,
    handleRemoveEntry,
    resetForm
  }
}
