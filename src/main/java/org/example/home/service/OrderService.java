package org.example.home.service;

import org.example.home.entity.Appointment;
import org.example.home.entity.OrderEntity;
import org.example.home.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Random;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final Random random = new Random();

    public OrderService(OrderRepository orderRepository) { 
        this.orderRepository = orderRepository; 
    }

    /**
     * 生成唯一的订单号
     * 格式: ORD + YYYYMMDD + 6位随机数
     * 确保订单号唯一，如果已存在则重新生成
     */
    private String generateOrderNumber() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int attempts = 0;
        int maxAttempts = 100;
        
        do {
            int randomNum = 100000 + random.nextInt(900000); // 6位随机数
            final String orderNumber = "ORD" + dateStr + randomNum; // 使用final局部变量
            attempts++;
            
            // 检查订单号是否已存在
            boolean exists = orderRepository.findAll().stream()
                .anyMatch(o -> orderNumber.equals(o.getOrderNumber()));
            
            if (!exists) {
                return orderNumber;
            }
        } while (attempts < maxAttempts);
        
        // 如果100次尝试后仍然冲突，使用时间戳作为后缀确保唯一性
        long timestamp = System.currentTimeMillis() % 1000000; // 取后6位
        return "ORD" + dateStr + timestamp;
    }

    /**
     * 根据appointment创建订单
     * 如果订单已存在，则返回现有订单
     */
    @Transactional
    public OrderEntity createOrderFromAppointment(Appointment appointment) {
        // 检查是否已经存在订单
        Optional<OrderEntity> existingOrder = orderRepository.findByAppointmentId(appointment.getId());
        if (existingOrder.isPresent()) {
            return existingOrder.get();
        }

        // 创建新订单
        OrderEntity order = new OrderEntity();
        order.setAppointmentId(appointment.getId());
        order.setOrderNumber(generateOrderNumber());
        order.setAmount(appointment.getPrice() != null ? appointment.getPrice() : 0.0);
        order.setPaymentStatus("pending");
        order.setPaymentMethod(null);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    @Transactional
    public void payOrder(Integer id) {
        orderRepository.findById(id).ifPresent(o -> { 
            o.setPaymentStatus("paid"); 
            o.setUpdatedAt(LocalDateTime.now()); 
            orderRepository.save(o); 
        });
    }
}
