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
  approval_date: string | null;
  approval_note: string | null;
  archived: boolean;
  contact: string;
  gov_id: string | null;
  iban: string;
  id: number;
  items: Array<ItemState>;
  mileages: Array<MileageState>;
  name: string;
  paid_date: string | null;
  rejection_date: string | null;
  status: string;
  submission_date: string;
  title: string;
}
export interface AdminState {
  submissions: Array<SubmissionState>;
  loading: boolean;
  dateModal: boolean;
  confirmPaymentModal: boolean;
  removeEntryModal: boolean;
  removeEntriesModal: boolean;
  selected: number | number[];
  editItemModal: boolean;
  selectedItem: ItemState;
  editMileageModal: boolean;
  selectedMileage: MileageState;
}

const initialItemState: ItemState = {
  id: 0,
  description: "",
  date: "",
  value_cents: 0,
  receipts: [],
};

const initialMileageState: MileageState = {
  id: 0,
  date: "",
  description: "",
  route: "",
  plate_no: "",
  distance: 0,
};

const initialState: AdminState = {
  // Page state
  submissions: [],
  loading: false,
  // Entry status
  dateModal: false,
  confirmPaymentModal: false,
  removeEntryModal: false,
  removeEntriesModal: false,
  selected: 0,
  // Item state
  editItemModal: false,
  selectedItem: initialItemState,
  // Mileage state
  editMileageModal: false,
  selectedMileage: initialMileageState,
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
    showDateModal: (state, action: PayloadAction<number | number[]>) => {
      state.dateModal = true;
      state.selected = action.payload;
    },
    hideDateModal: (state) => {
      state.dateModal = false;
      state.selected = 0;
    },
    showConfirmPaymentModal: (
      state,
      action: PayloadAction<number | number[]>,
    ) => {
      state.confirmPaymentModal = true;
      state.selected = action.payload;
    },
    hideConfirmPaymentModal: (state) => {
      state.confirmPaymentModal = false;
      state.selected = 0;
    },
    showRemoveEntryModal: (state, action: PayloadAction<number>) => {
      state.removeEntryModal = true;
      state.selected = action.payload;
    },
    hideRemoveEntryModal: (state) => {
      state.removeEntryModal = false;
      state.selected = 0;
    },
    showRemoveEntriesModal: (state) => {
      state.removeEntriesModal = true;
    },
    hideRemoveEntriesModal: (state) => {
      state.removeEntriesModal = false;
    },
    showEditItemModal: (state, action: PayloadAction<ItemState>) => {
      state.editItemModal = true;
      state.selectedItem = action.payload;
    },
    hideEditItemModal: (state) => {
      state.editItemModal = false;
      state.selectedItem = initialItemState;
    },
    showEditMileageModal: (state, action: PayloadAction<MileageState>) => {
      state.editMileageModal = true;
      state.selectedMileage = action.payload;
    },
    hideEditMileageModal: (state) => {
      state.editMileageModal = false;
      state.selectedMileage = initialMileageState;
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
  showRemoveEntriesModal,
  hideRemoveEntriesModal,
  showEditItemModal,
  hideEditItemModal,
  showEditMileageModal,
  hideEditMileageModal,
} = adminSlice.actions;

export default adminSlice.reducer;
