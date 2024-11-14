import React, { useEffect, useState } from 'react'
import {
  DatePicker,
  Typography,
  Table,
  Button,
  Space,
  UploadFile,
  Form,
  Select,
} from 'antd'
const { RangePicker } = DatePicker
import dayjs, { Dayjs } from 'dayjs'
import {
  type SubmissionState,
  type MileageState,
  type ItemState,
  loadSubmissions,
  stopLoading,
  showDateModal,
  showConfirmPaymentModal,
  showRemoveEntryModal,
  showEditItemModal,
  showRemoveEntriesModal,
  hideEditItemModal,
  showEditMileageModal,
  hideEditMileageModal,
} from './adminSlice'
import type { ColumnsType } from 'antd/es/table'
import { useAppDispatch, useAppSelector } from '../../app/hooks'

import { EURFormat, KMFormat } from '../utils'
import {
  archiveEntries,
  archiveEntry,
  denyEntries,
  denyEntry,
  getAdminConfig,
  getEntries,
  modifyItem,
  modifyMileage,
  resetEntries,
  resetEntry,
  upsertBookkeepingAccount,
} from './api'
import { Attachment } from './Attachment'
import { AppDispatch } from 'app/store'
import SubmitDateModal from './SubmitDateModal'
import { ConfirmPaymentModal } from './ConfirmPaymentModal'
import { useLoaderData } from 'react-router-dom'
import RemoveItemModal from './RemoveEntryModal'
import RemoveEntriesModal from './RemoveEntriesModal'
import {
  ExpenseFormValues,
  ItemModal,
  MileageFormValues,
  MileageModal,
} from '../form/Modals'
import i18next from '../../i18n'
import { useTranslation } from 'react-i18next'
import { UploadFileStatus } from 'antd/lib/upload/interface'
export const loadItems = (dispatch: AppDispatch) => {
  getEntries().then((entries) => {
    dispatch(loadSubmissions(entries))
    dispatch(stopLoading())
  })
}

const calculateSum = (
  submission: SubmissionState,
  mileageReimbursementRate: number,
) => {
  const mileageSum = submission.mileages.reduce((acc, item) => {
    return acc + item.distance * mileageReimbursementRate
  }, 0)
  const itemSum = submission.items.reduce((acc, item) => {
    return (
      acc +
      item.attachments.reduce((acc, file) => {
        if (file.value_cents) {
          return acc + file.value_cents / 100
        } else {
          return acc
        }
      }, 0)
    )
  }, 0)
  return mileageSum + itemSum
}

interface tableSubmission extends SubmissionState {
  key: React.Key
  total: number
}

const columns = (entries: tableSubmission[]): ColumnsType<tableSubmission> => {
  const t = i18next.getFixedT(
    i18next.language,
    'translation',
    'admin.table_titles',
  )
  const normalizedNames = entries
    .map((entry) => entry.name)
    .map((name) =>
      name
        .toLocaleLowerCase()
        .split(' ')
        .map((s1) => {
          const s2 = s1
            .split('-')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join('-')
          return s2.charAt(0).toUpperCase() + s2.substring(1)
        })
        .join(' ')
        .trim(),
    )

  const uniqueNames = normalizedNames.filter(
    (name1, index) =>
      normalizedNames.findIndex((name2) => name1 === name2) === index,
  )
  return [
    {
      title: t('entry_id'),
      dataIndex: 'id',
      key: 'id',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('submission_date'),
      dataIndex: 'submission_date',
      key: 'submissionDate',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      // Allow filtering by name. Substring match.
      filters: uniqueNames
        .map((name) => {
          return { text: name, value: name.toLocaleLowerCase() }
        })
        .sort((a, b) => a.text.localeCompare(b.text, 'fi')),
      filterSearch: true,
      onFilter: (value, record) => record.name.toLocaleLowerCase() === value,
    },
    {
      title: t('total'),
      dataIndex: 'total',
      key: 'total',
      render: (value) => EURFormat.format(value),
    },
    {
      title: t('submission_title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      // Allow filtering by status. "submitted", "paid", "approved", "denied"
      filters: [
        {
          text: t('status_filters.submitted'),
          value: 'submitted',
        },
        {
          text: t('status_filters.paid'),
          value: 'paid',
        },
        {
          text: t('status_filters.approved'),
          value: 'approved',
        },
        {
          text: t('status_filters.denied'),
          value: 'denied',
        },
      ],
      onFilter: (value, record) => record.status === value,
      render: (value) => t('status_filters.' + value),
    },
    {
      title: t('archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: (value) =>
        value ? t('archived_values.yes') : t('archived_values.no'),
      // Allow filtering by archived status.
      filters: [
        {
          text: t('archived_filters.archived'),
          value: true,
        },
        {
          text: t('archived_filters.not_archived'),
          value: false,
        },
      ],
      onFilter: (value, record) => record.archived === value,
      defaultFilteredValue: ['false'],
    },
  ]
}

interface expandedRowTable {
  key: React.Key
  rendered: JSX.Element
  type: string
  description: string
  index: number
}

const expandedColumns: ColumnsType<expandedRowTable> = [
  {
    title: 'Row',
    dataIndex: 'rendered',
    key: 'rendered',
  },
]

type BookkeepingAccount = {
  label: string
  value: string
}

const filterAccountOption = (input: string, option?: BookkeepingAccount) =>
  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

const renderMileage = (
  mileage: MileageState,
  mileageReimbursementRate: number,
  bookkeepingAccounts: BookkeepingAccount[],
) => {
  const dispatch = useAppDispatch()
  const t = i18next.getFixedT(
    i18next.language,
    'translation',
    'admin.expanded.mileage',
  )

  const onAccountChange = (value: string) => {
    upsertBookkeepingAccount(mileage.id, {
      account: value,
      is_mileage: true,
    }).then(() => loadItems(dispatch))
  }

  return (
    <Space>
      <Typography.Text>
        {t('mileage')}: <strong>{mileage.date}</strong>{' '}
        {KMFormat.format(mileage.distance)} &rarr;{' '}
        {EURFormat.format(mileage.distance * mileageReimbursementRate)}
      </Typography.Text>
      <Button onClick={() => dispatch(showEditMileageModal(mileage))}>
        {t('edit')}
      </Button>
      <Select
        style={{ width: '400px' }}
        showSearch={true}
        placeholder={t('bookkeeping_account')}
        optionFilterProp="label"
        onChange={onAccountChange}
        filterOption={filterAccountOption}
        defaultValue={mileage.account}
        options={bookkeepingAccounts}
      />
    </Space>
  )
}

const renderItem = (
  item: ItemState,
  bookkeepingAccounts: BookkeepingAccount[],
) => {
  const dispatch = useAppDispatch()
  const t = i18next.getFixedT(
    i18next.language,
    'translation',
    'admin.expanded.item',
  )

  const onAccountChange = (value: string) => {
    upsertBookkeepingAccount(item.id, {
      account: value,
      is_mileage: false,
    }).then(() => loadItems(dispatch))
  }

  return (
    <Space>
      <Typography.Text>
        {t('item')}: <strong>{item.date}</strong>{' '}
        {EURFormat.format(
          item.attachments.reduce((acc, file) => {
            if (file.value_cents) {
              return acc + file.value_cents / 100
            } else {
              return acc
            }
          }, 0),
        )}
      </Typography.Text>
      <Button onClick={() => dispatch(showEditItemModal(item))}>
        {t('edit')}
      </Button>
      <Select
        style={{ width: '400px' }}
        showSearch={true}
        placeholder={t('bookkeeping_account')}
        optionFilterProp="label"
        onChange={onAccountChange}
        filterOption={filterAccountOption}
        defaultValue={item.account}
        options={bookkeepingAccounts}
      />
    </Space>
  )
}

const expandedRowRender = (
  record: tableSubmission,
  mileageReimbursementRate: number,
  bookkeepingAccounts: BookkeepingAccount[],
) => {
  const submissionRows: expandedRowTable[] = record.mileages
    .map((mileage, i) => {
      return {
        key: `mileage-${mileage.id}`,
        rendered: renderMileage(
          mileage,
          mileageReimbursementRate,
          bookkeepingAccounts,
        ),
        type: 'mileage',
        index: i,
        description: mileage.description,
      }
    })
    .concat(
      record.items.map((item, i) => ({
        key: `item-${item.id}`,
        rendered: renderItem(item, bookkeepingAccounts),
        type: 'item',
        index: i,
        description: item.description,
      })),
    )
  const dispatch = useAppDispatch()
  const t = i18next.getFixedT(i18next.language, 'translation', 'admin.expanded')
  return (
    <>
      <Table
        dataSource={submissionRows}
        columns={expandedColumns}
        expandable={{
          expandedRowRender: (a) => {
            return (
              <>
                <Typography.Title level={4}>
                  {t('description')}:{' '}
                </Typography.Title>
                <Typography.Text>{a.description}</Typography.Text>
                {a.type === 'mileage' ? (
                  <>
                    <Typography.Title level={4}>
                      {t('mileage.route')}:
                    </Typography.Title>
                    <Typography.Text>
                      {record.mileages[a.index].route}
                    </Typography.Text>
                    <Typography.Title level={4}>
                      {t('mileage.plate_number')}:
                    </Typography.Title>
                    <Typography.Text>
                      {record.mileages[a.index].plate_no}
                    </Typography.Text>
                  </>
                ) : (
                  <>
                    <Typography.Title level={4}>
                      {t('item.attachments')}:
                    </Typography.Title>
                    {record.items[a.index].attachments.map((r) => {
                      return <Attachment key={r.id} attachment={r} />
                    })}
                  </>
                )}
              </>
            )
          },
        }}
        pagination={false}
        showHeader={false}
      />
      <br></br>
      <h4>
        {t('status')}: {t('statuses.' + record.status)}
      </h4>
      <h4>
        {t('contact')}: {record.contact}
      </h4>
      <Space>
        <Button onClick={() => window.open(`/api/entry/${record.id}/pdf`)}>
          {t('download_pdf')}
        </Button>
        {(record.status === 'paid' || record.status === 'approved') && (
          <Button onClick={() => window.open(`/api/entry/${record.id}/csv`)}>
            {record.status === 'paid' ? t('download_zip') : t('download_csv')}
          </Button>
        )}
      </Space>
      <br />
      <br />

      <Space>
        {record.status === 'submitted' && (
          <>
            <Button onClick={() => dispatch(showDateModal(record.id))}>
              {t('actions.accept')}
            </Button>
            <Button
              onClick={() =>
                denyEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              {t('actions.deny')}
            </Button>
          </>
        )}
        {record.status === 'approved' && (
          <Button onClick={() => dispatch(showConfirmPaymentModal(record.id))}>
            {t('actions.pay')}
          </Button>
        )}
        {record.status !== 'submitted' && !record.archived && (
          <>
            <Button
              onClick={() =>
                resetEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              {t('actions.reset')}
            </Button>
          </>
        )}
        {(record.status === 'paid' || record.status === 'denied') &&
          !record.archived && (
            <Button
              danger
              onClick={() =>
                archiveEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              {t('actions.archive')}
            </Button>
          )}
        {record.archived && (
          <Button
            danger
            onClick={() => dispatch(showRemoveEntryModal(record.id))}
          >
            {t('actions.remove')}
          </Button>
        )}
      </Space>
    </>
  )
}

type Config = {
  mileageReimbursementRate: number
  deleteArchivedAgeLimit: number
  bookkeepingAccounts: BookkeepingAccount[]
}

export function AdminEntryView() {
  const dispatch = useAppDispatch()
  const entries = useLoaderData() as SubmissionState[]

  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>()
  const [expenseFileList, setExpenseFileList] = useState<UploadFile[]>([])
  const [config, setConfig] = useState<Config>({
    mileageReimbursementRate: 0.25,
    deleteArchivedAgeLimit: 30,
    bookkeepingAccounts: [],
  })

  useEffect(() => {
    dispatch(loadSubmissions(entries))
    dispatch(stopLoading())
    getAdminConfig().then((config) => setConfig(config))
  }, [])
  const adminEntries = useAppSelector((state) => state.admin.submissions)
  const loading = useAppSelector((state) => state.admin.loading)
  const [editExpenseForm] = Form.useForm<ExpenseFormValues>()

  const [editMileageForm] = Form.useForm<MileageFormValues>()

  const sumEnties: Array<tableSubmission> = adminEntries
    .filter((entry) => {
      if (dateRange) {
        const date = new Date(entry.submission_date)
        return dateRange[0].toDate() <= date && date <= dateRange[1].toDate()
      }
      return true
    })
    .map((entry) => {
      return {
        ...entry,
        key: entry.id,
        total: calculateSum(entry, config.mileageReimbursementRate),
      }
    })
  const selected = useAppSelector((state) => state.admin.selected)

  const selectedItem = useAppSelector((state) => state.admin.selectedItem)
  const showEditItemModal = useAppSelector((state) => state.admin.editItemModal)

  const selectedMileage = useAppSelector((state) => state.admin.selectedMileage)
  const showEditMileageModal = useAppSelector(
    (state) => state.admin.editMileageModal,
  )

  const { t } = useTranslation('translation', { keyPrefix: 'admin' })

  useEffect(() => {
    if (selectedItem) {
      const formValues = {
        description: selectedItem.description,
        date: dayjs(selectedItem.date) as Dayjs,
        attachments: {
          fileList: selectedItem.attachments.map((r) => ({
            uid: String(r.id),
            name: r.filename,
            status: 'done' as UploadFileStatus,
            response: r.id,
            url: `/api/attachment/${r.id}`,
          })),
          file: undefined,
        },
        value_cents: Object.fromEntries(
          selectedItem.attachments.map((file) => [
            file.id,
            file.value_cents && !file.is_not_receipt
              ? (file.value_cents / 100).toFixed(2)
              : undefined,
          ]),
        ),
        is_not_receipts: Object.fromEntries(
          selectedItem.attachments.map((file) => [
            file.id,
            file.is_not_receipt || false,
          ]),
        ),
      }
      editExpenseForm.setFieldsValue(formValues)
      setExpenseFileList(
        selectedItem.attachments.map((r) => {
          return {
            uid: String(r.id),
            name: r.filename,
            status: 'done',
            response: r.id,
            url: `/api/attachment/${r.id}`,
          }
        }),
      )
    }
  }, [selectedItem])

  useEffect(() => {
    if (selectedMileage) {
      const formValues = {
        date: dayjs(selectedMileage.date) as Dayjs,
        distance: String(selectedMileage.distance),
        description: selectedMileage.description,
        route: selectedMileage.route,
        plate_no: selectedMileage.plate_no,
      }
      editMileageForm.setFieldsValue(formValues)
    }
  }, [selectedMileage])

  const handleCancelEditExpense = () => {
    dispatch(hideEditItemModal())
    editExpenseForm.resetFields()
    setExpenseFileList([])
  }

  const handleOkEditExpense = async () => {
    try {
      await editExpenseForm.validateFields()
    } catch (err) {
      console.log(err)
      return
    }
    const values = editExpenseForm.getFieldsValue()
    const body = {
      description: values.description,
      date: values.date.format('YYYY-MM-DD'),
      attachments: values.attachments.fileList.map((file) => ({
        id: Number(file.response),
        value_cents:
          values.value_cents[file.response] &&
          !values.is_not_receipts[file.response]
            ? Number(values.value_cents[file.response].replace(',', '.')) * 100
            : null,
        is_not_receipt: values.is_not_receipts[file.response] || false,
      })),
    }
    modifyItem(selectedItem.id, body).then(() => {
      dispatch(hideEditItemModal())
      loadItems(dispatch)
      editExpenseForm.resetFields()
      setExpenseFileList([])
    })
  }

  const handleCancelEditMileage = () => {
    dispatch(hideEditMileageModal())
    editMileageForm.resetFields()
  }

  const handleOkEditMileage = async () => {
    try {
      await editMileageForm.validateFields()
    } catch (err) {
      console.log(err)
      return
    }
    const values = editMileageForm.getFieldsValue()
    const body = {
      date: values.date.format('YYYY-MM-DD'),
      description: values.description,
      route: values.route,
      plate_no: values.plate_no,
      distance: Number(values.distance.replace(',', '.')),
    }
    modifyMileage(selectedMileage.id, body).then(() => {
      dispatch(hideEditMileageModal())
      loadItems(dispatch)
      editMileageForm.resetFields()
    })
  }

  const toBeDeleted = adminEntries
    .filter((entry) => entry.archived)
    .filter((entry) => {
      const date =
        entry.status === 'paid'
          ? entry.paid_date && dayjs(entry.paid_date)
          : entry.rejection_date && dayjs(entry.rejection_date)
      const monthAgo = dayjs().subtract(config.deleteArchivedAgeLimit, 'days')
      return date && date.isBefore(monthAgo)
    }).length

  const selectionType =
    selectedIndices.length > 0
      ? adminEntries.find((entry) => entry.id === selectedIndices[0])?.status
      : undefined

  const hasUnArchivedSelections =
    selectedIndices.length > 0 &&
    selectedIndices.every((id) => {
      return adminEntries.find((entry) => entry.id === id)?.archived === false
    })
  // rowSelection object indicates the need for row selection
  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedIndices(selectedRowKeys as number[])
    },
    getCheckboxProps: (record: tableSubmission) => ({
      name: String(record.id),
      disabled: selectionType ? record.status !== selectionType : false,
    }),
  }

  const generateClipboardText = () => {
    const clipboardText = sumEnties
      .filter((entry) => selectedIndices.includes(entry.id))
      .map((entry) => {
        const accounts = entry.items
          .map((item) => item.account)
          .concat(entry.mileages.map((mileage) => mileage.account))
        const uniqueAccounts = accounts
          .filter(
            (value, index, self) => self.indexOf(value) === index && value,
          )
          .map(
            (account) =>
              config.bookkeepingAccounts.find((a) => a.value === account)
                ?.label,
          )
          .sort()
          .join(', ')
        if (entry.mileages.length > 0) {
          const totalDistance = entry.mileages.reduce(
            (acc, mileage) => acc + mileage.distance,
            0,
          )
          return `${entry.name}, ${
            entry.title
          } (${totalDistance} km); ${EURFormat.format(
            entry.total,
          )} (${uniqueAccounts})`
        }
        return `${entry.name}, ${entry.title}; ${EURFormat.format(
          entry.total,
        )} (${uniqueAccounts})`
      })
      .join('\n')
    navigator.clipboard.writeText(clipboardText)
  }

  return (
    <>
      <ConfirmPaymentModal entry_ids={selected} />
      <SubmitDateModal entry_ids={selected} />
      <RemoveItemModal entry_ids={selected} />
      <RemoveEntriesModal />
      <ItemModal
        form={editExpenseForm}
        onCancel={handleCancelEditExpense}
        onOk={handleOkEditExpense}
        visible={showEditItemModal}
        fileList={expenseFileList}
        setFileList={setExpenseFileList}
      />
      <MileageModal
        form={editMileageForm}
        onCancel={handleCancelEditMileage}
        onOk={handleOkEditMileage}
        visible={showEditMileageModal}
      />
      <Typography.Title level={3} style={{ display: 'inline-block' }}>
        {t('submissions')}
      </Typography.Title>
      <div
        style={{
          float: 'right',
          display: 'inline-block',
          marginBlockStart: '2em',
        }}
      >
        <Space>
          {selectedIndices.length > 0 && selectionType == 'paid' && (
            <Button
              onClick={() => {
                window.open(
                  `/api/entry/multi/csv?entry_ids=${selectedIndices.join(',')}`,
                )
              }}
            >
              {t('multi_actions.download_zip')}
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == 'submitted' && (
            <Button onClick={() => dispatch(showDateModal(selectedIndices))}>
              {t('multi_actions.accept')}
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == 'submitted' && (
            <Button
              onClick={() =>
                denyEntries(selectedIndices).then(() => loadItems(dispatch))
              }
            >
              {t('multi_actions.deny')}
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == 'submitted' && (
            <Button onClick={generateClipboardText}>
              {t('multi_actions.copy_clipboard')}
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == 'approved' && (
            <Button
              onClick={() => dispatch(showConfirmPaymentModal(selectedIndices))}
            >
              {t('multi_actions.pay')}
            </Button>
          )}
          {hasUnArchivedSelections &&
            ['denied', 'paid'].includes(selectionType!) && (
              <Button
                onClick={() =>
                  archiveEntries(selectedIndices).then(() =>
                    loadItems(dispatch),
                  )
                }
              >
                {t('multi_actions.archive')}
              </Button>
            )}
          {hasUnArchivedSelections &&
            ['denied', 'approved', 'paid'].includes(selectionType!) && (
              <Button
                onClick={() =>
                  resetEntries(selectedIndices).then(() => loadItems(dispatch))
                }
              >
                {t('multi_actions.reset')}
              </Button>
            )}
          {toBeDeleted > 0 && (
            <Button danger onClick={() => dispatch(showRemoveEntriesModal())}>
              {t('multi_actions.remove_old_archived')} ({toBeDeleted})
            </Button>
          )}
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].startOf('day'), dates[1].endOf('day')])
              } else {
                setDateRange(undefined)
              }
            }}
            picker="date"
            format={'DD.MM.YYYY'}
          />
        </Space>
      </div>
      <Table
        rowSelection={{
          type: 'checkbox',
          ...rowSelection,
        }}
        style={{ maxWidth: '100vw' }}
        scroll={{ x: true }}
        dataSource={sumEnties}
        columns={columns(sumEnties)}
        expandable={{
          expandedRowRender: (record: tableSubmission) =>
            expandedRowRender(
              record,
              config.mileageReimbursementRate,
              config.bookkeepingAccounts,
            ),
        }}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50],
          showTotal: (total, range) => {
            return `${range[0]}-${range[1]} / ${total}`
          },
        }}
      />
    </>
  )
}
