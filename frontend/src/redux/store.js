import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import audioReducer from "./slices/audioSlice";
import authReducer from "./slices/authSlice";

// Sanitizzazione delle azioni per Redux DevTools per mascherare token o credenziali sensibili
const actionSanitizer = (action) => {
  if (action?.type === "auth/loginSuccess" && action.payload?.accessToken) {
    return {
      ...action,
      payload: {
        ...action.payload,
        accessToken: "[REDACTED]",
      },
    };
  }
  return action;
};

// Sanitizzazione dello stato per Redux DevTools per mascherare token sensibili
const stateSanitizer = (state) => {
  if (state?.auth?.token) {
    return {
      ...state,
      auth: {
        ...state.auth,
        token: "[REDACTED]",
      },
    };
  }
  return state;
};

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    audio: audioReducer,
    auth: authReducer,
  },
  devTools:
    import.meta.env.MODE !== "production"
      ? {
          actionSanitizer,
          stateSanitizer,
        }
      : false,
});

export default store;


