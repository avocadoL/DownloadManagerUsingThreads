import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { DownloadPart } from '../types/download';

interface MultiSegmentProgressBarProps {
    parts: DownloadPart[];
    totalSize: number;
}

const MultiSegmentProgressBar: React.FC<MultiSegmentProgressBarProps> = ({ parts, totalSize }) => {
    if (!parts || parts.length === 0 || totalSize === 0) {
        return null;
    }

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
        <Box sx={{ display: 'flex', height: '12px', width: '100%', backgroundColor: 'grey.300', borderRadius: '4px', overflow: 'hidden' }}>
            {parts.map((part, index) => {
                const partSize = part.endByte - part.startByte + 1;
                const progress = (part.downloadedBytes / partSize) * 100;
                const width = `${(partSize / totalSize) * 100}%`;

                return (
                    <Tooltip key={part.id} title={`Thread ${index + 1}: ${formatBytes(part.downloadedBytes)} / ${formatBytes(partSize)}`}>
                        <Box sx={{ width, backgroundColor: 'primary.light', position: 'relative' }}>
                            <Box sx={{
                                height: '100%',
                                width: `${progress}%`,
                                backgroundColor: 'primary.main',
                                transition: 'width 0.2s ease-in-out'
                            }} />
                        </Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
};

export default MultiSegmentProgressBar; 