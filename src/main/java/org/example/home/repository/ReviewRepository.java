package org.example.home.repository;

import org.example.home.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByProviderIdOrderByCreatedAtDesc(Integer providerId);
    
    // 根据预约ID查找评价（由于数据库有唯一约束，每个预约只能有一条评价）
    Optional<Review> findByAppointmentId(Integer appointmentId);
}
