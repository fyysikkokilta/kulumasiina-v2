import React, { useState } from 'react';
import { Button, Modal, Row, Col, Space, Divider, Form, Input, Upload, DatePicker } from 'antd';
import type { DatePickerProps } from 'antd/';
import type { ItemState, MileageState, addItemInterface } from './formSlice';

import './ExpenseForm.css';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  addItem,
  addMileage,
  removeEntry,
} from './formSlice';

const mileageReimbursementRate = 0.22;

const EUR = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

const KM = new Intl.NumberFormat("fi-FI", {
  style: "unit",
  unit: "kilometer",
});

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${m}-${d}`;
}

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
          <span className="value">{KM.format(mileage.distance)} &rarr; {EUR.format(mileage.distance * mileageReimbursementRate)}</span>
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
    // <div className="expenseCard item" key={entry.id}>
    //   <span className="type">Expense item</span>
    //   <span className="date">{entry.date}</span>
    //   <span className="value">{EUR.format(entry.value)}</span>
    //   <Button type="primary" danger>Remove</Button>
    //   <span className="description">{entry.description}</span>
    // </div>
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
            <span className="value">{EUR.format(item.value)}</span>
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


export function ExpenseForm() {
  const [modal, setModal] = useState<null | "expense" | "mileage">(null);
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

  const showExpense = () => {
    setModal("expense");
  };
  const showMileage = () => {
    setModal("mileage");
  };
  const handleRemove = (id: Number) => {
    dispatch(removeEntry(id));
  }
  const handleOkExpense = () => {
    // gather the data from the form
    const values = expenseForm.getFieldsValue();
    console.log(values.date);
    // This is an antd date object?? Works anyways.
    values.date = values.date.format('YYYY-MM-DD');
    dispatch(addItem(values));
    setModal(null);
    expenseForm.resetFields();
  };
  const handleOkMileage = () => {
    const values = mileageForm.getFieldsValue();
    values.date = values.date.format('YYYY-MM-DD');
    dispatch(addMileage(values));
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
          >
            <Form.Item label="Payee name">
              <Input placeholder="First Last"/>
            </Form.Item>
            <Form.Item label="Payee concact">
              <Input 
                  placeholder="Telegram / Email / Phone"
              />
            </Form.Item>
            <Form.Item label="IBAN">
              <Input placeholder="FI 12 3456 7890 1234 56"/>
            </Form.Item>
            <Form.Item label="Claim title">
              <Input placeholder="<event> expenses and mileages"/>
            </Form.Item>
          {entries.length > 0 ? <Divider /> : null} 
          <div className="entries">
            {entries.map((entry) => {
              if (entry.kind === "item") {
                return <Item key={entry.id} item={entry} onEdit={() => {}} onRemove={() => handleRemove(entry.id)}/>
              } else {
                return <Mileage
                  key={entry.id}
                  mileage={entry}
                  onEdit={() => {}}
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
            <span className="total"><strong>Total:</strong> {EUR.format(total)}</span>
            <Button
              type="primary"
              htmlType='submit'
              style={{float: "right"}}
              >
              Submit
            </Button>
          </Form.Item>
          </Form>
          <Modal
            title="Add an expense"
            open={modal === "expense"}
            onOk={handleOkExpense}
            onCancel={handleCancelExpense}
          >
            <Form
              labelCol={{span: 6}}
              wrapperCol={{span: 18}}
              layout="horizontal"
              form={expenseForm}
            >
              <Form.Item name="description" label="Description">
                <Input placeholder="Description"/>
              </Form.Item>
              <Form.Item name="value" label="Amount">
                <Input placeholder="0.00"/>
              </Form.Item>
              <Form.Item name="date" label="Date">
                <DatePicker format="YYYY-MM-DD" picker="date"/>
              </Form.Item>
              {/* TODO: Think about receipt handling later */}
              <Form.Item label="Receipt">
                <Upload>
                  <Button>Upload</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>
          <Modal
            title="Add a mileage"
            open={modal === "mileage"}
            onOk={handleOkMileage}
            onCancel={handleCancelMileage}
          >
            <Form
              labelCol={{span: 6}}
              wrapperCol={{span: 18}}
              layout="horizontal"
              form={mileageForm}
            >
              <Form.Item name="description" label="Description">
                <Input placeholder="Description"/>
              </Form.Item>
              <Form.Item name="date" label="Date">
                <DatePicker format="YYYY-MM-DD" picker="date"/>
              </Form.Item>
              <Form.Item name="route" label="Route">
                <Input placeholder="guild room - venue <address> - guild room"/>
              </Form.Item>
              <Form.Item name="distance" label="Distance">
                <Input placeholder="0"/>
              </Form.Item>
              <Form.Item name="plate_no" label="Plate number">
                <Input placeholder="ABC-123"/>
              </Form.Item>
            </Form>
          </Modal>
      </div>
    </div>
  )
}