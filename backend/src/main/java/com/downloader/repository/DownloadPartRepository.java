package com.downloader.repository;

import com.downloader.model.DownloadPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DownloadPartRepository extends JpaRepository<DownloadPart, Long> {
} 