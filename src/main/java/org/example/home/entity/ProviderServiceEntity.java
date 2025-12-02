package org.example.home.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "provider_services")
public class ProviderServiceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "provider_id")
    private Integer providerId;
    
    @ManyToOne
    @JoinColumn(name = "provider_id", insertable = false, updatable = false)
    private ServiceProvider provider;

    @Column(name = "service_id")
    private Integer serviceId;
    
    @ManyToOne
    @JoinColumn(name = "service_id", insertable = false, updatable = false)
    private ServiceEntity service;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    
    public Integer getProviderId() { return providerId; }
    public void setProviderId(Integer providerId) { this.providerId = providerId; }
    
    public ServiceProvider getProvider() { return provider; }
    public void setProvider(ServiceProvider provider) { this.provider = provider; }
    
    public Integer getServiceId() { return serviceId; }
    public void setServiceId(Integer serviceId) { this.serviceId = serviceId; }
    
    public ServiceEntity getService() { return service; }
    public void setService(ServiceEntity service) { this.service = service; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

