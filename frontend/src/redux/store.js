import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import audioReducer from "./slices/audioSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    audio: audioReducer,
  },
});

export default store;

