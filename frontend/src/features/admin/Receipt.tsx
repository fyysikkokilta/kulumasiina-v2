import { Card, Image } from "antd";
import { RecieptState } from "./adminSlice";
import { useEffect } from "react";
import { apiURL } from "../utils";
import Link from "antd/es/typography/Link";

export const Receipt = (props: { reciept: RecieptState }) => {
  return (
    <>
      <Card>
        {props.reciept.filename.split(".")[1] !== "pdf" ? (
          <RenderImage id={props.reciept.id} />
        ) : (
          <>
            <Link
              href={`${apiURL}/receipt/${props.reciept.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.reciept.filename}
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
