import React from "react";
import { Modal, Form, Button, Input } from "antd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { ItemState, hideEditItemModal } from "./adminSlice";
import { modifyItem } from "./api";
import { loadItems } from "./EntryView";
export const EditItemModal: React.FC<{ item: ItemState }> = ({ item }) => {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.admin.editItemModal);

  // disable @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (values: { value: string }) => {
    const body = {
      value_cents: Math.round(Number(values.value.replace(",", ".")) * 100),
    };
    modifyItem(item.id, body)
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideEditItemModal()));
  };
  return (
    <>
      <Modal
        title="Edit item"
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideEditItemModal())}
      >
        <Form
          onFinish={handleSubmit}
          initialValues={{ value: item.value_cents / 100 }}
        >
          <Form.Item
            name="value"
            label="Amount"
            rules={[
              { required: true, message: "Please provide expense value!" },
              {
                pattern: /^\d+([.,]\d{1,2})?$/,
                message: "Please provide a valid positive number!",
              },
            ]}
          >
            <Input
              suffix="€"
              placeholder="0.00"
              inputMode="decimal"
              step="0.01"
              min="0"
              lang="en" // TODO: Make this sync with selected language from i18n (fi/en)
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Confirm edit
            </Button>
            <Button key="cancel" onClick={() => dispatch(hideEditItemModal())}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EditItemModal;
