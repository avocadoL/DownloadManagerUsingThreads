package com.downloader.repository;

import com.downloader.model.Download;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.stereotype.Repository;

import jakarta.persistence.QueryHint;
import java.util.List;

@Repository
public interface DownloadRepository extends JpaRepository<Download, Long> {
    @QueryHints({ @QueryHint(name = "org.hibernate.cacheable", value = "true") })
    List<Download> findAll();
} 