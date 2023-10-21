import axios from "axios";
import { ItemState, MileageState } from "./formSlice";
export interface postInterface {
  name: string;
  iban: string;
  title: string;
  contact: string;
  govId: string | null;
  items: Array<ItemState>;
  mileages: Array<MileageState>;
}
console.log(import.meta.env);
export const api = axios.create({
  baseURL: `${
    import.meta.env.DEV ? "http://localhost:8025" : "joku dev osote (korvaa)"
  }/api`,
});

export const postForm = async (payload: postInterface) => {
  const response = await api.post("/entry", payload);
  return response.data;
};
