import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../Reducer/reducer";
export const store = configureStore({
    reducer: {
        counter: counterReducer
    },
});