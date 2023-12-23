import React, { useEffect } from "react";
import { Typography, Table, Button, Space } from "antd";
import {
  type SubmissionState,
  type MileageState,
  type ItemState,
  loadSubmissions,
  stopLoading,
  showDateModal,
  showConfirmPaymentModal,
} from "./adminSlice";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { mileageReimbursementRate, EURFormat, KMFormat } from "../utils";
import {
  deleteEntry,
  denyEntry,
  getEntries,
  payEntry,
  resetEntry,
} from "./api";
import { Receipt } from "./Receipt";
import { AppDispatch } from "app/store";
import SubmitDateModal from "./SubmitDateModal";
import { ConfirmPaymentModal } from "./ConfirmPaymentModal";
import { useLoaderData } from "react-router-dom";
export const loadItems = (dispatch: AppDispatch) => {
  getEntries().then((entries) => {
    dispatch(loadSubmissions(entries));
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

const columns = (entries: tableSubmission[]): ColumnsType<tableSubmission> => {
  const normalizedNames = entries
    .map((entry) => entry.name)
    .map((name) =>
      name
        .toLocaleLowerCase()
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(" "),
    );

  const uniqueNames = normalizedNames.filter(
    (name1, index) =>
      normalizedNames.findIndex((name2) => name1 === name2) === index,
  );
  return [
    {
      title: "Entry id",
      dataIndex: "id",
      key: "id",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.id - b.id,
    },
    {
      // Would be nice to be able to filter with date range also, but antd doesn't support it.
      title: "Submission date",
      dataIndex: "submission_date",
      key: "submissionDate",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      // Allow filtering by name. Substring match.
      filters: uniqueNames
        .map((name) => {
          return { text: name, value: name.toLocaleLowerCase() };
        })
        .sort((a, b) => a.text.localeCompare(b.text, "fi")),
      filterSearch: true,
      onFilter: (value, record) => record.name.toLocaleLowerCase() === value,
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
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      // Allow filtering by status. "submitted", "paid", "approved", "denied"
      filters: [
        {
          text: "Submitted",
          value: "submitted",
        },
        {
          text: "Paid",
          value: "paid",
        },
        {
          text: "Approved",
          value: "approved",
        },
        {
          text: "Denied",
          value: "denied",
        },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];
};

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
      <Button onClick={() => window.open(`/api/entry/${record.id}/pdf`)}>
        Download pdf
      </Button>
      <br />
      <br />

      <Space>
        {record.status === "submitted" && (
          <>
            <Button onClick={() => dispatch(showDateModal(record.id))}>
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
        {record.status === "approved" && (
          <Button onClick={() => dispatch(showConfirmPaymentModal(record.id))}>
            Mark as paid
          </Button>
        )}
        {record.status !== "submitted" && (
          <>
            <Button
              onClick={() =>
                resetEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              Reset
            </Button>
          </>
        )}
        <Button
          danger
          onClick={() => deleteEntry(record.id).then(() => loadItems(dispatch))}
        >
          Remove
        </Button>
      </Space>
    </>
  );
};

export function AdminEntryView() {
  const dispatch = useAppDispatch();
  const entries = useLoaderData() as SubmissionState[];
  useEffect(() => {
    dispatch(loadSubmissions(entries));
    dispatch(stopLoading());
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
  const selected = useAppSelector((state) => state.admin.selected);
  return (
    <>
      <ConfirmPaymentModal entry_id={selected} />
      <SubmitDateModal entry_id={selected} />
      <Typography.Title level={3}>Submissions</Typography.Title>
      <Table
        dataSource={sumEnties}
        columns={columns(sumEnties)}
        expandable={{
          expandedRowRender: expandedRowRender,
        }}
        loading={loading}
      />
    </>
  );
}
