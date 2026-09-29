// src/redux/store/store.js

import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/redux/apiSlice/apiSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
