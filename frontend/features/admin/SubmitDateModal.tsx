import React from "react";
import { Modal, Form, DatePicker, Button, Input } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideDateModal as hideApproveModal } from "./adminSlice";
import { approveEntry } from "./api";
import { loadItems } from "./EntryView";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export const SubmitDateModal: React.FC<{ entry_id: number }> = ({
  entry_id,
}) => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.dateModal);
  // disable @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (values: { date: Dayjs; approvalNote: string }) => {
    approveEntry(
      entry_id,
      values.date.utcOffset(0).startOf("day").toISOString(),
      values.approvalNote,
    )
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideApproveModal()));
  };
  return (
    <>
      <Modal
        title="Submit Date"
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideApproveModal())}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="approvalNote"
            label="Approval note."
            rules={[
              {
                required: true,
                message:
                  "Please write the meeting number or other identifier of the approval.",
              },
            ]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button key="cancel" onClick={() => dispatch(hideApproveModal())}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SubmitDateModal;
