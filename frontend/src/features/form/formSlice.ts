import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../../app/store';
import { fetchCount } from '../counter/counterAPI';


export interface ItemState {
  kind: 'item';
  id: number;
  description: string;
  date: string;
  value: number;
};

export interface MileageState {
  kind: 'mileage';
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
}

const initialState: FormState = {
  maxId: 1,
  entries: [
    {
      kind: 'item',
      id: 0,
      description: 'Got some apples from the store. Used in an envent.',
      date: '2023-01-01',
      value: 123.4,
    },
    {
      kind: 'mileage',
      id: 1,
      description: 'Logistics for the event.',
      date: '2023-01-02',
      route: 'home - guild room - event location - guild room - home',
      distance: 84,
      plate_no: 'ABC-123',
    },
  ],
};

export interface addItemInterface {
  description: string;
  date: string;
  value: number;
}

export interface addMileageInterface {
  description: string;
  date: string;
  route: string;
  distance: number;
  plate_no: string;
}

export const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    addEntry: (state, action: PayloadAction<ItemState | MileageState>) => {
      state.entries.push(action.payload);
    },
    addItem: (state, action: PayloadAction<addItemInterface>) => {
      const item: ItemState = {
        kind: 'item',
        id: state.maxId + 1,
        description: action.payload.description,
        date: action.payload.date,
        value: action.payload.value,
      };
      state.maxId = item.id;
      state.entries.push(item);
    },
    addMileage: (state, action: PayloadAction<addMileageInterface>) => {
      const item: MileageState = {
        kind: 'mileage',
        id: state.maxId + 1,
        description: action.payload.description,
        date: action.payload.date,
        route: action.payload.route,
        distance: action.payload.distance,
        plate_no: action.payload.plate_no,
      };
      state.maxId = item.id;
      state.entries.push(item);
    },
    removeEntry: (state, action: PayloadAction<Number>) => {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload);
    },
  },
});

export const { addEntry, addItem, removeEntry, addMileage } = formSlice.actions;

export default formSlice.reducer;
