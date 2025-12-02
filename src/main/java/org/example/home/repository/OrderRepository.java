package org.example.home.repository;

import org.example.home.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Integer> {
    List<OrderEntity> findByAppointmentIdIn(List<Integer> appointmentIds);
    Optional<OrderEntity> findByAppointmentId(Integer appointmentId);
    
    /**
     * 查询指定时间范围内的订单
     */
    @Query("SELECT o FROM OrderEntity o WHERE o.createdAt >= :startDateTime AND o.createdAt < :endDateTime")
    List<OrderEntity> findByCreatedAtBetween(@Param("startDateTime") LocalDateTime startDateTime, 
                                             @Param("endDateTime") LocalDateTime endDateTime);
}
