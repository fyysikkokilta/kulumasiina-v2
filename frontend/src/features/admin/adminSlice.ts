import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ItemState {
  id: number;
  description: string;
  date: string;
  value_cents: number;
  receipts: Array<RecieptState>;
}
export interface RecieptState {
  id: number;
  filename: string;
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
export interface AdminState {
  submissions: Array<SubmissionState>;
  loading: boolean;
}

const initialState: AdminState = { submissions: [], loading: false };

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    addSubmission: (state, action: PayloadAction<SubmissionState>) => {
      state.submissions.push(action.payload);
    },
    addSubmissions: (state, action: PayloadAction<SubmissionState[]>) => {
      state.submissions.push(...action.payload);
    },
    clearSubmissions: (state) => {
      while (state.submissions.shift() !== undefined) {}
    },
    startLoading: (state) => {
      state.loading = true;
    },
    stopLoading: (state) => {
      state.loading = false;
    },
  },
});

export const {
  addSubmission,
  addSubmissions,
  clearSubmissions,
  startLoading,
  stopLoading,
} = adminSlice.actions;

export default adminSlice.reducer;
