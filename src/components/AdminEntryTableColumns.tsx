import { Button, DatePicker, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

import { EntryWithItemsAndMileages } from '@/lib/db/schema'

type TFunction = ReturnType<typeof useTranslations>

export function getAdminEntryTableColumns(
  t: TFunction,
  getStatusColor: (status: string) => string,
  getStatusText: (status: string) => string,
  entries: EntryWithItemsAndMileages[]
) {
  const columns: ColumnsType<EntryWithItemsAndMileages> = [
    {
      title: t('table.date'),
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date: string) => new Date(date).toLocaleDateString('fi-FI'),
      sorter: (a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime(),
      defaultSortOrder: 'descend',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div className="p-2">
          <DatePicker.RangePicker
            value={
              selectedKeys[0]
                ? [dayjs(selectedKeys[0] as string), dayjs(selectedKeys[1] as string)]
                : null
            }
            onChange={(dates) => {
              if (dates) {
                setSelectedKeys([dates[0]?.toISOString() || '', dates[1]?.toISOString() || ''])
              } else {
                setSelectedKeys([])
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button size="small" onClick={() => confirm()}>
              {t('filter.filter')}
            </Button>
            <Button size="small" onClick={() => clearFilters?.()}>
              {t('filter.reset')}
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => {
        const date = new Date(record.submissionDate)
        const dates = value as unknown as [string, string]
        return date >= new Date(dates[0]) && date <= new Date(dates[1])
      },
      width: 120
    },
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      filterSearch: true,
      filters: [...new Set(entries.map((entry) => entry.name))].map((name) => ({
        text: name,
        value: name
      })),
      onFilter: (value, record) => record.name === value,
      width: 180
    },
    {
      title: t('table.title'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (title.length > 24 ? title.slice(0, 24) + '…' : title),
      width: 220
    },
    {
      title: t('table.total'),
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `${total.toFixed(2)} €`,
      width: 110
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
      filters: [
        { text: t('filter.submitted'), value: 'submitted' },
        { text: t('filter.approved'), value: 'approved' },
        { text: t('filter.paid'), value: 'paid' },
        { text: t('filter.denied'), value: 'denied' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 120
    },
    {
      title: t('table.archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: (archived: boolean) => (
        <Tag color={archived ? 'gray' : 'green'}>
          {archived ? t('status.archived') : t('status.active')}
        </Tag>
      ),
      filters: [
        { text: t('status.archived'), value: true },
        { text: t('status.active'), value: false }
      ],
      onFilter: (value, record) => record.archived === value,
      defaultFilteredValue: ['false'],
      width: 110
    },
    {
      title: t('table.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => window.open(`/api/entry/${record.id}/pdf`)}>
            {t('actions.pdf')}
          </Button>
          {(record.status === 'paid' || record.status === 'approved') && (
            <Button size="small" onClick={() => window.open(`/api/entry/${record.id}/csv`)}>
              {record.status === 'paid' ? t('actions.zip') : t('actions.csv')}
            </Button>
          )}
        </Space>
      ),
      width: 140
    }
  ]
  return columns
}
