import { createSlice } from "@reduxjs/toolkit";

const initialToken = localStorage.getItem("vinco_token") || null;
const initialUser = localStorage.getItem("vinco_user")
  ? JSON.parse(localStorage.getItem("vinco_user"))
  : null;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    loading: false,
    error: null,
  },
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload.accessToken;
      state.user = {
        email: action.payload.email,
        role: action.payload.role,
      };
      state.isAuthenticated = true;
      state.error = null;

      localStorage.setItem("vinco_token", action.payload.accessToken);
      localStorage.setItem(
        "vinco_user",
        JSON.stringify({ email: action.payload.email, role: action.payload.role })
      );
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("vinco_token");
      localStorage.removeItem("vinco_user");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } =
  authSlice.actions;

export default authSlice.reducer;
