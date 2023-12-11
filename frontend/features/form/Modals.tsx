import React, { useState } from "react";
import {
  Modal,
  Form,
  FormInstance,
  Input,
  DatePicker,
  Upload,
  message as AntdMessage,
} from "antd";
import type { RcFile, UploadProps } from "antd/es/upload";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import { Dayjs } from "dayjs";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import imageCompression from "browser-image-compression";
import { api } from "../utils";

type ModalProps = {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
};

export type MileageFormValues = {
  description: string;
  date: Dayjs;
  route: string;
  distance: string;
  plate_no: string;
};

export type ExpenseFormValues = {
  description: string;
  date: Dayjs;
  value: string;
  receipts: UploadChangeParam;
};

type MileageModalProps = ModalProps & {
  form: FormInstance<MileageFormValues>;
};

type ExpenseModalProps = ModalProps & {
  form: FormInstance<ExpenseFormValues>;
  fileList: UploadFile[];
  setFileList: (fileList: UploadFile[]) => void;
};

export const MileageModal: React.FC<MileageModalProps> = (props) => (
  <Modal
    title="Add a mileage"
    open={props.visible}
    onOk={props.onOk}
    onCancel={props.onCancel}
  >
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      form={props.form}
      requiredMark={false}
    >
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: "Please provide a description!" }]}
      >
        <Input.TextArea
          showCount
          maxLength={500}
          rows={3}
          placeholder="Description"
        />
      </Form.Item>
      <Form.Item
        name="date"
        label="Date"
        rules={[
          { required: true, message: "Please provide a date for the mileage!" },
        ]}
      >
        <DatePicker format="YYYY-MM-DD" picker="date" />
      </Form.Item>
      <Form.Item
        name="route"
        label="Route"
        rules={[{ required: true, message: "Please provide the used route!" }]}
      >
        <Input.TextArea
          showCount
          maxLength={200}
          rows={2}
          placeholder="guild room - venue <address> - guild room"
        />
      </Form.Item>
      <Form.Item
        name="distance"
        label="Distance"
        rules={[
          {
            required: true,
            message: "Please provide the distance driven!",
          },
          {
            pattern: /^\d+([.,]\d{1,2})?$/,
            message: "Please provide a valid positive number!",
          },
        ]}
      >
        <Input suffix="km" placeholder="0" />
      </Form.Item>
      <Form.Item
        name="plate_no"
        label="Plate number"
        rules={[
          {
            required: true,
            message: "Please provide the plate number of the vehicle!",
          },
        ]}
      >
        <Input placeholder="ABC-123" />
      </Form.Item>
    </Form>
  </Modal>
);

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const ItemModal = (props: ExpenseModalProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  // const [fileList, setFileList] = useState<UploadFile[]>();

  const handlePreview = async (file: UploadFile) => {
    if (!file.url) return;

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url.substring(file.url.lastIndexOf("/") + 1),
    );
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
    props.setFileList(newFileList);

  const resetUpload = () => {
    setPreviewOpen(false);
    setPreviewImage("");
    setPreviewTitle("");
    props.setFileList([]);
  };
  const beforeUpload = (file: RcFile) => {
    // check pdf size is under 4MB
    if (file.size > 4 * 1024 * 1024) {
      if (file.type === "application/pdf") {
        AntdMessage.error("PDF needs to be under 4MB!", 5);
        return Upload.LIST_IGNORE;
      }
      // compress too large image files
      const options = {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      return imageCompression(file, options);
    }
    return true;
  };
  const upload = (options: UploadRequestOption) => {
    const { onSuccess, onError, file, action } = options;
    console.log(options);
    const formData = new FormData();
    formData.append("file", file);
    api
      .post(action, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (onSuccess) {
          console.log(response.data);
          onSuccess(response.data);
        }
      })
      .catch((err) => {
        if (onError) {
          onError(err);
        }
      });
  };
  console.log("FILE LIST:", props.fileList);
  console.log("FORM VALUES:", props.form.getFieldsValue());
  return (
    <Modal
      title="Add an expense"
      open={props.visible}
      onOk={() => {
        props.onOk();
        resetUpload();
      }}
      onCancel={() => {
        props.onCancel();
        resetUpload();
      }}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        layout="horizontal"
        form={props.form}
        requiredMark={false}
      >
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please provide a description!" }]}
        >
          <Input.TextArea
            showCount
            maxLength={500}
            rows={3}
            placeholder="Description"
          />
        </Form.Item>
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
            inputMode="numeric"
            step="0.01"
            min="0"
            lang="en" // TODO: Make this sync with selected language from i18n (fi/en)
          />
        </Form.Item>
        <Form.Item
          name="date"
          label="Date"
          rules={[
            {
              required: true,
              message: "Please provide a date for the expense!",
            },
          ]}
        >
          <DatePicker format="YYYY-MM-DD" picker="date" />
        </Form.Item>
        <Form.Item name="receipts" label="Receipt">
          <Upload
            action="/receipt"
            listType="picture-card"
            fileList={props.fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            accept="image/*,.pdf"
            beforeUpload={beforeUpload}
            customRequest={upload}
          >
            <div>
              {/* <PlusOutlined style={{}}/> */}
              +<br />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>
        <Modal
          open={previewOpen}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
          width="80%"
        >
          <img alt="example" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </Form>
    </Modal>
  );
};
