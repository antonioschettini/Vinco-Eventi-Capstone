import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) return savedTheme;
  // Di default impostiamo 'dark' ma supportiamo anche 'light'
  return "dark";
};

const getInitialLanguage = () => {
  const savedLang = localStorage.getItem("lang");
  return savedLang === "en" ? "en" : "it";
};

const initialState = {
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  globalError: null, // { message: string, type: 'danger'|'warning'|'info'|'success' }
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", state.theme);
    },
    setLanguage: (state, action) => {
      if (action.payload === "it" || action.payload === "en") {
        state.language = action.payload;
        localStorage.setItem("lang", action.payload);
      }
    },
    setGlobalError: (state, action) => {
      if (typeof action.payload === "string") {
        state.globalError = { message: action.payload, type: "danger" };
      } else {
        state.globalError = action.payload; // object { message, type, autoDismissMs }
      }
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
  },
});

export const { toggleTheme, setLanguage, setGlobalError, clearGlobalError } = uiSlice.actions;
export default uiSlice.reducer;
