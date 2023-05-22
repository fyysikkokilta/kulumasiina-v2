import React, { useState } from 'react';
import { Button, message, Modal, Row, Col, Space, Result, Divider, Form, FormInstance, Input, InputNumber, Upload, DatePicker } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import type {
  UploadRequestOption
} from 'rc-upload/lib/interface';

import type { DatePickerProps } from 'antd/';
import type { ItemState, MileageState, addItemInterface } from './formSlice';
import dayjs from 'dayjs';

import './ExpenseForm.css';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  addItem,
  addMileage,
  editItem,
  editMileage,
  removeEntry,
  resetForm,
} from './formSlice';

import { mileageReimbursementRate, EURFormat, KMFormat } from '../utils';



interface MileageProps {
  mileage: MileageState;
  onEdit: () => void;
  onRemove: () => void;
}

const Mileage = ({mileage, onEdit, onRemove}: MileageProps) => {
  return (
    <Form.Item
      className="expenseCard mileage"
      key={mileage.id}
      label="Mileage"
      // wrapperCol={{span: 20, offset: 0}}
      wrapperCol={{span: 20, offset: 0}}
    >
      <div className="separator">
        <span>
          <span className="date">{mileage.date}</span>
          <span className="value">{KMFormat.format(mileage.distance)} &rarr; {EURFormat.format(mileage.distance * mileageReimbursementRate)}</span>
          <span className="plate-no"># {mileage.plate_no.toUpperCase()}</span>
        </span>
        <div>
          <Button type="link" onClick={onEdit}>Edit</Button>
          <Button type="primary" danger onClick={onRemove}>Remove</Button>
        </div>
      </div>
      <p className="description">{mileage.description}</p>
      <p className="route">{mileage.route}</p>
    </Form.Item>
  );
};

interface ItemProps {
  item: ItemState;
  onEdit: () => void;
  onRemove: () => void;
}

const Item = ({item, onEdit, onRemove}: ItemProps) => {
  return (
    <Form.Item
      className="expenseCard item"
      key={item.id}
      label="Expense item"
      wrapperCol={{span: 20, offset: 0}}
    >
        {/* <span className="type">Expense item</span> */}
        <div className="separator">
          <span>
            <span className="date">{item.date}</span>
            <span className="value">{EURFormat.format(item.value)}</span>
          </span>
          <div>
            <Button type="link" onClick={onEdit}>Edit</Button>
            <Button type="primary" danger onClick={onRemove}>Remove</Button>
          </div>
        </div>
        <p className="description">{item.description}</p>
        <div className="receipts">
          <div className='fakeReceipt' />
          <div className='fakeReceipt' />
          <div className='fakeReceipt' />
        </div>
  </Form.Item>
  );
};


interface ModalInterface {
  visible: boolean;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


const ItemModal = (props: ModalInterface) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => setFileList(newFileList);

  const resetUpload = () => {
    setPreviewOpen(false);
    setPreviewImage('');
    setPreviewTitle('');
    setFileList([]);
  };
  const beforeUpload = (file: RcFile) => {
    // check pdf size is under 4MB
    if (file.size > 4 * 1024 * 1024) {
      if (file.type === 'application/pdf') {
        message.error('PDF needs to be under 4MB!', 5);
        return Upload.LIST_IGNORE;
      }
      // compress too large image files
      const options = {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      return imageCompression(file, options);
    };
    return true;
  };
  const upload = (options: UploadRequestOption) => {
    const { onSuccess, onError, file, action} = options;
    const formData = new FormData();
    formData.append('file', file);
    axios.post(action, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((response) => {
      console.log(response);
      if (onSuccess){
        onSuccess(response.data);
      }
    }).catch((err) => {
      if (onError) {
        onError(err);
      };
    });
  }
  return (
    <Modal
      title="Add an expense"
      open={props.visible}
      onOk={() => {props.onOk(); resetUpload();}}
      onCancel={() => {props.onCancel(); resetUpload();}}
    >
      <Form
        labelCol={{span: 6}}
        wrapperCol={{span: 18}}
        layout="horizontal"
        form={props.form}
        requiredMark={false}
      >
        <Form.Item name="description" label="Description" rules={[{required: true, message: "Please provide a description!"}]}>
          <Input.TextArea showCount maxLength={500} rows={3} placeholder="Description"/>
        </Form.Item>
        <Form.Item name="value" label="Amount" rules={[{required: true, message: "Please provide expense value!"}]}>
          <Input suffix="€" placeholder="0.00"/>
        </Form.Item>
        <Form.Item name="date" label="Date" rules={[{required: true, message: "Please provide a date for the expense!"}]}>
          <DatePicker format="YYYY-MM-DD" picker="date"/>
        </Form.Item>
        {/* TODO: Think about receipt handling later */}
        <Form.Item label="Receipt">
          <Upload
            action="/api/receipt/"
            listType='picture-card'
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            accept='image/*,.pdf'
            beforeUpload={beforeUpload}
            customRequest={upload}
          >
            <div>
              {/* <PlusOutlined style={{}}/> */}
              +<br/>
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
          <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)} width='80%'>
            <img alt="example" style={{ width: '100%' }} src={previewImage} />
          </Modal>
        </Form.Item>
      </Form>
    </Modal>
  )
};

const MileageModal = (props: ModalInterface) => {
  return (
    <Modal
      title="Add a mileage"
      open={props.visible}
      onOk={props.onOk}
      onCancel={props.onCancel}
    >
      <Form
        labelCol={{span: 6}}
        wrapperCol={{span: 18}}
        layout="horizontal"
        form={props.form}
        requiredMark={false}
      >
        <Form.Item name="description" label="Description" rules={[{required: true, message: "Please provide a description!"}]}>
          <Input.TextArea showCount maxLength={500} rows={3} placeholder="Description"/>
        </Form.Item>
        <Form.Item name="date" label="Date" rules={[{required: true, message: "Please provide a date for the mileage!"}]}>
          <DatePicker format="YYYY-MM-DD" picker="date"/>
        </Form.Item>
        <Form.Item name="route" label="Route" rules={[{required: true, message: "Please provide the used route!"}]}>
          <Input.TextArea showCount maxLength={200} rows={2} placeholder="guild room - venue <address> - guild room"/>
        </Form.Item>
        <Form.Item name="distance" label="Distance" rules={[{required: true, message: "Please provide the distance driven!"}]}>
          <Input suffix="km" placeholder="0"/>
        </Form.Item>
        <Form.Item name="plate_no" label="Plate number" rules={[{required: true, message: "Please provide the plate number of the vehicle!"}]}>
          <Input placeholder="ABC-123"/>
        </Form.Item>
      </Form>
    </Modal>
  )
};

interface SuccessConfirmProps {
  onConfirm: () => void;
}

const SuccessConfirm = ({onConfirm}:SuccessConfirmProps) => (
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


export function ExpenseForm() {
  const [modal, setModal] = useState<null | "expense" | "mileage">(null);
  const [editTarget, setEditTarget] = useState<null | number>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.form.entries);
  // console.log(entries);
  const [expenseForm] = Form.useForm();
  const [mileageForm] = Form.useForm();
  const [mainForm] = Form.useForm();
  const total = entries.reduce((acc, entry) => {
    if (entry.kind === "item") {
      return acc + entry.value;
    } else {
      return acc + entry.distance * mileageReimbursementRate;
    }
  }, 0);
  const needGovId = entries.some((entry) => entry.kind === "mileage");

  const showExpense = () => {
    setModal("expense");
  };
  const showMileage = () => {
    setModal("mileage");
  };
  const handleRemove = (id: number) => {
    dispatch(removeEntry(id));
  }
  const handleOkExpense = (editTarget: null | number) => async () => {
    // trigger validation as button is not a submit button
    try {
      await expenseForm.validateFields();
    } catch (err) {
      return;
    }
    const values = expenseForm.getFieldsValue();
    // This is an antd date object?? Works anyways.
    values.date = values.date.format('YYYY-MM-DD');
    if (editTarget === null) {
      dispatch(addItem(values));
    } else {
      dispatch(editItem({item: values, editTarget: editTarget}));
      setEditTarget(null);
    }
    setModal(null);
    expenseForm.resetFields();
  };
  const handleOkMileage = (editTarget: null | number) => async () => {
    try {
      await mileageForm.validateFields();
    } catch (err) {
      return;
    }
    const values = mileageForm.getFieldsValue();
    values.date = values.date.format('YYYY-MM-DD');
    if (editTarget === null) {
      dispatch(addMileage(values));
    } else {
      dispatch(editMileage({mileage: values, editTarget: editTarget}));
      setEditTarget(null);
    }
    setModal(null);
    mileageForm.resetFields();
  };
  const handleCancelExpense = () => {
    setModal(null);
    expenseForm.resetFields();
  };
  const handleCancelMileage = () => {
    setModal(null);
    mileageForm.resetFields();
  };

  const handleEdit = (entry: ItemState | MileageState) => {
    const modifiedEntry = {...entry, date: dayjs(entry.date)};
    setEditTarget(modifiedEntry.id);
    // const entry = entries.find((e) => e.id === id);
    if (entry.kind === "item") {
      expenseForm.setFieldsValue(modifiedEntry);
      setModal("expense");
    } else {
      mileageForm.setFieldsValue(modifiedEntry);
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
      dispatch(resetForm());
      setSubmitting(false);
      setSuccess(true);
    }, 2000);
  };

  console.log({entries, total, needGovId, editTarget});

  if (success) {
    return <SuccessConfirm onConfirm={() => setSuccess(false)}/>;
  }
  return (
    <div className="row">
      <div className="column">
          <div className="titleSpacer">
            <h1>FK-Expenses</h1>
            <span>FI / <strong>EN</strong></span>
          </div>
          <Divider />
          <Form
            labelCol={{span: 4}}
            wrapperCol={{span: 16}}
            layout="horizontal"
            labelAlign="right"
            form={mainForm}
            requiredMark={false}
          >
            <Form.Item name="name" label="Payee name" rules={[{required: true, message: "Please give your name!"}]}>
              <Input placeholder="First Last"/>
            </Form.Item>
            <Form.Item name="contact" label="Payee concact" rules={[{required: true, message: "Please give your contact information!"}]}>
              <Input 
                  placeholder="Telegram / Email / Phone"
              />
            </Form.Item>
            <Form.Item name="iban" label="IBAN" rules={[{required: true, message: "Please give your bank account number!"}]}>
              <Input placeholder="FI 12 3456 7890 1234 56"/>
            </Form.Item>
            <Form.Item name="title" label="Claim title" rules={[{required: true, message: "Please give a title to your expense claim submission!"}]}>
              <Input placeholder="<event> expenses and mileages"/>
            </Form.Item>
            {needGovId ? (
              <Form.Item name="gov_id" label="Personal ID code" rules={[{required: true, message: "Government issues personal identification code is required for paying mileages!"}]}>
                <Input placeholder="123456-789A"/>
              </Form.Item>
            ) : null}
            {entries.length > 0 ? <Divider/> : null} 
            <div className="entries">
              {entries.map((entry) => {
                if (entry.kind === "item") {
                  return <Item key={entry.id} item={entry} onEdit={() => {handleEdit(entry)}} onRemove={() => handleRemove(entry.id)}/>
                } else {
                  return <Mileage
                    key={entry.id}
                    mileage={entry}
                    onEdit={() => {handleEdit(entry)}}
                    onRemove={() => {handleRemove(entry.id)}}
                  />
                }
              })
            }
            </div>
            <Divider />
            <Form.Item
              wrapperCol={{span: 16, offset: 4}}
              className="addButtons"
            >
              <Button
                type="default"
                onClick={showExpense}
                htmlType='button'
                >
                Add an expense
              </Button>
              <Button
                type="default"
                onClick={showMileage}
                htmlType='button'
                >
                Add a mileage
              </Button>
              <span className="total"><strong>Total:</strong> {EURFormat.format(total)}</span>
              <Button
                type="primary"
                htmlType="submit"
                style={{float: "right"}}
                loading={submitting}
                onClick={handleSubmit}
                >
                Submit
              </Button>
            </Form.Item>
          </Form>
          <ItemModal
            form={expenseForm}
            onCancel={handleCancelExpense}
            onOk={handleOkExpense(editTarget)}
            visible={modal === "expense"}/>
          <MileageModal
            form={mileageForm}
            onCancel={handleCancelMileage}
            onOk={handleOkMileage(editTarget)}
            visible={modal === "mileage"}/>
      </div>
    </div>
  )
}