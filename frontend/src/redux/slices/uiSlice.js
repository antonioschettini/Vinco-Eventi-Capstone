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
  },
});

export const { toggleTheme, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
