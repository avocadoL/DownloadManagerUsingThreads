package com.downloader.service;

import com.downloader.model.Download;
import com.downloader.model.DownloadPart;
import com.downloader.repository.DownloadPartRepository;
import com.downloader.repository.DownloadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class DownloadService {

    private final DownloadRepository downloadRepository;
    private final DownloadPartRepository downloadPartRepository;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Value("${download.chunk.size:1048576}") // 1MB default chunk size
    private int chunkSize;

    @Value("${download.default.threads:4}")
    private int defaultThreadCount;

    @Value("${download.storage.location:downloads}")
    private String downloadStorageLocation;

    public void init() {
        try {
            Files.createDirectories(Paths.get(downloadStorageLocation));
        } catch (IOException e) {
            throw new RuntimeException("Could not create download storage directory", e);
        }
    }

    public Download startDownload(String fileUrl, String customFileName, Integer threadCount) throws IOException {
        try {
            init(); // Ensure download directory exists
            URL url = new URL(fileUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            
            // Add common headers
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Accept", "*/*");
            
            int responseCode = conn.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new IOException("Server returned HTTP response code: " + responseCode);
            }

            long fileSize = conn.getContentLengthLong();
            if (fileSize <= 0) {
                throw new IOException("Invalid file size or file not accessible");
            }

            // Get content type and suggested filename from headers
            String contentType = conn.getContentType();
            String contentDisposition = conn.getHeaderField("Content-Disposition");
            String fileName = getFileName(fileUrl, customFileName, conn);

            // If no filename in Content-Disposition, try to get from URL
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = getFileNameFromUrl(fileUrl, contentType);
            }

            String filePath = Paths.get(downloadStorageLocation, fileName).toString();

            // Handle duplicate filenames
            File file = new File(filePath);
            if (file.exists()) {
                String baseName = fileName;
                String extension = "";
                int dotIndex = fileName.lastIndexOf('.');
                if (dotIndex > 0) {
                    baseName = fileName.substring(0, dotIndex);
                    extension = fileName.substring(dotIndex);
                }
                fileName = baseName + "_" + System.currentTimeMillis() + extension;
                filePath = Paths.get(downloadStorageLocation, fileName).toString();
            }

            Download download = new Download();
            download.setUrl(fileUrl);
            download.setFileName(fileName);
            download.setTotalSize(fileSize);
            download.setThreadCount(threadCount != null && threadCount > 0 ? threadCount : defaultThreadCount);
            download.setStartTime(LocalDateTime.now());
            download.setDownloadStatus(Download.DownloadStatus.IN_PROGRESS);
            download.setFilePath(filePath);
            download.setErrorMessage(null);

            createDownloadParts(download);

            downloadRepository.save(download);
            startMultiThreadedDownload(download);

            return download;
        } catch (Exception e) {
            log.error("Failed to start download: " + e.getMessage(), e);
            Download failedDownload = new Download();
            failedDownload.setUrl(fileUrl);
            failedDownload.setFileName(getFileNameFromUrl(fileUrl, null));
            failedDownload.setDownloadStatus(Download.DownloadStatus.FAILED);
            failedDownload.setStartTime(LocalDateTime.now());
            failedDownload.setErrorMessage(e.getMessage());
            return downloadRepository.save(failedDownload);
        }
    }

    private String getFileName(String fileUrl, String customFileName, HttpURLConnection conn) throws java.io.UnsupportedEncodingException {
        String fileName = customFileName;
        String contentDisposition = conn.getHeaderField("Content-Disposition");

        if (fileName == null || fileName.trim().isEmpty()) {
            if (contentDisposition != null && contentDisposition.contains("filename=")) {
                String[] parts = contentDisposition.split("filename=");
                if (parts.length > 1) {
                    fileName = parts[1].replaceAll("\"", "");
                }
            }
        }

        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = getFileNameFromUrl(fileUrl, conn.getContentType());
        }

        return fileName;
    }

    public Resource getDownloadedFile(Long id) throws IOException {
        Download download = getDownload(id);
        if (download == null || download.getDownloadStatus() != Download.DownloadStatus.COMPLETED) {
            throw new IOException("File not found or download not completed");
        }

        Path filePath = Paths.get(download.getFilePath());
        Resource resource = new FileSystemResource(filePath.toFile());

        if (resource.exists()) {
            return resource;
        } else {
            throw new IOException("File not found: " + download.getFilePath());
        }
    }

    private void createDownloadParts(Download download) {
        long fileSize = download.getTotalSize();
        int threadCount = download.getThreadCount();
        long partSize = fileSize / threadCount;

        for (int i = 0; i < threadCount; i++) {
            long startByte = i * partSize;
            long endByte = (i == threadCount - 1) ? fileSize -1 : (i + 1) * partSize -1;

            DownloadPart part = new DownloadPart();
            part.setStartByte(startByte);
            part.setEndByte(endByte);
            part.setDownloadedBytes(0);
            part.setDownload(download);
            download.getParts().add(part);
        }
    }

    private void startMultiThreadedDownload(Download download) {
        try {
            File outputFile = new File(download.getFilePath());
            outputFile.createNewFile();
            RandomAccessFile randomAccessFile = new RandomAccessFile(outputFile, "rw");
            randomAccessFile.setLength(download.getTotalSize());
            randomAccessFile.close();

            List<Future<Boolean>> futures = new ArrayList<>();

            for (DownloadPart part : download.getParts()) {
                futures.add(executorService.submit(() ->
                    downloadPart(download, part)));
            }

            executorService.submit(() -> monitorProgress(download, futures));
        } catch (Exception e) {
            log.error("Error starting multi-threaded download: " + e.getMessage(), e);
            download.setDownloadStatus(Download.DownloadStatus.FAILED);
            download.setErrorMessage("Failed to initialize download: " + e.getMessage());
            downloadRepository.save(download);
        }
    }

    private boolean downloadPart(Download download, DownloadPart part) {
        try {
            URL url = new URL(download.getUrl());
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Range", "bytes=" + part.getStartByte() + "-" + part.getEndByte());
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Accept", "*/*");

            int responseCode = conn.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_PARTIAL && responseCode != HttpURLConnection.HTTP_OK) {
                throw new IOException("Server returned HTTP response code: " + responseCode);
            }

            try (RandomAccessFile file = new RandomAccessFile(download.getFilePath(), "rw")) {
                file.seek(part.getStartByte());
                byte[] buffer = new byte[chunkSize];
                int bytesRead;

                while ((bytesRead = conn.getInputStream().read(buffer)) != -1) {
                    file.write(buffer, 0, bytesRead);
                    synchronized (download) {
                        part.setDownloadedBytes(part.getDownloadedBytes() + bytesRead);
                        download.setDownloadedSize(download.getDownloadedSize() + bytesRead);
                        int progress = (int) ((download.getDownloadedSize() * 100) / download.getTotalSize());
                        download.setProgress(progress);
                        log.info("Download {} progress: {}%, downloaded: {} bytes", download.getId(), progress, download.getDownloadedSize());
                        // Save both the part and download progress
                        downloadPartRepository.save(part);
                        downloadRepository.save(download);
                    }
                }
            }
            return true;
        } catch (IOException e) {
            String errorMessage = "Error downloading part " + part.getStartByte() + "-" + part.getEndByte() + ": " + e.getMessage();
            log.error(errorMessage, e);
            synchronized (download) {
                download.setDownloadStatus(Download.DownloadStatus.FAILED);
                download.setErrorMessage(errorMessage);
                downloadRepository.save(download);
            }
            return false;
        }
    }

    private void monitorProgress(Download download, List<Future<Boolean>> futures) {
        try {
            boolean allCompleted = true;
            for (Future<Boolean> future : futures) {
                try {
                    allCompleted &= future.get(30, TimeUnit.SECONDS); // Add timeout
                } catch (TimeoutException e) {
                    allCompleted = false;
                    download.setErrorMessage("Download timeout after 30 seconds");
                    break;
                }
            }

            if (allCompleted) {
                download.setDownloadStatus(Download.DownloadStatus.COMPLETED);
                download.setCompletionTime(LocalDateTime.now());
                download.setErrorMessage(null);
            } else {
                download.setDownloadStatus(Download.DownloadStatus.FAILED);
                if (download.getErrorMessage() == null) {
                    download.setErrorMessage("One or more download parts failed");
                }
            }
            downloadRepository.save(download);
        } catch (Exception e) {
            log.error("Error monitoring download progress: " + e.getMessage(), e);
            download.setDownloadStatus(Download.DownloadStatus.FAILED);
            download.setErrorMessage("Error monitoring progress: " + e.getMessage());
            downloadRepository.save(download);
        }
    }

    private String getFileNameFromUrl(String fileUrl, String contentType) {
        try {
            // Get the filename from the URL
            String fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
            
            // Remove query parameters if present
            if (fileName.contains("?")) {
                fileName = fileName.substring(0, fileName.indexOf("?"));
            }
            
            // Remove fragment identifier if present
            if (fileName.contains("#")) {
                fileName = fileName.substring(0, fileName.indexOf("#"));
            }
            
            // URL decode the filename
            fileName = java.net.URLDecoder.decode(fileName, "UTF-8");
            
            // If filename is empty or doesn't have an extension
            if (fileName.isEmpty() || !fileName.contains(".")) {
                String extension = ".bin"; // default extension
                
                if (contentType != null) {
                    // Map common MIME types to file extensions
                    switch (contentType.toLowerCase()) {
                        case "application/pdf":
                            extension = ".pdf";
                            break;
                        case "image/jpeg":
                            extension = ".jpg";
                            break;
                        case "image/png":
                            extension = ".png";
                            break;
                        case "image/gif":
                            extension = ".gif";
                            break;
                        case "video/mp4":
                            extension = ".mp4";
                            break;
                        case "audio/mpeg":
                            extension = ".mp3";
                            break;
                        case "application/zip":
                            extension = ".zip";
                            break;
                        case "application/x-rar-compressed":
                            extension = ".rar";
                            break;
                        case "text/plain":
                            extension = ".txt";
                            break;
                        case "application/msword":
                            extension = ".doc";
                            break;
                        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                            extension = ".docx";
                            break;
                        default:
                            // If content type contains a known extension, use it
                            if (contentType.contains("pdf")) extension = ".pdf";
                            else if (contentType.contains("jpeg") || contentType.contains("jpg")) extension = ".jpg";
                            else if (contentType.contains("png")) extension = ".png";
                            else if (contentType.contains("gif")) extension = ".gif";
                            else if (contentType.contains("mp4")) extension = ".mp4";
                            else if (contentType.contains("mp3")) extension = ".mp3";
                            break;
                    }
                }
                
                fileName = "download_" + System.currentTimeMillis() + extension;
            }
            
            return fileName;
        } catch (Exception e) {
            // Fallback to a safe default name with timestamp
            return "download_" + System.currentTimeMillis() + ".bin";
        }
    }

    public List<Download> getAllDownloads() {
        return downloadRepository.findAll();
    }

    public Download getDownload(Long id) {
        return downloadRepository.findById(id).orElse(null);
    }

    public void pauseDownload(Long id) {
        downloadRepository.findById(id).ifPresent(download -> {
            download.setDownloadStatus(Download.DownloadStatus.PAUSED);
            downloadRepository.save(download);
        });
    }

    public void resumeDownload(Long id) {
        downloadRepository.findById(id).ifPresent(download -> {
            download.setDownloadStatus(Download.DownloadStatus.IN_PROGRESS);
            downloadRepository.save(download);
            startMultiThreadedDownload(download);
        });
    }
}