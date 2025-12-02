package org.example.home.repository;

import org.example.home.entity.ServiceProvider;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Integer> {
}
