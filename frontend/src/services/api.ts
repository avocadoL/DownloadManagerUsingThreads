import axios from 'axios';
import { Download } from '../types/download';

const API_BASE_URL = 'http://localhost:8089/api';

export const api = {
    startDownload: async (url: string, fileName?: string, threadCount?: number): Promise<Download> => {
        const params = new URLSearchParams();
        params.append('url', url);
        if (fileName) {
            params.append('fileName', fileName);
        }
        if (threadCount) {
            params.append('threadCount', threadCount.toString());
        }
        const response = await axios.post(`${API_BASE_URL}/downloads?${params.toString()}`);
        return response.data;
    },

    getAllDownloads: async (): Promise<Download[]> => {
        const response = await axios.get(`${API_BASE_URL}/downloads`);
        return response.data;
    },

    getDownload: async (id: number): Promise<Download> => {
        const response = await axios.get(`${API_BASE_URL}/downloads/${id}`);
        return response.data;
    },

    pauseDownload: async (id: number): Promise<void> => {
        await axios.post(`${API_BASE_URL}/downloads/${id}/pause`);
    },

    resumeDownload: async (id: number): Promise<void> => {
        await axios.post(`${API_BASE_URL}/downloads/${id}/resume`);
    },

    downloadFile: async (id: number, fileName: string): Promise<void> => {
        const response = await axios.get(`${API_BASE_URL}/downloads/${id}/file`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
}; 