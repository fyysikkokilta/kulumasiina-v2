import React from "react";
import { Modal, Form, Button, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideRemoveEntryModal } from "./adminSlice";
import { deleteEntry } from "./api";
import { loadItems } from "./EntryView";
import { useTranslation } from "react-i18next";
export const RemoveEntryModal: React.FC<{ entry_ids: number | number[] }> = ({
  entry_ids,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("translation", {
    keyPrefix: "admin.remove_entry_modal",
  });
  const show = useAppSelector((state) => state.admin.removeEntryModal);

  const handleSubmit = () => {
    if (Array.isArray(entry_ids)) return;
    deleteEntry(entry_ids)
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideRemoveEntryModal()));
  };
  return (
    <>
      <Modal
        title={t("title")}
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideRemoveEntryModal())}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item>
            <Typography.Paragraph type="danger">
              {t("text_1")}
            </Typography.Paragraph>
            <Typography.Paragraph>{t("text_2")}</Typography.Paragraph>
          </Form.Item>
          <Form.Item>
            <Button danger type="primary" htmlType="submit">
              {t("remove")}
            </Button>
            <Button
              key="cancel"
              onClick={() => dispatch(hideRemoveEntryModal())}
            >
              {t("cancel")}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RemoveEntryModal;
