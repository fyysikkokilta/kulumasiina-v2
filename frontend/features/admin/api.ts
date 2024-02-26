import { api } from "../utils";

export const getEntries = async () => {
  const entries = (await api.get("/entries")).data;
  return entries;
};

export const getReceipt = async (id: string) => {
  (await api.get(`/receipt/${id}`)).data;
};

export const approveEntry = async (
  id: number,
  approvalDate: string,
  approvalNote: string,
) => {
  await api.post(`/approve/${id}`, {
    date: approvalDate,
    approval_note: approvalNote,
  });
};
export const denyEntry = async (id: number) => {
  await api.post(`/deny/${id}`);
};

export const resetEntry = async (id: number) => {
  await api.post(`/reset/${id}`);
};

export const deleteEntry = async (id: number) => {
  await api.delete(`/entry/${id}`);
};

export const deleteEntries = async () => {
  await api.delete(`/entries`);
};

export const payEntry = async (id: number, paidDate: string) => {
  await api.post(`/pay/${id}`, {
    date: paidDate,
  });
};

export const archiveEntry = async (id: number) => {
  await api.post(`/archive/${id}`);
};

export const modifyItem = async (
  item_id: number,
  body: {
    value_cents: number;
    description: string;
    date: string;
    receipts: Array<number>;
  },
) => {
  await api.post(`/item/${item_id}`, body);
};

export const modifyMileage = async (
  mileage_id: number,
  body: {
    date: string;
    description: string;
    route: string;
    plate_no: string;
    distance: number;
  },
) => {
  await api.post(`/mileage/${mileage_id}`, body);
};
