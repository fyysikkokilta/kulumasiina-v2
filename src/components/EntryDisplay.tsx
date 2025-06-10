'use client'

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import type { NewItemWithAttachments, NewMileage } from '@/lib/db/schema'

const { Text } = Typography

interface ItemDisplayProps {
  item: Omit<NewItemWithAttachments, 'entryId'>
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
        <div className="flex justify-between">
          <Text strong>{dayjs(item.date).format('DD.MM.YYYY')}</Text>
          <Tag color="green">
            {item.attachments.length} {t('attachments', { attachments: item.attachments.length })}
          </Tag>
        </div>
        <Text>{item.description}</Text>
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
        <div className="flex justify-between">
          <Text strong>{dayjs(mileage.date).format('DD.MM.YYYY')}</Text>
          <Tag color="blue">
            {mileage.distance} km → {total.toFixed(2)} €
          </Tag>
        </div>
        <Text>{mileage.description}</Text>
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
