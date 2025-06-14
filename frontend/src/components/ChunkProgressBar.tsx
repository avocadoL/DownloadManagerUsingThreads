import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { DownloadPart } from '../types/download';
import { motion } from 'framer-motion';

interface Props {
  parts: DownloadPart[];
  totalSize: number;
  progress: number;
}

const ChunkProgressBar: React.FC<Props> = ({ parts, totalSize, progress }) => {
  const theme = useTheme();
  if (!parts || parts.length === 0 || totalSize === 0) return null;

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: theme.palette.grey[300] }}>
      {parts.map((part, idx) => {
        const partSize = part.endByte - part.startByte + 1;
        const width = (partSize / totalSize) * 100;
        const innerWidth = part.downloadedBytes / partSize * 100;
        return (
          <Box key={part.id} sx={{ width: `${width}%`, height: '100%', position: 'relative', display: 'inline-block' }}>
            <motion.div style={{ height: '100%', background: theme.palette.primary.main }} animate={{ width: `${innerWidth}%` }} transition={{ ease: 'easeOut', duration: 0.3 }} />
          </Box>
        );
      })}
      <Typography variant="caption" sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontWeight: 500 }}>
        {progress}%
      </Typography>
    </Box>
  );
};

export default ChunkProgressBar; 