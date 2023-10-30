import axios from "axios";
import { ItemState, MileageState } from "./formSlice";
import { api } from "../utils";
export interface postInterface {
  name: string;
  iban: string;
  title: string;
  contact: string;
  govId: string | null;
  items: Array<ItemState>;
  mileages: Array<MileageState>;
}

export const postForm = async (payload: postInterface) => {
  const response = await api.post("/entry", payload);
  return response.data;
};
