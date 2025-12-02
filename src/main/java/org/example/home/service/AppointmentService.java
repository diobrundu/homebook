package org.example.home.service;

import org.example.home.entity.Appointment;
import org.example.home.entity.ProviderServiceEntity;
import org.example.home.entity.ServiceProvider;
import org.example.home.repository.AppointmentRepository;
import org.example.home.repository.ProviderServiceRepository;
import org.example.home.repository.ServiceProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final ServiceProviderRepository providerRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final OrderService orderService;

    public AppointmentService(AppointmentRepository appointmentRepository, ServiceProviderRepository providerRepository, ProviderServiceRepository providerServiceRepository, OrderService orderService) {
        this.appointmentRepository = appointmentRepository;
        this.providerRepository = providerRepository;
        this.providerServiceRepository = providerServiceRepository;
        this.orderService = orderService;
    }

    @Transactional
    public Appointment createAppointment(Appointment a) {
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        // assign provider if none - 根据服务类型自动匹配服务人员
        if (a.getProvider() == null && a.getService() != null && a.getService().getId() != null) {
            // 查找能够提供该服务的服务人员
            List<ProviderServiceEntity> providerServices = providerServiceRepository.findByServiceId(a.getService().getId());
            List<Integer> providerIds = providerServices.stream()
                .map(ProviderServiceEntity::getProviderId)
                .collect(Collectors.toList());
            
            if (!providerIds.isEmpty()) {
                // 获取这些服务人员中已审核通过的，按评分排序
                List<ServiceProvider> availableProviders = providerRepository.findAll().stream()
                    .filter(p -> providerIds.contains(p.getId()))
                    .filter(p -> "approved".equals(p.getStatus()))
                    .sorted((p1, p2) -> {
                        // 按评分降序排序，如果评分为null则放在后面
                        Double r1 = p1.getRating();
                        Double r2 = p2.getRating();
                        if (r1 == null && r2 == null) return 0;
                        if (r1 == null) return 1;
                        if (r2 == null) return -1;
                        return Double.compare(r2, r1);
                    })
                    .collect(Collectors.toList());
                
                if (!availableProviders.isEmpty()) {
                    a.setProvider(availableProviders.get(0));
                }
            }
            
            // 如果没有匹配的服务人员，保持为null（待手动分配）
        }
        
        // 保存预约
        Appointment saved = appointmentRepository.save(a);
        
        // 立即创建订单
        orderService.createOrderFromAppointment(saved);
        
        return saved;
    }

    @Transactional
    public void updateStatus(Integer id, String status) {
        appointmentRepository.findById(id).ifPresent(a -> { 
            a.setStatus(status); 
            a.setUpdatedAt(LocalDateTime.now()); 
            appointmentRepository.save(a);
            
            // 注意：订单已在创建预约时创建（createAppointment方法中）
            // 这里的逻辑作为后备，确保即使之前创建失败，在接单时也能创建订单
            // createOrderFromAppointment 方法会检查订单是否已存在，不会创建重复订单
            if ("accepted".equals(status)) {
                orderService.createOrderFromAppointment(a);
            }
        });
    }

    @Transactional
    public void reschedule(Integer id, LocalDateTime newTime) {
        appointmentRepository.findById(id).ifPresent(a -> { a.setAppointmentTime(newTime); a.setStatus("pending"); a.setUpdatedAt(LocalDateTime.now()); appointmentRepository.save(a); });
    }

    @Transactional
    public void updateProvider(Integer id, Integer providerId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with id: " + id));
        
        // Prevent updating provider for completed appointments
        if ("completed".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalStateException("Cannot modify provider for completed appointment");
        }
        
        if (providerId != null) {
            ServiceProvider provider = providerRepository.findById(providerId)
                    .orElseThrow(() -> new IllegalArgumentException("Provider not found with id: " + providerId));
            appointment.setProvider(provider);
        } else {
            // Set provider to null (unassign)
            appointment.setProvider(null);
        }
        
        appointment.setUpdatedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);
    }
}
