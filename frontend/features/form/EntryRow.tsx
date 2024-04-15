import React from "react";
import { Button, Form, Upload } from "antd";
import type { ColProps } from "antd";
import { EURFormat, KMFormat, mileageReimbursementRate } from "../utils";
import type { ItemState, MileageState, FormState } from "./formSlice";
import { useTranslation } from "react-i18next";

interface MileageProps {
  mileage: MileageState;
  onEdit: () => void;
  onRemove: () => void;
  wrapperProps: ColProps;
  labelProps: ColProps;
}

export const Mileage: React.FC<MileageProps> = ({
  mileage,
  onEdit,
  onRemove,
  wrapperProps,
  labelProps,
}) => {
  const { t } = useTranslation("translation", { keyPrefix: "form.main" });
  return (
    <Form.Item
      className="expenseCard mileage"
      key={mileage.id}
      label="Mileage"
      wrapperCol={wrapperProps}
      labelCol={labelProps}
    >
      <div className="separator">
        <span>
          <span className="date">{mileage.date}</span>
          <span className="value">
            {KMFormat.format(mileage.distance)} &rarr;{" "}
            {EURFormat.format(mileage.distance * mileageReimbursementRate)}
          </span>
          <span className="plate-no"># {mileage.plate_no.toUpperCase()}</span>
        </span>
        <div>
          <Button type="link" onClick={onEdit}>
            {t("edit")}
          </Button>
          <Button type="primary" danger onClick={onRemove}>
            {t("remove")}
          </Button>
        </div>
      </div>
      <p className="description">{mileage.description}</p>
      <p className="route">{mileage.route}</p>
    </Form.Item>
  );
};

interface ItemProps {
  files: FormState["files"];
  item: ItemState;
  onEdit: () => void;
  onRemove: () => void;
  wrapperProps: ColProps;
  labelProps: ColProps;
}

export const Item: React.FC<ItemProps> = ({
  files,
  item,
  onEdit,
  onRemove,
  wrapperProps,
  labelProps,
}) => {
  const { t } = useTranslation("translation", { keyPrefix: "form.main" });
  const ownFiles = item.receipts.map((id) => files[id]);
  return (
    <Form.Item
      className="expenseCard item"
      key={item.id}
      label="Expense item"
      wrapperCol={wrapperProps}
      labelCol={labelProps}
    >
      {/* <span className="type">Expense item</span> */}
      <div className="separator">
        <span>
          <span className="date">{item.date}</span>
          <span className="value">
            {EURFormat.format(item.value_cents / 100)}
          </span>
        </span>
        <div>
          <Button type="link" onClick={onEdit}>
            {t("edit")}
          </Button>
          <Button type="primary" danger onClick={onRemove}>
            {t("remove")}
          </Button>
        </div>
      </div>
      <p className="description">{item.description}</p>
      <Upload
        listType="picture-card"
        fileList={ownFiles}
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: false,
          showDownloadIcon: false,
        }}
      />
    </Form.Item>
  );
};
