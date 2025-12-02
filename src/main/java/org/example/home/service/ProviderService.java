package org.example.home.service;

import org.example.home.entity.ProviderAvailability;
import org.example.home.entity.ProviderDocument;
import org.example.home.entity.ProviderServiceEntity;
import org.example.home.repository.ProviderAvailabilityRepository;
import org.example.home.repository.ProviderDocumentRepository;
import org.example.home.repository.ProviderServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProviderService {
    private final ProviderDocumentRepository documentRepository;
    private final ProviderAvailabilityRepository availabilityRepository;
    private final ProviderServiceRepository providerServiceRepository;

    public ProviderService(ProviderDocumentRepository documentRepository, ProviderAvailabilityRepository availabilityRepository, ProviderServiceRepository providerServiceRepository) {
        this.documentRepository = documentRepository;
        this.availabilityRepository = availabilityRepository;
        this.providerServiceRepository = providerServiceRepository;
    }

    @Transactional
    public ProviderDocument addDocument(ProviderDocument d) {
        d.setSubmittedAt(LocalDateTime.now());
        d.setStatus("pending");
        return documentRepository.save(d);
    }

    @Transactional
    public void reviewDocument(Integer id, String status, Integer reviewerId) {
        documentRepository.findById(id).ifPresent(d -> { d.setStatus(status); d.setReviewerId(reviewerId); d.setReviewedAt(LocalDateTime.now()); documentRepository.save(d); });
    }

    @Transactional
    public ProviderAvailability addAvailability(ProviderAvailability p) {
        return availabilityRepository.save(p);
    }

    @Transactional
    public void bookAvailability(Integer id) {
        availabilityRepository.findById(id).ifPresent(a -> { a.setIsBooked(true); availabilityRepository.save(a); });
    }

    // Provider Service Management
    @Transactional
    public List<ProviderServiceEntity> getProviderServices(Integer providerId) {
        return providerServiceRepository.findByProviderId(providerId);
    }

    @Transactional
    public ProviderServiceEntity addProviderService(Integer providerId, Integer serviceId) {
        // 检查是否已存在
        Optional<ProviderServiceEntity> existing = providerServiceRepository.findByProviderIdAndServiceId(providerId, serviceId);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        ProviderServiceEntity ps = new ProviderServiceEntity();
        ps.setProviderId(providerId);
        ps.setServiceId(serviceId);
        ps.setCreatedAt(LocalDateTime.now());
        return providerServiceRepository.save(ps);
    }

    @Transactional
    public void removeProviderService(Integer providerId, Integer serviceId) {
        providerServiceRepository.deleteByProviderIdAndServiceId(providerId, serviceId);
    }

    @Transactional
    public void updateProviderServices(Integer providerId, List<Integer> serviceIds) {
        // 删除所有现有的服务
        List<ProviderServiceEntity> existing = providerServiceRepository.findByProviderId(providerId);
        providerServiceRepository.deleteAll(existing);
        
        // 添加新的服务
        for (Integer serviceId : serviceIds) {
            addProviderService(providerId, serviceId);
        }
    }
}
