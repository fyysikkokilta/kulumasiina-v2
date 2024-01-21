import React from "react";
import { Modal, Form, Button, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideRemoveEntryModal } from "./adminSlice";
import { deleteEntry } from "./api";
import { loadItems } from "./EntryView";
export const RemoveEntryModal: React.FC<{ entry_id: number }> = ({
  entry_id,
}) => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.removeEntryModal);
  // disable @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = () => {
    deleteEntry(entry_id)
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideRemoveEntryModal()));
  };
  return (
    <>
      <Modal
        title="Remove item"
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideRemoveEntryModal())}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item>
            <Typography.Paragraph type="danger">
              Are you sure you want to remove this item? This action cannot be
              undone.
            </Typography.Paragraph>
            <Typography.Paragraph>
              If the item has been approved and paid, make sure that the pdf has
              been archived to Procountor.
            </Typography.Paragraph>
          </Form.Item>
          <Form.Item>
            <Button danger type="primary" htmlType="submit">
              Remove
            </Button>
            <Button
              key="cancel"
              onClick={() => dispatch(hideRemoveEntryModal())}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RemoveEntryModal;
