import { api } from "../utils";

export const getEntries = async () => {
  const entries = (await api.get("/entries")).data;
  return entries;
};

export const getReceipt = async (id: string) => {
  (await api.get(`/receipt/${id}`)).data;
};

export const approveItem = async  (id: string) => {
  await api.post(`/approve/${id}`)
}