import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Collapse,
    Typography,
    Slider,
} from '@mui/material';
import { Download as DownloadIcon, ArrowDropDown, ArrowDropUp } from '@mui/icons-material';

interface DownloadFormProps {
    onSubmit: (url: string, fileName?: string, threadCount?: number) => void;
    isDownloading: boolean;
}

const DownloadForm: React.FC<DownloadFormProps> = ({ onSubmit, isDownloading }) => {
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [threadCount, setThreadCount] = useState(4);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url) {
            onSubmit(url, fileName, threadCount);
            setUrl('');
            setFileName('');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    fullWidth
                    label="Enter download URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    variant="outlined"
                />
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!url || isDownloading}
                    startIcon={<DownloadIcon />}
                >
                    Download
                </Button>
            </Box>
            <Box>
                <Button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    endIcon={showAdvanced ? <ArrowDropUp /> : <ArrowDropDown />}
                >
                    Advanced Options
                </Button>
                <Collapse in={showAdvanced}>
                    <TextField
                        fullWidth
                        label="Custom file name (optional)"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        variant="outlined"
                        sx={{ mt: 2 }}
                    />
                    <Typography gutterBottom sx={{ mt: 2 }}>
                        Threads: {threadCount}
                    </Typography>
                    <Slider
                        value={threadCount}
                        onChange={(e, newValue) => setThreadCount(newValue as number)}
                        aria-labelledby="thread-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={16}
                    />
                </Collapse>
            </Box>
        </form>
    );
};

export default DownloadForm; 