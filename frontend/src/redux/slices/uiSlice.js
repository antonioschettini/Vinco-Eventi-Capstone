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

const getInitialTaxSettings = () => {
  return {
    taxMode: localStorage.getItem("vinco_admin_tax_mode") || "percent",
    taxPercent: localStorage.getItem("vinco_admin_tax_percent") || "20",
    taxManualAmount: localStorage.getItem("vinco_admin_tax_manual") || "0",
  };
};

const initialState = {
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  globalError: null, // { message: string, type: 'danger'|'warning'|'info'|'success' }
  emailModal: {
    isOpen: false,
    email: "vincoeventi@gmail.com",
  },
  taxSettings: getInitialTaxSettings(),
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
    openEmailModal: (state, action) => {
      state.emailModal = {
        isOpen: true,
        email: action.payload || "vincoeventi@gmail.com",
      };
    },
    closeEmailModal: (state) => {
      state.emailModal.isOpen = false;
    },
    setTaxSettings: (state, action) => {
      const { taxMode, taxPercent, taxManualAmount } = action.payload;
      if (taxMode !== undefined) {
        state.taxSettings.taxMode = taxMode;
        localStorage.setItem("vinco_admin_tax_mode", taxMode);
      }
      if (taxPercent !== undefined) {
        state.taxSettings.taxPercent = taxPercent.toString();
        localStorage.setItem("vinco_admin_tax_percent", taxPercent.toString());
      }
      if (taxManualAmount !== undefined) {
        state.taxSettings.taxManualAmount = taxManualAmount.toString();
        localStorage.setItem("vinco_admin_tax_manual", taxManualAmount.toString());
      }
    },
  },
});

export const {
  toggleTheme,
  setLanguage,
  setGlobalError,
  clearGlobalError,
  openEmailModal,
  closeEmailModal,
  setTaxSettings,
} = uiSlice.actions;
export default uiSlice.reducer;
