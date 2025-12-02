package org.example.home.repository;

import org.example.home.entity.ProviderDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderDocumentRepository extends JpaRepository<ProviderDocument, Integer> {
    List<ProviderDocument> findByProviderId(Integer providerId);
}
