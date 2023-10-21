import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState, AppThunk } from "../../app/store";
import { fetchCount } from "../counter/counterAPI";

export interface ItemState {
  id: number;
  description: string;
  date: string;
  value: number;
  receipts: Array<number>;
}

export interface MileageState {
  id: number;
  date: string;
  description: string;
  route: string;
  plate_no: string;
  distance: number;
}

export interface SubmissionState {
  id: number;
  submissionDate: string;
  name: string;
  title: string;
  status: string;
  items: Array<ItemState>;
  mileages: Array<MileageState>;
}

const initialState: Array<SubmissionState> = [
  {
    id: 1,
    submissionDate: "2022-05-02",
    name: "First Last",
    title: "Annual ball expenses",
    status: "Pending",
    items: [
      {
        id: 1,
        description: "Lunch",
        date: "2021-01-01",
        value: 10.0,
        receipts: [1, 2, 3],
      },
      {
        id: 2,
        description: "Dinner",
        date: "2021-01-01",
        value: 20.0,
        receipts: [1, 2, 3],
      },
    ],
    mileages: [
      {
        id: 1,
        date: "2021-01-01",
        description: "Transportation for the event",
        route: "Espoo - Venue - Espoo",
        plate_no: "ABC-123",
        distance: 100,
      },
    ],
  },
  {
    id: 2,
    submissionDate: "2022-05-03",
    name: "Second Last",
    title: "Freshman party expenses",
    status: "Paid",
    items: [
      {
        id: 3,
        description: "Groceries",
        date: "2021-02-01",
        value: 32.0,
        receipts: [4, 5],
      },
      {
        id: 4,
        description: "Online order",
        date: "2021-02-01",
        value: 19.99,
        receipts: [6],
      },
    ],
    mileages: [
      {
        id: 2,
        date: "2021-02-01",
        description: "Shopping trip",
        route: "Helsinki - Latvia - Helsinki",
        plate_no: "ABC-123",
        distance: 482,
      },
      {
        id: 3,
        date: "2021-02-01",
        description: "Transportation for the event",
        route: "Helsinki - Espoo - Helsinki",
        plate_no: "ABC-123",
        distance: 25,
      },
    ],
  },
];

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
});

// export const { } = formSlice.actions;

export default adminSlice.reducer;
