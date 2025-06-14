package com.downloader.controller;

import com.downloader.model.Download;
import com.downloader.service.DownloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.MimeTypeUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/downloads")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3004"})
public class DownloadController {

    private final DownloadService downloadService;

    @PostMapping
    public ResponseEntity<Download> startDownload(
        @RequestParam String url,
        @RequestParam(required = false) String fileName,
        @RequestParam(required = false) Integer threadCount
    ) {
        try {
            Download download = downloadService.startDownload(url, fileName, threadCount);
            return ResponseEntity.ok(download);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Download>> getAllDownloads() {
        return ResponseEntity.ok(downloadService.getAllDownloads());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Download> getDownload(@PathVariable Long id) {
        Download download = downloadService.getDownload(id);
        return download != null ? ResponseEntity.ok(download) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            Download download = downloadService.getDownload(id);
            if (download == null || download.getDownloadStatus() != Download.DownloadStatus.COMPLETED) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = downloadService.getDownloadedFile(id);
            Path path = Paths.get(download.getFilePath());
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = MimeTypeUtils.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.getFileName() + "\"")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<Void> pauseDownload(@PathVariable Long id) {
        downloadService.pauseDownload(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<Void> resumeDownload(@PathVariable Long id) {
        downloadService.resumeDownload(id);
        return ResponseEntity.ok().build();
    }
} 