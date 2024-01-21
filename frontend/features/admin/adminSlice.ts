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
  removeEntryModal: boolean;
  selected: number;
  editItemModal: boolean;
  selectedItem: ItemState;
}

const initialItemState: ItemState = {
  id: 0,
  description: "",
  date: "",
  value_cents: 0,
  receipts: [],
};

const initialState: AdminState = {
  // Page state
  submissions: [],
  loading: false,
  // Entry status
  dateModal: false,
  confirmPaymentModal: false,
  removeEntryModal: false,
  selected: 0,
  // Item state
  editItemModal: false,
  selectedItem: initialItemState,
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
    showRemoveEntryModal: (state, action: PayloadAction<number>) => {
      state.removeEntryModal = true;
      state.selected = action.payload;
    },
    hideRemoveEntryModal: (state) => {
      state.removeEntryModal = false;
    },
    showEditItemModal: (state, action: PayloadAction<ItemState>) => {
      state.editItemModal = true;
      state.selectedItem = action.payload;
    },
    hideEditItemModal: (state) => {
      state.editItemModal = false;
      state.selectedItem = initialItemState;
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
  showRemoveEntryModal,
  hideRemoveEntryModal,
  showEditItemModal,
  hideEditItemModal,
} = adminSlice.actions;

export default adminSlice.reducer;
