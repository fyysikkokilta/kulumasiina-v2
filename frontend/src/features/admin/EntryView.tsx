import React, { useEffect } from "react";
import { Typography, Table, Button, Menu, Space } from "antd";
import {
  type SubmissionState,
  type MileageState,
  type ItemState,
  addSubmissions,
  clearSubmissions,
  startLoading,
  stopLoading,
} from "./adminSlice";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { mileageReimbursementRate, EURFormat, KMFormat } from "../utils";
import { approveEntry, denyEntry, getEntries } from "./api";
import { Receipt } from "./Receipt";
import ButtonGroup from "antd/es/button/button-group";
import { AppDispatch } from "app/store";
const loadItems = (dispatch: AppDispatch) => {
  getEntries().then((entries) => {
    dispatch(clearSubmissions());

    dispatch(addSubmissions(entries));
    dispatch(stopLoading());
  });
};

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
  description: string;
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
      {EURFormat.format(item.value_cents / 100)}
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
        description: mileage.description,
      };
    })
    .concat(
      record.items.map((item, i) => ({
        key: `item-${item.id}`,
        rendered: renderItem(item),
        type: "item",
        index: i,
        description: item.description,
      })),
    );
  const dispatch = useAppDispatch();
  return (
    <>
      <Table
        dataSource={submissionRows}
        columns={expandedColumns}
        expandable={{
          expandedRowRender: (a) => {
            return (
              <>
                <Typography.Title level={4}>Description: </Typography.Title>
                <Typography.Text>{a.description}</Typography.Text>
                {a.type === "mileage" ? (
                  <> </>
                ) : (
                  <>
                    {" "}
                    <Typography.Title level={4}>Reciepts:</Typography.Title>
                    {record.items[a.index].receipts.map((r) => {
                      return <Receipt key={r.id} reciept={r} />;
                    })}
                  </>
                )}
              </>
            );
          },
        }}
        pagination={false}
        showHeader={false}
      />
      <br></br>
      <h4>Status: {record.status}</h4>

      <Space>
        {record.status === "submitted" && (
          <>
            <Button
              onClick={() =>
                approveEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              Accept
            </Button>
            <Button
              onClick={() =>
                denyEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              Deny
            </Button>
          </>
        )}
        <Button>Mark as paid</Button>
        <Button danger>Remove</Button>
      </Space>
    </>
  );
};

export function AdminEntryView() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // dispatch(clearSubmissions());
    loadItems(dispatch);
  }, []);
  const adminEntries = useAppSelector((state) => state.admin.submissions);
  const loading = useAppSelector((state) => state.admin.loading);

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
        loading={loading}
      />
    </>
  );
}
