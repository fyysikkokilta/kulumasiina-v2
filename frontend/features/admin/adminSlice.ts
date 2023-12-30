import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ItemState {
  id: number;
  description: string;
  date: string;
  value_cents: number;
  receipts: Array<ReceiptState>;
}
export interface ReceiptState {
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
  contact: string;
  status: string;
  archived: boolean;
  items: Array<ItemState>;
  mileages: Array<MileageState>;
}
export interface AdminState {
  submissions: Array<SubmissionState>;
  loading: boolean;
  dateModal: boolean;
  confirmPaymentModal: boolean;
  removeItemModal: boolean;
  selected: number;
}

const initialState: AdminState = {
  submissions: [],
  loading: false,
  dateModal: false,
  confirmPaymentModal: false,
  removeItemModal: false,
  selected: 0,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    addSubmission: (state, action: PayloadAction<SubmissionState>) => {
      state.submissions.push(action.payload);
    },
    loadSubmissions: (state, action: PayloadAction<SubmissionState[]>) => {
      state.submissions = action.payload;
    },
    clearSubmissions: (state) => {
      state.submissions = [];
    },
    startLoading: (state) => {
      state.loading = true;
    },
    stopLoading: (state) => {
      state.loading = false;
    },
    showDateModal: (state, action: PayloadAction<number>) => {
      state.dateModal = true;
      state.selected = action.payload;
    },
    hideDateModal: (state) => {
      state.dateModal = false;
    },
    showConfirmPaymentModal: (state, action: PayloadAction<number>) => {
      state.confirmPaymentModal = true;
      state.selected = action.payload;
    },
    hideConfirmPaymentModal: (state) => {
      state.confirmPaymentModal = false;
    },
    showRemoveItemModal: (state, action: PayloadAction<number>) => {
      state.removeItemModal = true;
      state.selected = action.payload;
    },
    hideRemoveItemModal: (state) => {
      state.removeItemModal = false;
    },
  },
});

export const {
  addSubmission,
  loadSubmissions,
  clearSubmissions,
  startLoading,
  stopLoading,
  showDateModal,
  hideDateModal,
  showConfirmPaymentModal,
  hideConfirmPaymentModal,
  showRemoveItemModal,
  hideRemoveItemModal,
} = adminSlice.actions;

export default adminSlice.reducer;
