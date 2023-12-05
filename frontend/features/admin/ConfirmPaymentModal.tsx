import React from "react";
import { Modal, Form, DatePicker, Button, Input } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideConfirmPaymentModal } from "./adminSlice";
import { approveEntry, payEntry } from "./api";
import { loadItems } from "./EntryView";
import dayjs, { Dayjs } from "dayjs";
export const ConfirmPaymentModal: React.FC<{ entry_id: number }> = ({
  entry_id,
}) => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.confirmPaymentModal);
  // disable @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (values: { date: Dayjs }) => {
    payEntry(entry_id, values.date.toISOString())
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideConfirmPaymentModal()));
  };
  const now = dayjs();
  return (
    <>
      <Modal
        title="Confirm payment"
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideConfirmPaymentModal())}
      >
        <Form onFinish={handleSubmit} initialValues={{ date: now }}>
          {/* TODO: For some reason the default value is not considered valid here! */}
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
            <Button
              key="cancel"
              onClick={() => dispatch(hideConfirmPaymentModal())}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConfirmPaymentModal;
