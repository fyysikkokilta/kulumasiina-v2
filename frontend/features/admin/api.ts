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

export const payEntry = async (id: number, paidDate: string) => {
  await api.post(`/pay/${id}`, {
    date: paidDate,
  });
};

export const archiveEntry = async (id: number) => {
  await api.post(`/archive/${id}`);
};
