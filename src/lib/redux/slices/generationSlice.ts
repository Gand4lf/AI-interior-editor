import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GenerationState {
    count: number;
}

const initialState: GenerationState = {
    count: Number(localStorage.getItem('generationCount')) || 0
};

export const generationSlice = createSlice({
    name: 'generation',
    initialState,
    reducers: {
        decrementCount: (state) => {
            state.count = (state.count - 1);
            localStorage.setItem('generationCount', state.count.toString());
        },
        resetCount: (state) => {
            state.count = 0;
            localStorage.removeItem('generationCount');
        },
        setCount: (state, action: PayloadAction<number>) => {
            state.count = action.payload;
            localStorage.setItem('generationCount', state.count.toString());
        }
    }
}); 