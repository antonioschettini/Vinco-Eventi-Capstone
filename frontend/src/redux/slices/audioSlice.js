import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isPlaying: false,
  volume: 0.05, // Default 5%
  currentTrackIndex: 0,
  isModalOpen: false,
  autoplayBlocked: true,
  isMuted: false,
  prevVolume: 0.05,
  modalPosition: null, // { x: number, y: number } per persistere la posizione del modale trascinabile
};

export const audioSlice = createSlice({
  name: "audio",
  initialState,
  reducers: {
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    setVolume: (state, action) => {
      const vol = Math.max(0, Math.min(1, action.payload));
      state.volume = vol;
      if (vol > 0) {
        state.isMuted = false;
      }
    },
    toggleMute: (state) => {
      if (state.isMuted) {
        state.isMuted = false;
        state.volume = state.prevVolume || 0.05;
      } else {
        state.prevVolume = state.volume;
        state.isMuted = true;
        state.volume = 0;
      }
    },
    setCurrentTrackIndex: (state, action) => {
      state.currentTrackIndex = action.payload;
    },
    nextTrack: (state, action) => {
      const totalTracks = action.payload || 1;
      state.currentTrackIndex = (state.currentTrackIndex + 1) % totalTracks;
    },
    prevTrack: (state, action) => {
      const totalTracks = action.payload || 1;
      state.currentTrackIndex =
        (state.currentTrackIndex - 1 + totalTracks) % totalTracks;
    },
    setIsModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    toggleModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
    setAutoplayBlocked: (state, action) => {
      state.autoplayBlocked = action.payload;
    },
    setModalPosition: (state, action) => {
      state.modalPosition = action.payload;
    },
  },
});

export const {
  setIsPlaying,
  togglePlay,
  setVolume,
  toggleMute,
  setCurrentTrackIndex,
  nextTrack,
  prevTrack,
  setIsModalOpen,
  toggleModal,
  setAutoplayBlocked,
  setModalPosition,
} = audioSlice.actions;

export default audioSlice.reducer;
