import React, { useState } from "react";
import { Modal, Form, DatePicker, Button, Input } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideDateModal, showDateModal } from "./adminSlice";
import { useSelector } from "react-redux";
import { approveEntry } from "./api";
import { loadItems } from "./EntryView";

export const SubmitDateModal: React.FC<{ entry_id: number }> = ({
  entry_id,
}) => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.dateModal);
  const handleSubmit = (values: any) => {
    approveEntry(entry_id, values.date.toISOString(), values.meeting_num)
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideDateModal()));
  };
  return (
    <>
      <Modal title="Submit Date" open={show} footer={[]}>
        <Form onFinish={handleSubmit}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="meeting_num"
            label="Meeting num."
            rules={[
              { required: true, message: "Please write the meeting number" },
            ]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button key="cancel" onClick={() => dispatch(hideDateModal())}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SubmitDateModal;
