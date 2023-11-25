import axios from "axios";

export const mileageReimbursementRate = 0.22;

export const EURFormat = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

export const KMFormat = new Intl.NumberFormat("fi-FI", {
  style: "unit",
  unit: "kilometer",
});
export const apiURL = `${
  import.meta.env.DEV ? "http://localhost:8025" : ""
}/api`;
export const api = axios.create({
  baseURL: apiURL,
  withCredentials: true,
});
