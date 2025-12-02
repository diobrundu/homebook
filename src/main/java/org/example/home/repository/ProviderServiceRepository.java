package org.example.home.repository;

import org.example.home.entity.ProviderServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderServiceRepository extends JpaRepository<ProviderServiceEntity, Integer> {
    List<ProviderServiceEntity> findByProviderId(Integer providerId);
    List<ProviderServiceEntity> findByServiceId(Integer serviceId);
    Optional<ProviderServiceEntity> findByProviderIdAndServiceId(Integer providerId, Integer serviceId);
    void deleteByProviderIdAndServiceId(Integer providerId, Integer serviceId);
}

