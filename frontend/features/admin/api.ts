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
  return approveEntries([id], approvalDate, approvalNote);
};

export const approveEntries = async (
  ids: number[],
  approvalDate: string,
  approvalNote: string,
) => {
  await api.post(`/approve`, {
    ids,
    date: approvalDate,
    approval_note: approvalNote,
  });
};

export const denyEntry = async (id: number) => {
  return denyEntries([id]);
};

export const denyEntries = async (ids: number[]) => {
  await api.post(`/deny`, { ids });
};

export const resetEntry = async (id: number) => {
  return resetEntries([id]);
};

export const resetEntries = async (ids: number[]) => {
  await api.post(`/reset`, { ids });
};

export const deleteEntry = async (id: number) => {
  await api.delete(`/entry/${id}`);
};

export const deleteOldArchivedEntries = async () => {
  await api.delete(`/entries`);
};

export const payEntry = async (id: number, paidDate: string) => {
  return payEntries([id], paidDate);
};

export const payEntries = async (ids: number[], paidDate: string) => {
  await api.post(`/pay`, {
    ids,
    date: paidDate,
  });
};

export const archiveEntry = async (id: number) => {
  return archiveEntries([id]);
};

export const archiveEntries = async (ids: number[]) => {
  await api.post(`/archive`, { ids });
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

export const getAdminConfig = async () => {
  return (await api.get("/config/admin")).data;
};
