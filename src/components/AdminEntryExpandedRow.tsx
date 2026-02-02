import { Button as BaseButton } from '@base-ui/react/button'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { type HookActionStatus, useAction } from 'next-safe-action/hooks'

import {
  AccountSelect,
  accountSelectTriggerClass
} from '@/components/AccountSelect'
import type { EditState } from '@/components/AdminEntryModals'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { updateBookkeepingAccountAction } from '@/lib/actions/updateBookkeepingAccount'
import type { EntryWithItemsAndMileages } from '@/lib/db/schema'
import { env } from '@/lib/env'
import {
  prepareAttachmentPreview,
  type PreviewState
} from '@/utils/preview-utils'

interface AdminEntryExpandedRowProps {
  record: EntryWithItemsAndMileages
  onApprove: (ids?: string[]) => void
  onDeny: (ids?: string[]) => void
  onPay: (ids?: string[]) => void
  onReset: (ids?: string[]) => void
  onArchive: (ids?: string[]) => void
  denyStatus?: HookActionStatus
  archiveStatus?: HookActionStatus
  resetStatus?: HookActionStatus
  setEditState: (state: EditState | null) => void
  setPreviewState: (state: PreviewState) => void
}

export function AdminEntryExpandedRow({
  record,
  onApprove,
  onDeny,
  onPay,
  onReset,
  onArchive,
  denyStatus = 'idle',
  archiveStatus = 'idle',
  resetStatus = 'idle',
  setEditState,
  setPreviewState
}: AdminEntryExpandedRowProps) {
  const t = useTranslations('AdminEntryTable')

  const onPreviewAttachment = async (
    fileId: string,
    filename: string,
    isNotReceipt: boolean,
    value: number | null
  ) => {
    const state = await prepareAttachmentPreview({
      fileId,
      filename,
      isNotReceipt,
      value,
      fetchOptions: { next: { revalidate: 60 * 60 * 24 } }
    })
    setPreviewState(state)
  }

  const {
    execute: updateBookkeepingAccount,
    status: updateBookkeepingAccountStatus
  } = useAction(updateBookkeepingAccountAction, {
    onSuccess: () => {},
    onError: () => {}
  })

  return (
    <div className="rounded border border-gray-200 bg-white p-4 shadow">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
        <strong className="text-nowrap">{`${t('table.title')}: `}</strong>
        <span>{record.title}</span>
      </div>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
        <strong className="text-nowrap">{`${t('table.contact')}: `}</strong>
        <span>{record.contact}</span>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
        <strong className="text-nowrap">{`${t('table.iban')}: `}</strong>
        <span>{record.iban}</span>
      </div>

      {record.items.length > 0 && (
        <div className="mb-4">
          <strong className="text-nowrap">{`${t('table.items')}: `}</strong>
          {record.items.map((item) => (
            <div
              key={item.id}
              className="mt-2 ml-4 rounded border border-gray-100 bg-gray-50 p-2"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-gray-600">
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
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <AccountSelect
                      placeholder={
                        t('table.select_account') || t('table.select')
                      }
                      value={item.account || ''}
                      onChange={(value) =>
                        updateBookkeepingAccount({
                          id: item.id,
                          account: value,
                          isMileage: false
                        })
                      }
                      disabled={!!record.archived}
                      actionStatus={updateBookkeepingAccountStatus}
                      triggerClassName={accountSelectTriggerClass}
                      size="sm"
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() =>
                        setEditState({
                          type: 'item',
                          data: item,
                          entryId: record.id
                        })
                      }
                      disabled={!!record.archived}
                    >
                      {t('actions.edit')}
                    </Button>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {`${t('table.description')}: ${item.description}`}
                </span>
                {item.attachments.length > 0 && (
                  <div className="mt-2 flex items-start gap-2">
                    <span className="text-sm whitespace-nowrap text-gray-600">
                      {`${t('table.attachments')}: `}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {item.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <BaseButton
                            onClick={() =>
                              onPreviewAttachment(
                                attachment.fileId,
                                attachment.filename,
                                attachment.isNotReceipt,
                                attachment.value
                              )
                            }
                            className="h-auto p-0 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                          >
                            {attachment.filename}
                          </BaseButton>
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
          <strong className="text-nowrap">{`${t('table.mileages')}: `}</strong>
          {record.mileages.map((mileage) => (
            <div
              key={mileage.id}
              className="mt-2 ml-4 rounded border border-gray-100 bg-gray-50 p-2"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-gray-600">
                    {`${dayjs(mileage.date).format('DD.MM.YYYY')} - ${mileage.distance} km - `}
                    {`${(mileage.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE).toFixed(2)} €`}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <AccountSelect
                      placeholder={
                        t('table.select_account') || t('table.select')
                      }
                      value={mileage.account || ''}
                      onChange={(value) =>
                        updateBookkeepingAccount({
                          id: mileage.id,
                          account: value,
                          isMileage: true
                        })
                      }
                      disabled={!!record.archived}
                      actionStatus={updateBookkeepingAccountStatus}
                      triggerClassName={accountSelectTriggerClass}
                      size="sm"
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() =>
                        setEditState({
                          type: 'mileage',
                          data: mileage,
                          entryId: record.id
                        })
                      }
                      disabled={!!record.archived}
                    >
                      {t('actions.edit')}
                    </Button>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {`${t('table.description')}: ${mileage.description}`}
                </span>
                <span className="text-sm text-gray-600">
                  {`${t('table.route')}: ${mileage.route}`}
                </span>
                <span className="text-sm text-gray-600">
                  {`${t('table.plate_number')}: ${mileage.plateNo}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <strong className="text-nowrap">{`${t('table.id')}: `}</strong>
        <span className="text-nowrap">{record.id}</span>
      </div>

      <div className="mt-4">
        <div className="flex gap-2">
          {record.status === 'submitted' && (
            <>
              <Button
                variant="secondary"
                onClick={() => onApprove([record.id])}
              >
                {t('actions.approve')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => onDeny([record.id])}
                actionStatus={denyStatus}
              >
                {t('actions.deny')}
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button variant="secondary" onClick={() => onPay([record.id])}>
              {t('actions.pay')}
            </Button>
          )}
          {record.status !== 'submitted' && !record.archived && (
            <Button
              variant="secondary"
              onClick={() => onReset([record.id])}
              actionStatus={resetStatus}
            >
              {t('actions.reset')}
            </Button>
          )}
          {(record.status === 'paid' || record.status === 'denied') &&
            !record.archived && (
              <Button
                variant="danger"
                onClick={() => onArchive([record.id])}
                actionStatus={archiveStatus}
              >
                {t('actions.archive')}
              </Button>
            )}
        </div>
      </div>
    </div>
  )
}
