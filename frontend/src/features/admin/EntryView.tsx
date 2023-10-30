import React, { useEffect } from "react";
import { Typography, Table, Button, Menu, Space } from "antd";
import {
  type SubmissionState,
  type MileageState,
  type ItemState,
  addSubmissions,
  clearSubmissions,
} from "./adminSlice";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { mileageReimbursementRate, EURFormat, KMFormat } from "../utils";
import { getEntries } from "./api";
import { Receipt } from "./Receipt";
import ButtonGroup from "antd/es/button/button-group";

const calculateSum = (submission: SubmissionState) => {
  const mileageSum = submission.mileages.reduce((acc, item) => {
    return acc + item.distance * mileageReimbursementRate;
  }, 0);
  const itemSum = submission.items.reduce((acc, item) => {
    return acc + item.value_cents / 100;
  }, 0);
  return mileageSum + itemSum;
};

interface tableSubmission extends SubmissionState {
  key: React.Key;
  total: number;
}

const columns: ColumnsType<tableSubmission> = [
  {
    title: "Submission date",
    dataIndex: "submissionDate",
    key: "submissionDate",
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Claimed expense",
    dataIndex: "total",
    key: "total",
    render: (value) => EURFormat.format(value),
  },
  {
    title: "Submission title",
    dataIndex: "title",
    key: "title",
  },
];

interface expandedRowTable {
  key: React.Key;
  rendered: JSX.Element;
  type: string;
  index: number;
}

const expandedColumns: ColumnsType<expandedRowTable> = [
  {
    title: "Row",
    dataIndex: "rendered",
    key: "rendered",
  },
];

const renderMileage = (mileage: MileageState) => {
  return (
    <Typography.Text>
      Mileage: <strong>{mileage.date}</strong>{" "}
      {KMFormat.format(mileage.distance)} &rarr;{" "}
      {EURFormat.format(mileage.distance * mileageReimbursementRate)}
    </Typography.Text>
  );
};

const renderItem = (item: ItemState) => {
  return (
    <Typography.Text>
      Item: <strong>{item.date}</strong>{" "}
      {EURFormat.format(item.value_cents / 100)} {item.description}{" "}
    </Typography.Text>
  );
};

const expandedRowRender = (record: tableSubmission) => {
  const submissionRows: expandedRowTable[] = record.mileages
    .map((mileage, i) => {
      return {
        key: `mileage-${mileage.id}`,
        rendered: renderMileage(mileage),
        type: "mileage",
        index: i,
      };
    })
    .concat(
      record.items.map((item, i) => ({
        key: `item-${item.id}`,
        rendered: renderItem(item),
        type: "item",
        index: i,
      })),
    );
  return (
    <>
      <Table
        dataSource={submissionRows}
        columns={expandedColumns}
        expandable={{
          expandedRowRender: (a) => {
            return (
              <>
                <Typography.Title>Reciepts:</Typography.Title>
                {record.items[a.index].receipts.map((r) => {
                  return <Receipt reciept={r} />;
                })}
              </>
            );
          },
          rowExpandable: (r) => r.type === "item",
        }}
        pagination={false}
        showHeader={false}
      />
      <br></br>
      <Space>
        <Button type="primary">Accept</Button>
        <Button type="primary" danger>
          Deny
        </Button>
        <Button>Mark as paid</Button>
      </Space>
    </>
  );
};

export function AdminEntryView() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // dispatch(clearSubmissions());

    getEntries().then((entries) => {
      dispatch(clearSubmissions());

      dispatch(addSubmissions(entries));
    });
  }, []);
  const adminEntries = useAppSelector((state) => state.admin);
  const sumEnties: Array<tableSubmission> = adminEntries.map((entry) => {
    return {
      ...entry,
      key: entry.id,
      total: calculateSum(entry),
    };
  });
  return (
    <>
      <Typography.Title level={3}>Submissions</Typography.Title>
      <Table
        dataSource={sumEnties}
        columns={columns}
        expandable={{
          expandedRowRender: expandedRowRender,
        }}
      />
    </>
  );
}
