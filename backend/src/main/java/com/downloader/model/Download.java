package com.downloader.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class Download {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 2048, columnDefinition = "VARCHAR(2048)")
    private String url;
    private String fileName;
    private String status;
    private long totalSize;
    private long downloadedSize;
    private int progress;
    private int threadCount;
    private LocalDateTime startTime;
    private LocalDateTime completionTime;
    private String filePath;
    
    @Column(length = 1000)
    private String errorMessage;
    
    @Enumerated(EnumType.STRING)
    private DownloadStatus downloadStatus;

    @OneToMany(mappedBy = "download", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DownloadPart> parts = new ArrayList<>();

    public enum DownloadStatus {
        PENDING,
        IN_PROGRESS,
        PAUSED,
        COMPLETED,
        FAILED
    }
} 