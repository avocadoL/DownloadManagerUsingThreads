export enum DownloadStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface DownloadPart {
    id: number;
    startByte: number;
    endByte: number;
    downloadedBytes: number;
}

export interface Download {
    id: number;
    url: string;
    fileName: string;
    status: string;
    totalSize: number;
    downloadedSize: number;
    progress: number;
    threadCount: number;
    startTime: string;
    completionTime: string | null;
    filePath: string;
    errorMessage: string | null;
    downloadStatus: DownloadStatus;
    parts: DownloadPart[];
} 