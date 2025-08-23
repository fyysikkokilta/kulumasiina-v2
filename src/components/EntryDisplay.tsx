'use client'

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import type { NewAttachment, NewItemWithAttachments, NewMileage } from '@/lib/db/schema'

const { Text } = Typography

interface ItemDisplayProps {
  item: Omit<NewItemWithAttachments, 'entryId' | 'attachments'> & {
    attachments: Omit<NewAttachment, 'itemId'>[]
  }
  onEdit: () => void
  onRemove: () => void
}

export function ItemDisplay({ item, onEdit, onRemove }: ItemDisplayProps) {
  const t = useTranslations('form.main')

  return (
    <Card
      size="small"
      className="mb-4"
      title={
        <div className="flex items-center justify-between">
          <span>{t('expense_item')}</span>
          <div className="space-x-2">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={onEdit}>
              {t('edit')}
            </Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={onRemove}>
              {t('remove')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <Text strong>{dayjs(item.date).format('DD.MM.YYYY')}</Text>
          <Tag color="green">
            {item.attachments.length} {t('attachments', { attachments: item.attachments.length })}
          </Tag>
        </div>
        <div className="flex items-start justify-between gap-4">
          <Text>{item.description}</Text>
          <Tag className="h-fit" color="blue">
            {item.attachments
              .reduce((acc, attachment) => acc + (attachment.value || 0), 0)
              .toFixed(2)}{' '}
            €
          </Tag>
        </div>
      </div>
    </Card>
  )
}

interface MileageDisplayProps {
  mileage: Omit<NewMileage, 'entryId'>
  mileageRate: number
  onEdit: () => void
  onRemove: () => void
}

export function MileageDisplay({ mileage, mileageRate, onEdit, onRemove }: MileageDisplayProps) {
  const t = useTranslations('form.main')
  const total = mileage.distance * mileageRate

  return (
    <Card
      size="small"
      className="mb-4"
      title={
        <div className="flex items-center justify-between">
          <span>{t('mileage')}</span>
          <div className="space-x-2">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={onEdit}>
              {t('edit')}
            </Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={onRemove}>
              {t('remove')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <Text strong>{dayjs(mileage.date).format('DD.MM.YYYY')}</Text>
          <Tag className="h-fit" color="green">
            {mileage.distance} km
          </Tag>
        </div>
        <div className="flex items-start justify-between gap-4">
          <Text>{mileage.description}</Text>
          <Tag className="h-fit" color="blue">
            {total.toFixed(2)} €
          </Tag>
        </div>
        <div className="text-sm text-gray-600">
          <div>
            <strong>{t('route')}:</strong> {mileage.route}
          </div>
          <div>
            <strong>{t('plate_number')}:</strong> {mileage.plateNo.toUpperCase()}
          </div>
        </div>
      </div>
    </Card>
  )
}
