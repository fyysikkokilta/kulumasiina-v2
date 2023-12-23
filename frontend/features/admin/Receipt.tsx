import { Card, Image } from "antd";
import { ReceiptState } from "./adminSlice";
import { apiURL } from "../utils";
import Link from "antd/es/typography/Link";

export const Receipt = (props: { receipt: ReceiptState }) => {
  return (
    <>
      <Card>
        {props.receipt.filename.split(".")[1] !== "pdf" ? (
          <RenderImage id={props.receipt.id} />
        ) : (
          <>
            <Link
              href={`${apiURL}/receipt/${props.receipt.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.receipt.filename}
            </Link>
          </>
        )}
      </Card>
    </>
  );
};
const RenderImage = (props: { id: number }) => {
  return (
    <>
      <Image src={`${apiURL}/receipt/${props.id}`} />
    </>
  );
};
