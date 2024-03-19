import React from "react";
import { Modal, Form, Button, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideRemoveEntriesModal } from "./adminSlice";
import { deleteOldArchivedEntries } from "./api";
import { loadItems } from "./EntryView";
export const RemoveEntriesModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.removeEntriesModal);
  // disable @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = () => {
    deleteOldArchivedEntries()
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideRemoveEntriesModal()));
  };
  return (
    <>
      <Modal
        title="Remove archived items"
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideRemoveEntriesModal())}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item>
            <Typography.Paragraph type="danger">
              Are you sure you want to remove old archived items? This action
              cannot be undone.
            </Typography.Paragraph>
            <Typography.Paragraph>
              Make sure that for each paid item the pdf has been archived to
              Procountor.
            </Typography.Paragraph>
          </Form.Item>
          <Form.Item>
            <Button danger type="primary" htmlType="submit">
              Remove
            </Button>
            <Button
              key="cancel"
              onClick={() => dispatch(hideRemoveEntriesModal())}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RemoveEntriesModal;
