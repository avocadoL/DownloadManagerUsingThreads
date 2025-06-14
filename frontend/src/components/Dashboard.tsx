import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    Tabs,
    Tab,
} from '@mui/material';
import {
    AccessTime,
    CheckCircleOutline,
    ErrorOutline,
    Download as DownloadIcon,
} from '@mui/icons-material';
import StatCard from './StatCard';
import DownloadForm from './DownloadForm';
import DownloadList from './DownloadList';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Download, DownloadStatus } from '../types/download';

const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Dashboard = () => {
    const queryClient = useQueryClient();
    const [currentTab, setCurrentTab] = useState(0);
    const lastTotalBytes = useRef<number>(0);
    const lastUpdateTime = useRef<number>(Date.now());
    const [downloadSpeed, setDownloadSpeed] = useState<string>('0 B/s');

    const { data: downloads = [] } = useQuery({
        queryKey: ['downloads'],
        queryFn: api.getAllDownloads,
        refetchInterval: 500,
        initialData: [] as Download[],
    });

    useEffect(() => {
        // Calculate total downloaded bytes
        const totalBytes = downloads.reduce((sum, download) => {
            if (download.downloadStatus === DownloadStatus.IN_PROGRESS) {
                return sum + download.downloadedSize;
            }
            return sum;
        }, 0);

        // Calculate speed
        const now = Date.now();
        const timeDiff = (now - lastUpdateTime.current) / 1000; // Convert to seconds
        const bytesDiff = totalBytes - lastTotalBytes.current;
        
        if (timeDiff > 0) {
            const speed = bytesDiff / timeDiff;
            setDownloadSpeed(formatSpeed(speed));
        }

        // Update references for next calculation
        lastTotalBytes.current = totalBytes;
        lastUpdateTime.current = now;
    }, [downloads]);

    const startDownloadMutation = useMutation({
        mutationFn: ({ url, fileName, threadCount }: { url: string; fileName?: string, threadCount?: number }) => 
            api.startDownload(url, fileName, threadCount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['downloads'] });
        },
    });

    const toggleDownloadMutation = useMutation({
        mutationFn: async ({ id, action }: { id: number; action: 'pause' | 'resume' }) => {
            if (action === 'pause') {
                await api.pauseDownload(id);
            } else {
                await api.resumeDownload(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['downloads'] });
        },
    });

    const handleFormSubmit = (url: string, fileName?: string, threadCount?: number) => {
        startDownloadMutation.mutate({ url, fileName, threadCount });
    };

    const activeDownloads = useMemo(
        () => downloads.filter((d) => d.downloadStatus === DownloadStatus.IN_PROGRESS || d.downloadStatus === DownloadStatus.PAUSED),
        [downloads]
    );
    const completedDownloads = useMemo(
        () => downloads.filter((d) => d.downloadStatus === DownloadStatus.COMPLETED),
        [downloads]
    );
    const failedDownloads = useMemo(
        () => downloads.filter((d) => d.downloadStatus === DownloadStatus.FAILED),
        [downloads]
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const tabsContent = [
        <DownloadList downloads={activeDownloads} onToggle={(id, action) => toggleDownloadMutation.mutate({ id, action })} />,
        <DownloadList downloads={completedDownloads} onToggle={(id, action) => toggleDownloadMutation.mutate({ id, action })} />,
        <DownloadList downloads={failedDownloads} onToggle={(id, action) => toggleDownloadMutation.mutate({ id, action })} />,
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
                Download Manager
            </Typography>
            <Card sx={{ p: 3, mb: 4 }}>
                <DownloadForm
                    onSubmit={handleFormSubmit}
                    isDownloading={startDownloadMutation.isPending}
                />
            </Card>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 3,
                    mb: 4,
                }}
            >
                <StatCard title="Active Downloads" value={activeDownloads.length} icon={<AccessTime color="primary" />} />
                <StatCard title="Completed" value={completedDownloads.length} icon={<CheckCircleOutline color="success" />} />
                <StatCard title="Failed" value={failedDownloads.length} icon={<ErrorOutline color="error" />} />
                <StatCard title="Download Speed" value={downloadSpeed} icon={<DownloadIcon color="info" />} />
            </Box>

            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="download tabs">
                        <Tab label={`Active Downloads (${activeDownloads.length})`} />
                        <Tab label={`Completed (${completedDownloads.length})`} />
                        <Tab label={`Failed (${failedDownloads.length})`} />
                    </Tabs>
                </Box>
                {tabsContent[currentTab]}
            </Card>
        </Container>
    );
};

export default Dashboard; 