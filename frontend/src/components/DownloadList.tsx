import React from 'react';
import { List, Box, Typography } from '@mui/material';
import { Download } from '../types/download';
import DownloadListItem from './DownloadListItem';

interface DownloadListProps {
    downloads: Download[];
    onToggle: (id: number, action: 'pause' | 'resume') => void;
}

const DownloadList: React.FC<DownloadListProps> = ({ downloads, onToggle }) => {
    if (downloads.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No downloads in this category.</Typography>
            </Box>
        );
    }

    return (
        <List>
            {downloads.map((download) => (
                <DownloadListItem
                    key={download.id}
                    download={download}
                    onToggle={onToggle}
                />
            ))}
        </List>
    );
};

export default DownloadList; 