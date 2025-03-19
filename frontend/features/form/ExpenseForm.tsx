import React, { useEffect, useState } from 'react'
import { Button, Result, Divider, Form, Input, Typography } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { Mileage, Item } from './EntryRow'
import type { ColPropsMap } from 'features/types'

import type { ItemState, MileageState } from './formSlice'
import dayjs from 'dayjs'

import './ExpenseForm.css'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import {
  addItem,
  addMileage,
  editItem,
  editMileage,
  removeEntry,
  resetForm,
  addFile,
} from './formSlice'

import {
  MileageFormValues,
  ExpenseFormValues,
  MileageModal,
  ItemModal,
} from './Modals'

import { EURFormat } from '../utils'
import { getConfig, postForm, postInterface } from './api'
import { friendlyFormatIBAN, isValidIBAN } from 'ibantools'
import { useTranslation } from 'react-i18next'
const spans: { [key: string]: ColPropsMap } = {
  main: {
    label: {
      span: 6,
    },
    wrapper: {
      span: 18,
    },
  },
}

interface SuccessConfirmProps {
  onConfirm: () => void
}

const SuccessConfirm = ({ onConfirm }: SuccessConfirmProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'form.main.success',
  })

  return (
    <Result
      status="success"
      title={t('title')}
      subTitle={t('sub_title')}
      extra={[
        <Button type="primary" key="again" onClick={onConfirm}>
          {t('send_another')}
        </Button>,
      ]}
    />
  )
}

interface SubmitFailureProps {
  onConfirm: () => void
}

const SubmitFailure = ({ onConfirm }: SubmitFailureProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'form.main.failure',
  })

  return (
    <Result
      status="error"
      title={t('title')}
      subTitle={t('sub_title')}
      extra={[
        <Button type="primary" key="again" onClick={onConfirm}>
          {t('try_again')}
        </Button>,
      ]}
    />
  )
}

// interface expenseFormInterface extends Omit<addItemInterface, 'date'> {
//   date: Dayjs,
// };

export function ExpenseForm() {
  const [modal, setModal] = useState<null | 'expense' | 'mileage'>(null)
  const [editTarget, setEditTarget] = useState<null | number>(null)
  const [status, setStatus] = useState<
    null | 'submitting' | 'success' | 'failure'
  >(null)
  const [config, setConfig] = useState({ mileageReimbursementRate: 0.25 })
  const dispatch = useAppDispatch()
  const entries = useAppSelector((state) => state.form.entries)
  const files = useAppSelector((state) => state.form.files)
  const [expenseFileList, setExpenseFileList] = useState<UploadFile[]>([])
  // console.log(entries);
  const [expenseForm] = Form.useForm<ExpenseFormValues>()
  const [mileageForm] = Form.useForm<MileageFormValues>()
  const [mainForm] = Form.useForm()

  useEffect(() => {
    getConfig().then((config) => setConfig(config))
  }, [])

  const { t } = useTranslation('translation', { keyPrefix: 'form.main' })

  const defaultFiles: UploadFile[] = []
  console.log('Edit target ' + editTarget)
  if (
    editTarget !== null &&
    entries.find((e) => e.id === editTarget)?.kind === 'item'
  ) {
    const target = entries.find((e) => e.id === editTarget) as ItemState
    defaultFiles.push(...target.attachments.map((file) => files[file.id]))
  }
  const showExpense = () => {
    setModal('expense')
  }
  const showMileage = () => {
    setModal('mileage')
  }
  const handleRemove = (id: number) => {
    dispatch(removeEntry(id))
  }
  const handleOkExpense = (editTarget: null | number) => async () => {
    // trigger validation as button is not a submit button
    try {
      await expenseForm.validateFields()
    } catch (err) {
      console.log(err)
      return
    }
    const values = expenseForm.getFieldsValue()
    console.log('attachments array:', values.attachments)
    const attachments = values.attachments.fileList
      .filter((file: UploadFile) => file.status === 'done')
      .map((file: UploadFile) => ({
        id: Number(file.response),
        value_cents:
          values.value_cents[file.response] &&
          !values.is_not_receipts[file.response]
            ? Math.round(
                Number(values.value_cents[file.response].replace(',', '.')) *
                  100,
              )
            : null,
        is_not_receipt: values.is_not_receipts[file.response] || false,
      }))

    values.attachments.fileList.forEach((file: UploadFile) => {
      if (files[Number(file.response)] === undefined) {
        dispatch(addFile({ id: Number(file.response), file: file }))
      }
    })
    const modValues = {
      description: values.description,
      date: values.date.format('YYYY-MM-DD'),
      attachments,
    }
    if (editTarget === null) {
      dispatch(addItem(modValues))
    } else {
      dispatch(editItem({ item: modValues, editTarget: editTarget }))
    }
    setModal(null)
    setEditTarget(null)
    expenseForm.resetFields()
    setExpenseFileList([])
  }
  const handleOkMileage = (editTarget: null | number) => async () => {
    try {
      await mileageForm.validateFields()
    } catch (err) {
      console.log(err)
      return
    }
    const values = mileageForm.getFieldsValue()
    const modValues = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    }
    if (editTarget === null) {
      dispatch(addMileage(modValues))
    } else {
      dispatch(editMileage({ mileage: modValues, editTarget: editTarget }))
    }
    setEditTarget(null)
    setModal(null)
    mileageForm.resetFields()
  }
  const handleCancelExpense = () => {
    setModal(null)
    setEditTarget(null)
    expenseForm.resetFields()
    setExpenseFileList([])
  }
  const handleCancelMileage = () => {
    setModal(null)
    setEditTarget(null)
    mileageForm.resetFields()
  }

  const handleEdit = (entry: ItemState | MileageState) => {
    const index = entries.map((e) => e.id).indexOf(entry.id)
    setEditTarget(entry.id)
    // const entry = entries.find((e) => e.id === id);
    entry = entries[index]
    if (entry.kind === 'item') {
      setExpenseFileList(entry.attachments.map((file) => files[file.id]))
      expenseForm.setFieldsValue({
        description: entry.description,
        date: dayjs(entry.date),
        attachments: {
          fileList: entry.attachments.map((file) => files[file.id]),
          file: undefined,
        },
        value_cents: Object.fromEntries(
          entry.attachments.map((file) => [
            file.id,
            file.value_cents && !file.is_not_receipt
              ? (file.value_cents / 100).toFixed(2)
              : undefined,
          ]),
        ),
        is_not_receipts: Object.fromEntries(
          entry.attachments.map((file) => [
            file.id,
            file.is_not_receipt || false,
          ]),
        ),
      })
      setModal('expense')
    } else {
      mileageForm.setFieldsValue({
        description: entry.description,
        date: dayjs(entry.date),
        route: entry.route,
        distance: String(entry.distance),
        plate_no: entry.plate_no,
      })
      setModal('mileage')
    }
  }

  const hasMileages = entries.some((e) => e.kind === 'mileage')

  const handleSubmit = async () => {
    try {
      await mainForm.validateFields()
    } catch (err) {
      console.log(err)
      return
    }
    setStatus('submitting')
    const formData = mainForm.getFieldsValue()
    const items = entries.filter((e) => e.kind === 'item')
    const mileages = entries.filter((e) => e.kind === 'mileage')
    const data: postInterface = {
      ...formData,
      gov_id: hasMileages ? formData.gov_id : null,
      iban: friendlyFormatIBAN(formData.iban.replace(/\s/g, '')),
      items,
      mileages,
    }

    try {
      await postForm(data)

      mainForm.resetFields()
      expenseForm.resetFields()
      mileageForm.resetFields()
      setExpenseFileList([])
      dispatch(resetForm())
      setStatus('success')
    } catch (error) {
      console.error(error)
      setStatus('failure')
    }
  }

  const total = entries.reduce((acc, entry) => {
    if (entry.kind === 'item') {
      return (
        acc +
        entry.attachments.reduce((acc, file) => {
          if (file.value_cents) {
            return acc + file.value_cents / 100
          } else {
            return acc
          }
        }, 0)
      )
    } else {
      return acc + entry.distance * config.mileageReimbursementRate
    }
  }, 0)

  console.log({ entries, total, editTarget })

  if (status === 'success') {
    return <SuccessConfirm onConfirm={() => setStatus(null)} />
  }
  if (status === 'failure') {
    return <SubmitFailure onConfirm={() => setStatus(null)} />
  }
  return (
    <>
      <Form
        labelCol={spans.main.label}
        wrapperCol={spans.main.wrapper}
        layout="horizontal"
        labelAlign="right"
        form={mainForm}
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label={t('payee_name')}
          rules={[{ required: true, message: t('payee_name_error') }]}
        >
          <Input placeholder={t('payee_name_placeholder')} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="contact"
          label={t('payee_contact')}
          rules={[
            {
              required: true,
              message: t('payee_contact_error'),
            },
          ]}
        >
          <Input
            placeholder={t('payee_contact_placeholder')}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item
          name="iban"
          label={t('iban')}
          rules={[
            {
              required: true,
              message: t('iban_error_1'),
              validator: (rule, value, callback) => {
                if (isValidIBAN(value.replace(/\s/g, ''))) {
                  callback()
                } else {
                  callback(t('iban_error_2'))
                }
              },
            },
          ]}
        >
          <Input placeholder={t('iban_placeholder')} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="title"
          label={t('claim_title')}
          rules={[
            {
              required: true,
              message: t('claim_title_error'),
            },
          ]}
        >
          <Input.TextArea
            placeholder={t('claim_title_placeholder')}
            autoComplete="off"
            rows={1}
          />
        </Form.Item>
        {hasMileages ? (
          <Form.Item
            name="gov_id"
            label={t('personal_id_code')}
            rules={[
              {
                required: true,
                message: t('personal_id_code_error'),
              },
            ]}
          >
            <Input
              placeholder={t('personal_id_code_placeholder')}
              autoComplete="off"
            />
          </Form.Item>
        ) : null}
        {entries.length > 0 ? <Divider /> : null}
        <div className="entries">
          {entries.map((entry) => {
            if (entry.kind === 'item') {
              return (
                <Item
                  key={entry.id}
                  files={files}
                  item={entry}
                  onEdit={() => {
                    handleEdit(entry)
                  }}
                  onRemove={() => handleRemove(entry.id)}
                  wrapperProps={spans.wrapper}
                  labelProps={spans.label}
                />
              )
            } else {
              return (
                <Mileage
                  key={entry.id}
                  mileage={entry}
                  mileageReimbursementRate={config.mileageReimbursementRate}
                  onEdit={() => {
                    handleEdit(entry)
                  }}
                  onRemove={() => {
                    handleRemove(entry.id)
                  }}
                  wrapperProps={spans.wrapper}
                  labelProps={spans.label}
                />
              )
            }
          })}
        </div>
        <div className="total">
          <h3>
            {t('total')}: {EURFormat.format(total)}
          </h3>
        </div>
        <Divider />
        {/* <Form.Item
            wrapperCol={{span: 16, offset: 4}}
            className="addButtons"
        > */}
        <div className="addButtons">
          <Button type="default" onClick={showExpense} htmlType="button">
            {t('add_expense')}
          </Button>
          <Button type="default" onClick={showMileage} htmlType="button">
            {t('add_mileage')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            style={{ float: 'right' }}
            loading={status === 'submitting'}
            onClick={handleSubmit}
            disabled={entries.length === 0}
          >
            {t('submit')}
          </Button>
        </div>
        {/* </Form.Item> */}
      </Form>
      <ItemModal
        form={expenseForm}
        onCancel={handleCancelExpense}
        onOk={handleOkExpense(editTarget)}
        visible={modal === 'expense'}
        fileList={expenseFileList}
        setFileList={setExpenseFileList}
      />
      <MileageModal
        form={mileageForm}
        onCancel={handleCancelMileage}
        onOk={handleOkMileage(editTarget)}
        visible={modal === 'mileage'}
      />
      <Divider />
      <div id="footer">
        <Typography.Text>
          {t('privacy_policy_text_1')}{' '}
          <a href={t('privacy_policy_link')}>{t('privacy_policy_text_link')}</a>{' '}
          {t('privacy_policy_text_2')}
        </Typography.Text>
      </div>
    </>
  )
}
