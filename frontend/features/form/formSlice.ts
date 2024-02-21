import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UploadFile } from "antd/lib/upload/interface";

export interface ItemState {
  kind: "item";
  id: number;
  description: string;
  date: string;
  value_cents: number;
  receipts: Array<number>;
}

export interface MileageState {
  kind: "mileage";
  id: number;
  description: string;
  date: string;
  route: string;
  distance: number;
  plate_no: string;
}

export interface FormState {
  maxId: number;
  entries: Array<ItemState | MileageState>;
  files: { [key: number]: UploadFile };
}

const initialState: FormState = {
  maxId: 1,
  files: {},
  entries: [],
};

export interface addItemInterface {
  description: string;
  date: string;
  value: string;
  receipts: Array<number>;
}

interface editItemInterface {
  item: addItemInterface;
  editTarget: number;
}

interface editMileageInterface {
  mileage: addMileageInterface;
  editTarget: number;
}

export interface addMileageInterface {
  description: string;
  date: string;
  route: string;
  distance: string;
  plate_no: string;
}
export interface addFileInterface {
  id: number;
  file: UploadFile;
}

export const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<addFileInterface>) => {
      state.files[action.payload.id] = action.payload.file;
    },
    addEntry: (state, action: PayloadAction<ItemState | MileageState>) => {
      state.entries.push(action.payload);
    },
    addItem: (state, action: PayloadAction<addItemInterface>) => {
      const item: ItemState = {
        kind: "item",
        id: state.maxId + 1,
        description: action.payload.description,
        date: action.payload.date,
        value_cents: Math.round(
          Number(action.payload.value.replace(",", ".")) * 100,
        ),
        receipts: action.payload.receipts,
      };
      state.maxId = item.id;
      state.entries.push(item);
    },
    editItem: (state, action: PayloadAction<editItemInterface>) => {
      const item: ItemState = {
        kind: "item",
        id: action.payload.editTarget,
        description: action.payload.item.description,
        date: action.payload.item.date,
        value_cents: Math.round(
          Number(action.payload.item.value.replace(",", ".")) * 100,
        ),
        receipts: action.payload.item.receipts,
      };
      state.entries = state.entries.map((entry) =>
        entry.id === action.payload.editTarget ? item : entry,
      );
    },
    addMileage: (state, action: PayloadAction<addMileageInterface>) => {
      const item: MileageState = {
        kind: "mileage",
        id: state.maxId + 1,
        description: action.payload.description,
        date: action.payload.date,
        route: action.payload.route,
        distance: Number(action.payload.distance.replace(",", ".")),
        plate_no: action.payload.plate_no,
      };
      state.maxId = item.id;
      state.entries.push(item);
    },
    editMileage: (state, action: PayloadAction<editMileageInterface>) => {
      const item: MileageState = {
        kind: "mileage",
        id: action.payload.editTarget,
        description: action.payload.mileage.description,
        date: action.payload.mileage.date,
        route: action.payload.mileage.route,
        distance: Number(action.payload.mileage.distance.replace(",", ".")),
        plate_no: action.payload.mileage.plate_no,
      };
      state.entries = state.entries.map((entry) =>
        entry.id === action.payload.editTarget ? item : entry,
      );
    },
    removeEntry: (state, action: PayloadAction<number>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload,
      );
    },
    resetForm: (state) => {
      state.maxId = 1;
      state.entries = [];
    },
  },
});

export const {
  addEntry,
  addItem,
  editItem,
  editMileage,
  removeEntry,
  addMileage,
  resetForm,
  addFile,
} = formSlice.actions;

export default formSlice.reducer;
