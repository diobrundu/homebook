package org.example.home.service;

import org.example.home.entity.Review;
import org.example.home.repository.ReviewRepository;
import org.example.home.repository.ServiceProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ServiceProviderRepository providerRepository;

    public ReviewService(ReviewRepository reviewRepository, ServiceProviderRepository providerRepository) {
        this.reviewRepository = reviewRepository;
        this.providerRepository = providerRepository;
    }

    @Transactional
    public Review submitReview(Review r) {
        System.out.println("========== ReviewService.submitReview() ==========");
        System.out.println("【接收到的Review对象】");
        System.out.println("  appointmentId: " + r.getAppointmentId());
        System.out.println("  customerId: " + r.getCustomerId());
        System.out.println("  providerId: " + r.getProviderId() + " (isNull: " + (r.getProviderId() == null) + ")");
        System.out.println("  rating: " + r.getRating());
        System.out.println("  comment: " + (r.getComment() != null ? (r.getComment().length() > 50 ? r.getComment().substring(0, 50) + "..." : r.getComment()) : "null"));
        
        // 检查是否已存在该预约的评价（数据库有唯一约束）
        Optional<Review> existingReview = reviewRepository.findByAppointmentId(r.getAppointmentId());
        
        if (existingReview.isPresent()) {
            System.out.println("【更新现有评价】找到已存在的评价，将更新");
            // 如果已存在，更新现有评价（根据数据库唯一约束，每个预约只能有一条评价）
            Review existing = existingReview.get();
            existing.setRating(r.getRating());
            existing.setComment(r.getComment());
            // 注意：数据库表结构中没有 updated_at 字段，所以不更新
            r = existing;
        } else {
            System.out.println("【新建评价】未找到已存在的评价，将创建新评价");
            // 新建评价
            r.setCreatedAt(LocalDateTime.now());
        }
        
        System.out.println("【保存Review到数据库】");
        System.out.println("  保存前的providerId: " + r.getProviderId());
        Review saved = reviewRepository.save(r);
        System.out.println("  保存后的Review ID: " + saved.getId());
        System.out.println("  保存后的providerId: " + saved.getProviderId());
        
        // 更新服务人员的平均评分
        Integer providerId = saved.getProviderId();
        System.out.println("【更新服务人员评分】");
        System.out.println("  使用的providerId: " + providerId);
        
        if (providerId == null || providerId <= 0) {
            System.out.println("  ⚠️  警告：providerId为null或无效，跳过更新服务人员评分");
        } else {
            Double avg = reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
            System.out.println("  计算的平均评分: " + avg);
            
            providerRepository.findById(providerId).ifPresent(p -> { 
                System.out.println("  找到服务人员，ID: " + p.getId());
                p.setRating(avg); 
                providerRepository.save(p);
                System.out.println("  服务人员评分已更新为: " + avg);
            });
            
            if (!providerRepository.findById(providerId).isPresent()) {
                System.out.println("  ⚠️  警告：未找到ID为 " + providerId + " 的服务人员");
            }
        }
        
        System.out.println("==================================================");
        return saved;
    }
}
