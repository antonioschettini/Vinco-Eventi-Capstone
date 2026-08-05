import { createSlice } from "@reduxjs/toolkit";

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return false;
    const decodedJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const decoded = JSON.parse(decodedJson);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const getValidInitialState = () => {
  const token = localStorage.getItem("vinco_token");
  const userStr = localStorage.getItem("vinco_user");

  if (token && isTokenValid(token)) {
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      isAuthenticated: true,
    };
  }

  // Token assente o scaduto: pulizia sicura del localStorage
  localStorage.removeItem("vinco_token");
  localStorage.removeItem("vinco_user");
  return {
    token: null,
    user: null,
    isAuthenticated: false,
  };
};

const initialStateFromStorage = getValidInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialStateFromStorage.token,
    user: initialStateFromStorage.user,
    isAuthenticated: initialStateFromStorage.isAuthenticated,
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
