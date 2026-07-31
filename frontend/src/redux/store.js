import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import audioReducer from "./slices/audioSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    audio: audioReducer,
    auth: authReducer,
  },
});

export default store;

