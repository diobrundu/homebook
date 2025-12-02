package org.example.home.repository;

import org.example.home.entity.ProviderAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, Integer> {
    List<ProviderAvailability> findByProviderIdOrderByStartTime(Integer providerId);
}
