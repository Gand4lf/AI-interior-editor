import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DesignSession, HistoryEntry } from '@/lib/types';

interface SessionState {
    sessions: DesignSession[];
    currentSessionId: string | null;
    currentImage: string | null;
    history: HistoryEntry[];
}

// Load initial state from localStorage
const loadState = (): SessionState => {
    const defaultState = {
        sessions: [],
        currentSessionId: null,
        currentImage: null,
        history: []
    };

    if (typeof window === 'undefined') {
        return defaultState;
    }

    const savedState = localStorage.getItem('sessionState');
    if (!savedState) {
        return defaultState;
    }

    try {
        const parsedState = JSON.parse(savedState);
        // Convert date strings back to Date objects
        parsedState.sessions.forEach((session: DesignSession) => {
            session.timestamp = new Date(session.timestamp);
            session.history.forEach((entry: HistoryEntry) => {
                entry.timestamp = new Date(entry.timestamp);
            });
        });
        parsedState.history.forEach((entry: HistoryEntry) => {
            entry.timestamp = new Date(entry.timestamp);
        });

        return parsedState;
    } catch (error) {
        console.error('Error parsing session state:', error);
        return defaultState;
    }
};

// Save state to localStorage
const saveState = (state: SessionState) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('sessionState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving session state:', error);
        }
    }
};

const initialState: SessionState = loadState();

export const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setSessions: (state, action: PayloadAction<DesignSession[]>) => {
            state.sessions = action.payload;
            saveState(state);
        },
        addSession: (state, action: PayloadAction<DesignSession>) => {
            state.sessions = [action.payload, ...state.sessions];
            state.currentSessionId = action.payload.id;
            state.currentImage = null;
            state.history = [];
            saveState(state);
        },
        removeSession: (state, action: PayloadAction<string>) => {
            state.sessions = state.sessions.filter(s => s.id !== action.payload);
            if (state.currentSessionId === action.payload) {
                state.currentSessionId = null;
                state.currentImage = null;
                state.history = [];
            }
            saveState(state);
        },
        setCurrentSession: (state, action: PayloadAction<DesignSession>) => {
            state.currentSessionId = action.payload.id;
            state.currentImage = action.payload.lastImage;
            state.history = action.payload.history;
            saveState(state);
        },
        updateCurrentImage: (state, action: PayloadAction<string | null>) => {
            state.currentImage = action.payload;
            if (state.currentSessionId) {
                const session = state.sessions.find(s => s.id === state.currentSessionId);
                if (session) {
                    session.lastImage = action.payload;
                }
            }
            saveState(state);
        },
        addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
            state.history.push(action.payload);
            if (state.currentSessionId) {
                const session = state.sessions.find(s => s.id === state.currentSessionId);
                if (session) {
                    session.history = state.history;
                }
            }
            saveState(state);
        }
    }
}); 