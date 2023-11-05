import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import formReducer from "../features/form/formSlice";
import adminReducer from "../features/admin/adminSlice";

export const store = configureStore({
  reducer: {
    form: formReducer,
    admin: adminReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
