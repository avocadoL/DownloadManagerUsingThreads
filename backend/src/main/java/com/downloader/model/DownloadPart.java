package com.downloader.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Data
@NoArgsConstructor
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class DownloadPart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private long startByte;
    private long endByte;
    private long downloadedBytes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "download_id")
    @JsonIgnore
    private Download download;
} 