import React, { useEffect, useState } from "react";
import {
  DatePicker,
  Typography,
  Table,
  Button,
  Space,
  UploadFile,
  Form,
} from "antd";
const { RangePicker } = DatePicker;
import dayjs, { Dayjs } from "dayjs";
import {
  type SubmissionState,
  type MileageState,
  type ItemState,
  loadSubmissions,
  stopLoading,
  showDateModal,
  showConfirmPaymentModal,
  showRemoveEntryModal,
  showEditItemModal,
  showRemoveEntriesModal,
  hideEditItemModal,
  showEditMileageModal,
  hideEditMileageModal,
} from "./adminSlice";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  mileageReimbursementRate,
  deleteArchivedAgeLimit,
  EURFormat,
  KMFormat,
} from "../utils";
import {
  archiveEntries,
  archiveEntry,
  denyEntries,
  denyEntry,
  getEntries,
  modifyItem,
  modifyMileage,
  resetEntries,
  resetEntry,
} from "./api";
import { Receipt } from "./Receipt";
import { AppDispatch } from "app/store";
import SubmitDateModal from "./SubmitDateModal";
import { ConfirmPaymentModal } from "./ConfirmPaymentModal";
import { useLoaderData } from "react-router-dom";
import RemoveItemModal from "./RemoveEntryModal";
import RemoveEntriesModal from "./RemoveEntriesModal";
import {
  ExpenseFormValues,
  ItemModal,
  MileageFormValues,
  MileageModal,
} from "../form/Modals";
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
    {
      title: "Archived",
      dataIndex: "archived",
      key: "archived",
      render: (value) => (value ? "yes" : "no"),
      // Allow filtering by archived status.
      filters: [
        {
          text: "Archived",
          value: true,
        },
        {
          text: "Not archived",
          value: false,
        },
      ],
      onFilter: (value, record) => record.archived === value,
      defaultFilteredValue: ["false"],
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
  const dispatch = useAppDispatch();
  return (
    <Space>
      <Typography.Text>
        Mileage: <strong>{mileage.date}</strong>{" "}
        {KMFormat.format(mileage.distance)} &rarr;{" "}
        {EURFormat.format(mileage.distance * mileageReimbursementRate)}
      </Typography.Text>
      <Button onClick={() => dispatch(showEditMileageModal(mileage))}>
        Edit
      </Button>
    </Space>
  );
};

const renderItem = (item: ItemState) => {
  const dispatch = useAppDispatch();
  return (
    <Space>
      <Typography.Text>
        Item: <strong>{item.date}</strong>{" "}
        {EURFormat.format(item.value_cents / 100)}
      </Typography.Text>
      <Button onClick={() => dispatch(showEditItemModal(item))}>Edit</Button>
    </Space>
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
                    <Typography.Title level={4}>Receipts:</Typography.Title>
                    {record.items[a.index].receipts.map((r) => {
                      return <Receipt key={r.id} receipt={r} />;
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
      <h4>Contact info: {record.contact}</h4>
      <Space>
        <Button onClick={() => window.open(`/api/entry/${record.id}/pdf`)}>
          Download pdf
        </Button>
        {(record.status === "paid" || record.status === "approved") && (
          <Button onClick={() => window.open(`/api/entry/${record.id}/csv`)}>
            {record.status === "paid" ? "Download zip" : "Download csv"}
          </Button>
        )}
      </Space>
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
        {record.status !== "submitted" && !record.archived && (
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
        {(record.status === "paid" || record.status === "denied") &&
          !record.archived && (
            <Button
              danger
              onClick={() =>
                archiveEntry(record.id).then(() => loadItems(dispatch))
              }
            >
              Archive
            </Button>
          )}
        {record.archived && (
          <Button
            danger
            onClick={() => dispatch(showRemoveEntryModal(record.id))}
          >
            Remove
          </Button>
        )}
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

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>();

  const [expenseFileList, setExpenseFileList] = useState<UploadFile[]>([]);
  const [editExpenseForm] = Form.useForm<ExpenseFormValues>();

  const [editMileageForm] = Form.useForm<MileageFormValues>();

  const sumEnties: Array<tableSubmission> = adminEntries
    .filter((entry) => {
      if (dateRange) {
        const date = new Date(entry.submission_date);
        return dateRange[0].toDate() <= date && date <= dateRange[1].toDate();
      }
      return true;
    })
    .map((entry) => {
      return {
        ...entry,
        key: entry.id,
        total: calculateSum(entry),
      };
    });
  const selected = useAppSelector((state) => state.admin.selected);

  const selectedItem = useAppSelector((state) => state.admin.selectedItem);
  const showEditItemModal = useAppSelector(
    (state) => state.admin.editItemModal,
  );

  const selectedMileage = useAppSelector(
    (state) => state.admin.selectedMileage,
  );
  const showEditMileageModal = useAppSelector(
    (state) => state.admin.editMileageModal,
  );

  useEffect(() => {
    if (selectedItem) {
      const formValues = {
        description: selectedItem.description,
        date: dayjs(selectedItem.date) as Dayjs,
        value: String(selectedItem.value_cents / 100),
      };
      editExpenseForm.setFieldsValue(formValues);
      setExpenseFileList(
        selectedItem.receipts.map((r) => {
          return {
            uid: String(r.id),
            name: r.filename,
            status: "done",
            response: r.id,
            url: `/api/receipt/${r.id}`,
          };
        }),
      );
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedMileage) {
      const formValues = {
        date: dayjs(selectedMileage.date) as Dayjs,
        distance: String(selectedMileage.distance),
        description: selectedMileage.description,
        route: selectedMileage.route,
        plate_no: selectedMileage.plate_no,
      };
      editMileageForm.setFieldsValue(formValues);
    }
  }, [selectedMileage]);

  const handleCancelEditExpense = () => {
    dispatch(hideEditItemModal());
    editExpenseForm.resetFields();
    setExpenseFileList([]);
  };

  const handleOkEditExpense = async () => {
    try {
      await editExpenseForm.validateFields();
    } catch (err) {
      return;
    }
    const values = editExpenseForm.getFieldsValue();
    const body = {
      description: values.description,
      date: values.date.format("YYYY-MM-DD"),
      value_cents: Math.round(Number(values.value.replace(",", ".")) * 100),
      receipts: expenseFileList.map((file) => file.response as number),
    };
    modifyItem(selectedItem.id, body).then(() => {
      dispatch(hideEditItemModal());
      loadItems(dispatch);
      editExpenseForm.resetFields();
      setExpenseFileList([]);
    });
  };

  const handleCancelEditMileage = () => {
    dispatch(hideEditMileageModal());
    editMileageForm.resetFields();
  };

  const handleOkEditMileage = async () => {
    try {
      await editMileageForm.validateFields();
    } catch (err) {
      return;
    }
    const values = editMileageForm.getFieldsValue();
    const body = {
      date: values.date.format("YYYY-MM-DD"),
      description: values.description,
      route: values.route,
      plate_no: values.plate_no,
      distance: Number(values.distance.replace(",", ".")),
    };
    modifyMileage(selectedMileage.id, body).then(() => {
      dispatch(hideEditMileageModal());
      loadItems(dispatch);
      editMileageForm.resetFields();
    });
  };

  const toBeDeleted = adminEntries
    .filter((entry) => entry.archived)
    .filter((entry) => {
      const date =
        entry.status === "paid"
          ? entry.paid_date && dayjs(entry.paid_date)
          : entry.rejection_date && dayjs(entry.rejection_date);
      const monthAgo = dayjs().subtract(deleteArchivedAgeLimit, "days");
      return date && date.isBefore(monthAgo);
    }).length;

  const selectionType =
    selectedIndices.length > 0
      ? adminEntries.find((entry) => entry.id === selectedIndices[0])?.status
      : undefined;

  const hasUnArchivedSelections =
    selectedIndices.length > 0 &&
    selectedIndices.every((id) => {
      return adminEntries.find((entry) => entry.id === id)?.archived === false;
    });
  // rowSelection object indicates the need for row selection
  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedIndices(selectedRowKeys as number[]);
    },
    getCheckboxProps: (record: tableSubmission) => ({
      name: String(record.id),
      disabled: selectionType ? record.status !== selectionType : false,
    }),
  };

  return (
    <>
      <ConfirmPaymentModal entry_ids={selected} />
      <SubmitDateModal entry_ids={selected} />
      <RemoveItemModal entry_ids={selected} />
      <RemoveEntriesModal />
      <ItemModal
        form={editExpenseForm}
        onCancel={handleCancelEditExpense}
        onOk={handleOkEditExpense}
        visible={showEditItemModal}
        fileList={expenseFileList}
        setFileList={setExpenseFileList}
      />
      <MileageModal
        form={editMileageForm}
        onCancel={handleCancelEditMileage}
        onOk={handleOkEditMileage}
        visible={showEditMileageModal}
      />
      <Typography.Title level={3} style={{ display: "inline-block" }}>
        Submissions
      </Typography.Title>
      <div
        style={{
          float: "right",
          display: "inline-block",
          marginBlockStart: "2em",
        }}
      >
        <Space>
          {selectedIndices.length > 0 && selectionType == "paid" && (
            <Button
              onClick={() => {
                window.open(
                  `/api/entry/multi/csv?entry_ids=${selectedIndices.join(",")}`,
                );
              }}
            >
              Download combined zip
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == "submitted" && (
            <Button onClick={() => dispatch(showDateModal(selectedIndices))}>
              Accept selected
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == "submitted" && (
            <Button
              onClick={() =>
                denyEntries(selectedIndices).then(() => loadItems(dispatch))
              }
            >
              Deny selected
            </Button>
          )}
          {hasUnArchivedSelections && selectionType == "approved" && (
            <Button
              onClick={() => dispatch(showConfirmPaymentModal(selectedIndices))}
            >
              Mark selected as paid
            </Button>
          )}
          {hasUnArchivedSelections &&
            ["denied", "paid"].includes(selectionType!) && (
              <Button
                onClick={() =>
                  archiveEntries(selectedIndices).then(() =>
                    loadItems(dispatch),
                  )
                }
              >
                Archive selected
              </Button>
            )}
          {hasUnArchivedSelections &&
            ["denied", "approved", "paid"].includes(selectionType!) && (
              <Button
                onClick={() =>
                  resetEntries(selectedIndices).then(() => loadItems(dispatch))
                }
              >
                Reset selected
              </Button>
            )}
          {toBeDeleted > 0 && (
            <Button danger onClick={() => dispatch(showRemoveEntriesModal())}>
              Remove old entries ({toBeDeleted})
            </Button>
          )}
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
              } else {
                setDateRange(undefined);
              }
            }}
            picker="date"
            format={"DD.MM.YYYY"}
          />
        </Space>
      </div>
      <Table
        rowSelection={{
          type: "checkbox",
          ...rowSelection,
        }}
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
