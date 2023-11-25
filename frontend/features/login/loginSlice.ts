import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface LoginState {
  username: string;
  loggedIn: boolean;
}
const initialState: LoginState = {
  loggedIn: false,
  username: "",
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    logIn: (state: LoginState, payload: PayloadAction<string>) => {
      state.loggedIn = true;
      state.username = payload.payload;
    },
    logOut: (state) => {
      state.loggedIn = false;
      state.username = "";
    },
  },
});

export const { logIn, logOut } = loginSlice.actions;

export default loginSlice.reducer;
