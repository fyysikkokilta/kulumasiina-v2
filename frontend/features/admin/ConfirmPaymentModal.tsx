import React from "react";
import { Modal, Form, DatePicker, Button } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { hideConfirmPaymentModal } from "./adminSlice";
import { payEntries, payEntry } from "./api";
import { loadItems } from "./EntryView";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "react-i18next";
dayjs.extend(utc);

export const ConfirmPaymentModal: React.FC<{
  entry_ids: number | number[];
}> = ({ entry_ids }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("translation", {
    keyPrefix: "admin.confirm_payment_modal",
  });
  const show = useAppSelector((state) => state.admin.confirmPaymentModal);

  const handleSubmit = (values: { date: Dayjs }) => {
    const date = values.date.utcOffset(0).startOf("day").toISOString();
    const promise = Array.isArray(entry_ids)
      ? payEntries(entry_ids, date)
      : payEntry(entry_ids, date);
    promise
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideConfirmPaymentModal()));
  };
  const now = dayjs();
  return (
    <>
      <Modal
        title={t("title")}
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideConfirmPaymentModal())}
      >
        <Form onFinish={handleSubmit} initialValues={{ date: now }}>
          {/* TODO: For some reason the default value is not considered valid here! */}
          <Form.Item
            name="date"
            label={t("date")}
            rules={[{ required: true, message: t("date_error") }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t("submit")}
            </Button>
            <Button
              key="cancel"
              onClick={() => dispatch(hideConfirmPaymentModal())}
            >
              {t("cancel")}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConfirmPaymentModal;
