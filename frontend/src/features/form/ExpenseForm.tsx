import React, { useState } from "react";
import {
  Button,
  message,
  Modal,
  Row,
  Col,
  Space,
  Result,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Upload,
  DatePicker,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { RcFile, UploadProps } from "antd/es/upload";
import { PlusOutlined, DownOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import imageCompression from "browser-image-compression";
import axios from "axios";
import { Mileage, Item } from "./EntryRow";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import type { ColPropsMap } from "features/types";

import type { Dayjs } from "dayjs";
import type { ItemState, MileageState, addItemInterface } from "./formSlice";
import dayjs from "dayjs";

import "./ExpenseForm.css";
import { useAppSelector, useAppDispatch } from "app/hooks";
import {
  addItem,
  addMileage,
  editItem,
  editMileage,
  removeEntry,
  resetForm,
  FormState,
  addFile,
} from "./formSlice";

import {
  MileageFormValues,
  ExpenseFormValues,
  MileageModal,
  ItemModal,
} from "./Modals";

import { mileageReimbursementRate, EURFormat, KMFormat } from "features/utils";

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
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.form.entries);
  const files = useAppSelector((state) => state.form.files);
  const [expenseFileList, setExpenseFileList] = useState<UploadFile[]>([]);
  // console.log(entries);
  const [expenseForm] = Form.useForm<ExpenseFormValues>();
  const [mileageForm] = Form.useForm<MileageFormValues>();
  const [mainForm] = Form.useForm();
  const total = entries.reduce((acc, entry) => {
    if (entry.kind === "item") {
      return acc + entry.value;
    } else {
      return acc + entry.distance * mileageReimbursementRate;
    }
  }, 0);
  const needGovId = entries.some((entry) => entry.kind === "mileage");

  const defaultFiles: UploadFile[] = [];
  if (editTarget !== null && entries[editTarget].kind === "item") {
    const target = entries[editTarget] as ItemState;
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
  };
  const handleOkMileage = (editTarget: null | number) => async () => {
    try {
      await mileageForm.validateFields();
    } catch (err) {
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
  };
  const handleCancelMileage = () => {
    setModal(null);
    setEditTarget(null);
    mileageForm.resetFields();
  };

  const handleEdit = (entry: ItemState | MileageState) => {
    const modifiedEntry = { ...entry, date: dayjs(entry.date) };
    setEditTarget(modifiedEntry.id);
    // const entry = entries.find((e) => e.id === id);
    if (entry.kind === "item") {
      const vals = {
        ...modifiedEntry,
        value: String(entry.value),
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
  const handleSubmit = async () => {
    // TODO: actually submit the form
    try {
      await mainForm.validateFields();
    } catch (err) {
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      mainForm.resetFields();
      expenseForm.resetFields();
      mileageForm.resetFields();
      setExpenseFileList([]);
      dispatch(resetForm());
      setSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  console.log({ entries, total, needGovId, editTarget });

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
          label="Payee name"
          rules={[{ required: true, message: "Please give your name!" }]}
        >
          <Input placeholder="First Last" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="contact"
          label="Payee concact"
          rules={[
            {
              required: true,
              message: "Please give your contact information!",
            },
          ]}
        >
          <Input placeholder="Telegram / Email / Phone" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="iban"
          label="IBAN"
          rules={[
            {
              required: true,
              message: "Please give your bank account number!",
            },
          ]}
        >
          <Input placeholder="FI 12 3456 7890 1234 56" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="title"
          label="Claim title"
          rules={[
            {
              required: true,
              message: "Please give a title to your expense claim submission!",
            },
          ]}
        >
          <Input
            placeholder="<event> expenses and mileages"
            autoComplete="off"
          />
        </Form.Item>
        {needGovId ? (
          <Form.Item
            name="gov_id"
            label="Personal ID code"
            rules={[
              {
                required: true,
                message:
                  "Government issues personal identification code is required for paying mileages!",
              },
            ]}
          >
            <Input placeholder="123456-789A" autoComplete="off" />
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
        <Divider />
        {/* <Form.Item
            wrapperCol={{span: 16, offset: 4}}
            className="addButtons"
        > */}
        <div className="addButtons">
          <Button type="default" onClick={showExpense} htmlType="button">
            Add an expense
          </Button>
          <Button type="default" onClick={showMileage} htmlType="button">
            Add a mileage
          </Button>
          <span className="total">
            <strong>Total:</strong> {EURFormat.format(total)}
          </span>
          <Button
            type="primary"
            htmlType="submit"
            style={{ float: "right" }}
            loading={submitting}
            onClick={handleSubmit}
          >
            Submit
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
    </>
  );
}
