'use client'

import dayjs from 'dayjs'
import { Edit, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import type { FormItemWithAttachments, FormMileage } from '@/lib/db/schema'

interface ItemDisplayProps {
  item: FormItemWithAttachments
  onEdit: () => void
  onRemove: () => void
}

export function ItemDisplay({ item, onEdit, onRemove }: ItemDisplayProps) {
  const t = useTranslations('ExpenseForm')

  return (
    <Card
      size="small"
      className="mb-4"
      title={
        <div className="flex items-center justify-between">
          <span>{t('expense_item')}</span>
          <div className="flex gap-2">
            <Button onClick={onEdit} variant="ghost" size="small">
              <Edit className="h-4 w-4" />
              {t('edit')}
            </Button>
            <Button onClick={onRemove} variant="danger" size="small">
              <Trash2 className="h-4 w-4" />
              {t('remove')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <strong>{dayjs(item.date).format('DD.MM.YYYY')}</strong>
          <Tag color="green">
            {item.attachments.length}{' '}
            {t('attachments', { attachments: item.attachments.length })}
          </Tag>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span>{item.description}</span>
          <Tag className="h-fit" color="blue">
            {item.attachments
              .reduce((acc, attachment) => acc + (attachment.value || 0), 0)
              .toFixed(2)}
            {' €'}
          </Tag>
        </div>
      </div>
    </Card>
  )
}

interface MileageDisplayProps {
  mileage: FormMileage
  mileageRate: number
  onEdit: () => void
  onRemove: () => void
}

export function MileageDisplay({
  mileage,
  mileageRate,
  onEdit,
  onRemove
}: MileageDisplayProps) {
  const t = useTranslations('ExpenseForm')
  const total = mileage.distance * mileageRate

  return (
    <Card
      size="small"
      className="mb-4"
      title={
        <div className="flex items-center justify-between">
          <span>{t('mileage')}</span>
          <div className="flex gap-2">
            <Button onClick={onEdit} variant="ghost" size="small">
              <Edit className="h-4 w-4" />
              {t('edit')}
            </Button>
            <Button onClick={onRemove} variant="danger" size="small">
              <Trash2 className="h-4 w-4" />
              {t('remove')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <strong>{dayjs(mileage.date).format('DD.MM.YYYY')}</strong>
          <Tag className="h-fit" color="green">
            {`${mileage.distance} km`}
          </Tag>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span>{mileage.description}</span>
          <Tag className="h-fit" color="blue">
            {`${total.toFixed(2)} €`}
          </Tag>
        </div>
        <div className="text-sm text-gray-600">
          <div>
            <strong>{`${t('route')}:`}</strong> {mileage.route}
          </div>
          <div>
            <strong>{`${t('plate_number')}:`}</strong>{' '}
            {mileage.plateNo.toUpperCase()}
          </div>
        </div>
      </div>
    </Card>
  )
}
