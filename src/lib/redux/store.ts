import { configureStore } from '@reduxjs/toolkit';
import { generationSlice } from './slices/generationSlice';
import { sessionSlice } from './slices/sessionSlice';
//import {accountSlice} from './slices/accountSlice';

export const store = configureStore({
    reducer: {
        generation: generationSlice.reducer,
        session: sessionSlice.reducer,
       // account: accountSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export actions
export const { decrementCount, resetCount, setCount } = generationSlice.actions;
export const {
    setSessions,
    addSession,
 ////   resetSessions,
    removeSession,
    setCurrentSession,
    updateCurrentImage,
    addHistoryEntry,
} = sessionSlice.actions; 