export interface HistoryEntry {
    prompt: string;
    output: string;
    timestamp: Date;
}

export interface DesignSession {
    id: string;
    name: string;
    lastImage: string | null;
    history: HistoryEntry[];
    timestamp: Date;
    deleted?: boolean;
} 
