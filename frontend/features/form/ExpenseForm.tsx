import React, { useEffect, useState } from "react";
import { Button, Result, Divider, Form, Input, Typography } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { Mileage, Item } from "./EntryRow";
import type { ColPropsMap } from "features/types";

import type { ItemState, MileageState } from "./formSlice";
import dayjs from "dayjs";

import "./ExpenseForm.css";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  addItem,
  addMileage,
  editItem,
  editMileage,
  removeEntry,
  resetForm,
  addFile,
} from "./formSlice";

import {
  MileageFormValues,
  ExpenseFormValues,
  MileageModal,
  ItemModal,
} from "./Modals";

import { EURFormat } from "../utils";
import { getConfig, postForm, postInterface } from "./api";
import { friendlyFormatIBAN, isValidIBAN } from "ibantools";
import { useTranslation } from "react-i18next";
const spans: { [key: string]: ColPropsMap } = {
  main: {
    label: {
      span: 6,
    },
    wrapper: {
      span: 18,
    },
  },
};

interface SuccessConfirmProps {
  onConfirm: () => void;
}

const SuccessConfirm = ({ onConfirm }: SuccessConfirmProps) => (
  <Result
    status="success"
    title="Successfully submitted!"
    subTitle="Your expense report has been submitted for approval. You may now close this window."
    extra={[
      <Button type="primary" key="again" onClick={onConfirm}>
        Submit a new expense report
      </Button>,
    ]}
  />
);

// interface expenseFormInterface extends Omit<addItemInterface, 'date'> {
//   date: Dayjs,
// };

export function ExpenseForm() {
  const [modal, setModal] = useState<null | "expense" | "mileage">(null);
  const [editTarget, setEditTarget] = useState<null | number>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({ mileageReimbursementRate: 0.25 });
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.form.entries);
  const files = useAppSelector((state) => state.form.files);
  const [expenseFileList, setExpenseFileList] = useState<UploadFile[]>([]);
  // console.log(entries);
  const [expenseForm] = Form.useForm<ExpenseFormValues>();
  const [mileageForm] = Form.useForm<MileageFormValues>();
  const [mainForm] = Form.useForm();

  useEffect(() => {
    getConfig().then((config) => setConfig(config));
  }, []);

  const { t } = useTranslation("translation", { keyPrefix: "form.main" });

  const defaultFiles: UploadFile[] = [];
  console.log("Edit target " + editTarget);
  if (
    editTarget !== null &&
    entries.find((e) => e.id === editTarget)?.kind === "item"
  ) {
    const target = entries.find((e) => e.id === editTarget) as ItemState;
    defaultFiles.push(...target.receipts.map((fileId) => files[fileId]));
  }
  const showExpense = () => {
    setModal("expense");
  };
  const showMileage = () => {
    setModal("mileage");
  };
  const handleRemove = (id: number) => {
    dispatch(removeEntry(id));
  };
  const handleOkExpense = (editTarget: null | number) => async () => {
    // trigger validation as button is not a submit button
    try {
      await expenseForm.validateFields();
    } catch (err) {
      console.log(err);
      return;
    }
    const values = expenseForm.getFieldsValue();
    console.log("receipts array:", values.receipts);
    const fileIds = values.receipts.fileList
      .filter((file: UploadFile) => file.status === "done")
      .map((file: UploadFile) => Number(file.response));
    // const fileIds = values.receipts.fileList.map((file: UploadFile) => Number(file.response));

    // Update local file mapping
    values.receipts.fileList.forEach((file: UploadFile) => {
      if (files[Number(file.response)] === undefined) {
        dispatch(addFile({ id: Number(file.response), file: file }));
      }
    });
    const modValues = {
      ...values,
      date: values.date.format("YYYY-MM-DD"),
      receipts: fileIds,
    };
    if (editTarget === null) {
      dispatch(addItem(modValues));
    } else {
      dispatch(editItem({ item: modValues, editTarget: editTarget }));
    }
    setModal(null);
    setEditTarget(null);
    expenseForm.resetFields();
    setExpenseFileList([]);
  };
  const handleOkMileage = (editTarget: null | number) => async () => {
    try {
      await mileageForm.validateFields();
    } catch (err) {
      console.log(err);
      return;
    }
    const values = mileageForm.getFieldsValue();
    const modValues = {
      ...values,
      date: values.date.format("YYYY-MM-DD"),
    };
    if (editTarget === null) {
      dispatch(addMileage(modValues));
    } else {
      dispatch(editMileage({ mileage: modValues, editTarget: editTarget }));
    }
    setEditTarget(null);
    setModal(null);
    mileageForm.resetFields();
  };
  const handleCancelExpense = () => {
    setModal(null);
    setEditTarget(null);
    expenseForm.resetFields();
    setExpenseFileList([]);
  };
  const handleCancelMileage = () => {
    setModal(null);
    setEditTarget(null);
    mileageForm.resetFields();
  };

  const handleEdit = (entry: ItemState | MileageState) => {
    const modifiedEntry = { ...entry, date: dayjs(entry.date) };
    const index = entries.map((e) => e.id).indexOf(modifiedEntry.id);
    setEditTarget(entry.id);
    // const entry = entries.find((e) => e.id === id);
    entry = entries[index];
    if (entry.kind === "item") {
      const vals = {
        ...modifiedEntry,
        value: String(entry.value_cents / 100),
        receipts: {
          fileList: entry.receipts.map((fileId) => files[fileId]),
          file: undefined,
        },
      };
      console.log(vals);
      setExpenseFileList(entry.receipts.map((fileId) => files[fileId]));
      expenseForm.setFieldsValue(vals);
      setModal("expense");
    } else {
      mileageForm.setFieldsValue({
        ...modifiedEntry,
        distance: String(entry.distance),
      });
      setModal("mileage");
    }
  };

  const hasMileages = entries.some((e) => e.kind === "mileage");

  const handleSubmit = async () => {
    try {
      await mainForm.validateFields();
    } catch (err) {
      console.log(err);
      return;
    }
    setSubmitting(true);
    const formData = mainForm.getFieldsValue();
    const items = entries.filter((e) => e.kind === "item");
    const mileages = entries.filter((e) => e.kind === "mileage");
    // const value_cents =
    const data: postInterface = {
      ...formData,
      gov_id: hasMileages ? formData.gov_id : null,
      iban: friendlyFormatIBAN(formData.iban.replace(/\s/g, "")),
      items,
      mileages,
    };
    postForm(data).then((res) => {
      console.log(res);

      mainForm.resetFields();
      expenseForm.resetFields();
      mileageForm.resetFields();
      setExpenseFileList([]);
      dispatch(resetForm());
      setSubmitting(false);
    });
    setSuccess(true);
  };

  const total = entries.reduce((acc, entry) => {
    if (entry.kind === "item") {
      return acc + entry.value_cents / 100;
    } else {
      return acc + entry.distance * config.mileageReimbursementRate;
    }
  }, 0);

  console.log({ entries, total, editTarget });

  if (success) {
    return <SuccessConfirm onConfirm={() => setSuccess(false)} />;
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
          label={t("payee_name")}
          rules={[{ required: true, message: t("payee_name_error") }]}
        >
          <Input placeholder={t("payee_name_placeholder")} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="contact"
          label={t("payee_contact")}
          rules={[
            {
              required: true,
              message: t("payee_contact_error"),
            },
          ]}
        >
          <Input
            placeholder={t("payee_contact_placeholder")}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item
          name="iban"
          label={t("iban")}
          rules={[
            {
              required: true,
              message: t("iban_error_1"),
              validator: (rule, value, callback) => {
                if (isValidIBAN(value.replace(/\s/g, ""))) {
                  callback();
                } else {
                  callback(t("iban_error_2"));
                }
              },
            },
          ]}
        >
          <Input placeholder={t("iban_placeholder")} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="title"
          label={t("claim_title")}
          rules={[
            {
              required: true,
              message: t("claim_title_error"),
            },
          ]}
        >
          <Input.TextArea
            placeholder={t("claim_title_placeholder")}
            autoComplete="off"
            rows={1}
          />
        </Form.Item>
        {hasMileages ? (
          <Form.Item
            name="gov_id"
            label={t("personal_id_code")}
            rules={[
              {
                required: true,
                message: t("personal_id_code_error"),
              },
            ]}
          >
            <Input
              placeholder={t("personal_id_code_placeholder")}
              autoComplete="off"
            />
          </Form.Item>
        ) : null}
        {entries.length > 0 ? <Divider /> : null}
        <div className="entries">
          {entries.map((entry) => {
            if (entry.kind === "item") {
              return (
                <Item
                  key={entry.id}
                  files={files}
                  item={entry}
                  onEdit={() => {
                    handleEdit(entry);
                  }}
                  onRemove={() => handleRemove(entry.id)}
                  wrapperProps={spans.wrapper}
                  labelProps={spans.label}
                />
              );
            } else {
              return (
                <Mileage
                  key={entry.id}
                  mileage={entry}
                  mileageReimbursementRate={config.mileageReimbursementRate}
                  onEdit={() => {
                    handleEdit(entry);
                  }}
                  onRemove={() => {
                    handleRemove(entry.id);
                  }}
                  wrapperProps={spans.wrapper}
                  labelProps={spans.label}
                />
              );
            }
          })}
        </div>
        <div className="total">
          <h3>
            {t("total")}: {EURFormat.format(total)}
          </h3>
        </div>
        <Divider />
        {/* <Form.Item
            wrapperCol={{span: 16, offset: 4}}
            className="addButtons"
        > */}
        <div className="addButtons">
          <Button type="default" onClick={showExpense} htmlType="button">
            {t("add_expense")}
          </Button>
          <Button type="default" onClick={showMileage} htmlType="button">
            {t("add_mileage")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            style={{ float: "right" }}
            loading={submitting}
            onClick={handleSubmit}
            disabled={entries.length === 0}
          >
            {t("submit")}
          </Button>
        </div>
        {/* </Form.Item> */}
      </Form>
      <ItemModal
        form={expenseForm}
        onCancel={handleCancelExpense}
        onOk={handleOkExpense(editTarget)}
        visible={modal === "expense"}
        fileList={expenseFileList}
        setFileList={setExpenseFileList}
      />
      <MileageModal
        form={mileageForm}
        onCancel={handleCancelMileage}
        onOk={handleOkMileage(editTarget)}
        visible={modal === "mileage"}
      />
      <Divider />
      <div id="footer">
        <Typography.Text>
          {t("privacy_policy_text_1")}{" "}
          <a href={t("privacy_policy_link")}>{t("privacy_policy_text_link")}</a>{" "}
          {t("privacy_policy_text_2")}
        </Typography.Text>
      </div>
    </>
  );
}
