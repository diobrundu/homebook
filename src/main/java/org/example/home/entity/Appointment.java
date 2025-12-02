package org.example.home.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne
    @JoinColumn(name = "provider_id")
    private ServiceProvider provider;
    
    // 直接映射provider_id字段，用于读取数据库中的实际值（即使provider对象为null）
    @Column(name = "provider_id", insertable = false, updatable = false)
    private Integer providerIdFromDb;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private ServiceEntity service;

    @Column(name = "appointment_time")
    private LocalDateTime appointmentTime;

    @Column(name = "duration_hours")
    private Double durationHours;

    private Double price;

    private String address;
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public ServiceProvider getProvider() { return provider; }
    public void setProvider(ServiceProvider provider) { this.provider = provider; }
    public ServiceEntity getService() { return service; }
    public void setService(ServiceEntity service) { this.service = service; }
    public LocalDateTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalDateTime appointmentTime) { this.appointmentTime = appointmentTime; }
    public Double getDurationHours() { return durationHours; }
    public void setDurationHours(Double durationHours) { this.durationHours = durationHours; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods for JSON serialization
    // 使用@JsonProperty强制使用指定的字段名，即使全局配置了SNAKE_CASE
    @JsonProperty(value = "providerId", required = false)
    public Integer getProviderId() {
        // 优先从provider对象获取
        if (provider != null) {
            return provider.getId();
        }
        // 如果provider对象为null，尝试从数据库字段直接读取
        if (providerIdFromDb != null) {
            return providerIdFromDb;
        }
        return null;
    }
    
    // Getter for providerIdFromDb (for debugging)
    public Integer getProviderIdFromDb() {
        return providerIdFromDb;
    }
    
    @JsonProperty(value = "customerId", required = false)
    public Integer getCustomerId() {
        if (customer == null) return null;
        return customer.getId();
    }
    
    @JsonProperty(value = "serviceId", required = false)
    public Integer getServiceId() {
        if (service == null) return null;
        return service.getId();
    }
    
    @JsonProperty(value = "customerName", required = false)
    public String getCustomerName() {
        if (customer == null) return null;
        return customer.getName();
    }
    
    @JsonProperty(value = "providerName", required = false)
    public String getProviderName() {
        if (provider == null || provider.getUser() == null) return null;
        // ServiceProvider gets name from associated User
        return provider.getUser().getName();
    }
    
    @JsonProperty(value = "serviceName", required = false)
    public String getServiceName() {
        if (service == null) return null;
        return service.getName();
    }
}
