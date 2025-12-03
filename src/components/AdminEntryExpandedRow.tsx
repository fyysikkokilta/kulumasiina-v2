import { Button, Select, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

import { bookkeepingAccounts } from '@/lib/bookkeeping-accounts'
import type { ItemWithAttachments, Mileage } from '@/lib/db/schema'
import type { EntryWithItemsAndMileages } from '@/lib/db/schema'
import { env } from '@/lib/env'

interface AdminEntryExpandedRowProps {
  record: EntryWithItemsAndMileages
  handleAccountUpdate: (id: string, account: string, isMileage: boolean) => void
  handleEditItem: (item: ItemWithAttachments, entryId: string) => void
  handleEditMileage: (mileage: Mileage, entryId: string) => void
  handleArchive: (ids?: string[]) => void
  handleApprove: (ids?: string[]) => void
  handleDeny: (ids?: string[]) => void
  handlePay: (ids?: string[]) => void
  handleReset: (ids?: string[]) => void
  handlePreviewAttachment: (
    fileId: string,
    filename: string,
    isNotReceipt: boolean,
    value: number | null
  ) => void
}

export function AdminEntryExpandedRow({
  record,
  handleAccountUpdate,
  handleEditItem,
  handleEditMileage,
  handleArchive,
  handleApprove,
  handleDeny,
  handlePay,
  handleReset,
  handlePreviewAttachment
}: AdminEntryExpandedRowProps) {
  const t = useTranslations('admin')
  return (
    <div className="rounded border border-gray-200 bg-white p-4 shadow">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
        <Typography.Text className="text-nowrap" strong>
          {`${t('table.title')}: `}
        </Typography.Text>
        <Typography.Text>{record.title}</Typography.Text>
      </div>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
        <Typography.Text className="text-nowrap" strong>
          {`${t('table.contact')}: `}
        </Typography.Text>
        <Typography.Text>{record.contact}</Typography.Text>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
        <Typography.Text className="text-nowrap" strong>
          {`${t('table.iban')}: `}
        </Typography.Text>
        <Typography.Text>{record.iban}</Typography.Text>
      </div>

      {record.items.length > 0 && (
        <div className="mb-4">
          <Typography.Text className="text-nowrap" strong>
            {`${t('table.items')}: `}
          </Typography.Text>
          {record.items.map((item) => (
            <div
              key={item.id}
              className="mt-2 ml-4 rounded border border-gray-100 bg-gray-50 p-2"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography.Text className="text-gray-600">
                    {`${dayjs(item.date).format('DD.MM.YYYY')} - `}
                    {item.attachments
                      .reduce((acc, att) => {
                        if (att.isNotReceipt) {
                          return acc
                        }
                        return acc + (att.value || 0)
                      }, 0)
                      .toFixed(2)}
                    {' €'}
                  </Typography.Text>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      size="small"
                      value={item.account || undefined}
                      placeholder={t('table.select_account')}
                      style={{ minWidth: 200 }}
                      showSearch={{
                        optionFilterProp: 'children',
                        filterOption: (input, option) =>
                          (option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                      }}
                      disabled={!!record.archived}
                      options={bookkeepingAccounts.map((account) => ({
                        value: account.value,
                        label: account.label
                      }))}
                      onChange={(value) =>
                        handleAccountUpdate(item.id, value, false)
                      }
                    />
                    <Button
                      size="small"
                      onClick={() => handleEditItem(item, record.id)}
                      disabled={!!record.archived}
                    >
                      {t('actions.edit')}
                    </Button>
                  </div>
                </div>
                <Typography.Text className="text-sm text-gray-600">
                  {`${t('table.description')}: ${item.description}`}
                </Typography.Text>
                {item.attachments.length > 0 && (
                  <div className="mt-2 flex items-start gap-2">
                    <Typography.Text className="text-sm whitespace-nowrap text-gray-600">
                      {`${t('table.attachments')}: `}
                    </Typography.Text>
                    <div className="flex flex-wrap gap-3">
                      {item.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <Button
                            type="link"
                            size="small"
                            className="h-auto p-0 text-blue-600 hover:text-blue-800"
                            onClick={() =>
                              handlePreviewAttachment(
                                attachment.fileId,
                                attachment.filename,
                                attachment.isNotReceipt,
                                attachment.value
                              )
                            }
                          >
                            {attachment.filename}
                          </Button>
                          {attachment.isNotReceipt ? (
                            <Tag color="orange">{t('table.not_receipt')}</Tag>
                          ) : attachment.value ? (
                            <Tag color="blue">{`${attachment.value.toFixed(2)} €`}</Tag>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {record.mileages.length > 0 && (
        <div className="mb-4">
          <Typography.Text className="text-nowrap" strong>
            {`${t('table.mileages')}: `}
          </Typography.Text>
          {record.mileages.map((mileage) => (
            <div
              key={mileage.id}
              className="mt-2 ml-4 rounded border border-gray-100 bg-gray-50 p-2"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography.Text className="text-gray-600">
                    {`${dayjs(mileage.date).format('DD.MM.YYYY')} - ${mileage.distance} km - `}
                    {`${(mileage.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE).toFixed(2)} €`}
                  </Typography.Text>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      size="small"
                      value={mileage.account || undefined}
                      placeholder={t('table.select_account')}
                      style={{ minWidth: 200 }}
                      disabled={!!record.archived}
                      showSearch={{
                        optionFilterProp: 'children',
                        filterOption: (input, option) =>
                          (option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                      }}
                      options={bookkeepingAccounts.map((account) => ({
                        value: account.value,
                        label: account.label
                      }))}
                      onChange={(value) =>
                        handleAccountUpdate(mileage.id, value, true)
                      }
                    />
                    <Button
                      size="small"
                      onClick={() => handleEditMileage(mileage, record.id)}
                      disabled={!!record.archived}
                    >
                      {t('actions.edit')}
                    </Button>
                  </div>
                </div>
                <Typography.Text className="text-sm text-gray-600">
                  {`${t('table.description')}: ${mileage.description}`}
                </Typography.Text>
                <Typography.Text className="text-sm text-gray-600">
                  {`${t('table.route')}: ${mileage.route}`}
                </Typography.Text>
                <Typography.Text className="text-sm text-gray-600">
                  {`${t('table.plate_number')}: ${mileage.plateNo}`}
                </Typography.Text>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <Typography.Text className="text-nowrap" strong>
          {`${t('table.id')}: `}
        </Typography.Text>
        <Typography.Text className="text-nowrap">{record.id}</Typography.Text>
      </div>

      <div className="mt-4">
        <Space>
          {record.status === 'submitted' && (
            <>
              <Button onClick={() => handleApprove([record.id])}>
                {t('actions.approve')}
              </Button>
              <Button onClick={() => handleDeny([record.id])}>
                {t('actions.deny')}
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button onClick={() => handlePay([record.id])}>
              {t('actions.pay')}
            </Button>
          )}
          {record.status !== 'submitted' && !record.archived && (
            <Button onClick={() => handleReset([record.id])}>
              {t('actions.reset')}
            </Button>
          )}
          {(record.status === 'paid' || record.status === 'denied') &&
            !record.archived && (
              <Button danger onClick={() => handleArchive([record.id])}>
                {t('actions.archive')}
              </Button>
            )}
        </Space>
      </div>
    </div>
  )
}
