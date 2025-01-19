import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const getInitialCount = () => {
    if (typeof window !== 'undefined') {
        return Number(localStorage.getItem('generationCount')) || 0;
    }
    return 0;
};

const initialState = {
    count: getInitialCount()
};

export const generationSlice = createSlice({
    name: 'generation',
    initialState,
    reducers: {
        decrementCount: (state) => {
            state.count = (state.count - 1);
            if (typeof window !== 'undefined') {
                localStorage.setItem('generationCount', state.count.toString());
            }
        },
        resetCount: (state) => {
            state.count = 0;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('generationCount');
            }
        },
        setCount: (state, action: PayloadAction<number>) => {
            state.count = action.payload;
            if (typeof window !== 'undefined') {
                localStorage.setItem('generationCount', state.count.toString());
            }
        }
    }
}); 