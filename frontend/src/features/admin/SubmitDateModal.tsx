import React, { useState } from "react";
import { Modal, Form, DatePicker, Button } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideDateModal, showDateModal } from "./adminSlice";
import { useSelector } from "react-redux";
import { approveEntry } from "./api";
import { loadItems } from "./EntryView";

export const SubmitDateModal: React.FC<{ entry_id: number }> = ({
  entry_id,
}) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.dateModal);
  const handleSubmit = (values: any) => {
    approveEntry(entry_id, values.date.toISOString())
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideDateModal()));
  };
  return (
    <>
      <Modal
        title="Submit Date"
        footer={[
          <Button key="cancel" onClick={() => dispatch(hideDateModal())}>
            Cancel
          </Button>,
        ]}
        open={show}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SubmitDateModal;
