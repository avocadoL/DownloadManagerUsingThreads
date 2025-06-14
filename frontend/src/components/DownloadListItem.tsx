import React from 'react';
import {
    ListItem,
    ListItemText,
    LinearProgress,
    IconButton,
    Button,
    Box,
    Typography,
    Stack
} from '@mui/material';
import { PlayArrow, Pause, SaveAlt } from '@mui/icons-material';
import { Download, DownloadStatus } from '../types/download';
import { api } from '../services/api';
import MultiSegmentProgressBar from './MultiSegmentProgressBar';

interface DownloadListItemProps {
    download: Download;
    onToggle: (id: number, action: 'pause' | 'resume') => void;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusColor = (status: DownloadStatus) => {
    switch (status) {
        case DownloadStatus.COMPLETED:
            return 'success.main';
        case DownloadStatus.FAILED:
            return 'error.main';
        case DownloadStatus.PAUSED:
            return 'warning.main';
        case DownloadStatus.IN_PROGRESS:
            return 'primary.main';
        default:
            return 'text.secondary';
    }
};


const DownloadListItem: React.FC<DownloadListItemProps> = ({ download, onToggle }) => {
    return (
        <ListItem
            divider
            secondaryAction={
                <>
                    {(download.downloadStatus === DownloadStatus.IN_PROGRESS ||
                        download.downloadStatus === DownloadStatus.PAUSED) && (
                            <IconButton
                                edge="end"
                                onClick={() =>
                                    onToggle(
                                        download.id,
                                        download.downloadStatus === DownloadStatus.PAUSED ? 'resume' : 'pause'
                                    )
                                }
                            >
                                {download.downloadStatus === DownloadStatus.PAUSED ? <PlayArrow /> : <Pause />}
                            </IconButton>
                        )}
                    {download.downloadStatus === DownloadStatus.COMPLETED && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<SaveAlt />}
                            onClick={() => api.downloadFile(download.id, download.fileName)}
                            sx={{ borderRadius: '20px' }}
                        >
                            Save
                        </Button>
                    )}
                </>
            }
        >
            <ListItemText
                primary={<Typography variant="subtitle1" noWrap>{download.fileName}</Typography>}
                secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                        <Box sx={{ width: '100%' }}>
                            {download.downloadStatus === DownloadStatus.IN_PROGRESS ? (
                                <MultiSegmentProgressBar parts={download.parts} totalSize={download.totalSize} />
                            ) : (
                                <LinearProgress
                                    variant="determinate"
                                    value={download.progress}
                                    sx={{
                                        height: 12,
                                        borderRadius: 4,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: getStatusColor(download.downloadStatus),
                                        },
                                    }}
                                />
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption">
                                    {formatSize(download.downloadedSize)} / {formatSize(download.totalSize)}
                                </Typography>
                                <Typography variant="caption">{download.progress}%</Typography>
                            </Box>
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{ color: getStatusColor(download.downloadStatus) }}
                        >
                            Status: {download.downloadStatus}
                            {download.errorMessage && ` - Error: ${download.errorMessage}`}
                        </Typography>
                    </Stack>
                }
            />
        </ListItem>
    );
};

export default DownloadListItem; 