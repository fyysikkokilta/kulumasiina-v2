import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useCallback } from 'react'

import type { MileageFormData } from '@/components/MileageForm'
import type { Mileage, NewMileage } from '@/lib/db/schema'

export function useMileageForm(form: FormInstance<MileageFormData>) {
  // Load existing mileage data for editing
  const loadExistingMileage = useCallback(
    (editData: Omit<Mileage | NewMileage, 'entryId'>) => {
      form.setFieldsValue({
        description: editData.description,
        date: dayjs(editData.date),
        route: editData.route,
        distance: editData.distance,
        plateNo: editData.plateNo,
        account: editData.account || undefined
      })
    },
    [form]
  )

  // Save mileage data
  const saveMileage = useCallback(async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()

      const mileageData = {
        description: values.description,
        date: values.date.toDate(),
        route: values.route,
        distance: values.distance,
        plateNo: values.plateNo,
        account: values.account || null
      }

      return mileageData
    } catch (error) {
      console.error('Form validation failed:', error)
      return null
    }
  }, [form])

  // Reset form
  const resetForm = useCallback(() => {
    form.resetFields()
  }, [form])

  return {
    loadExistingMileage,
    saveMileage,
    resetForm
  }
}
