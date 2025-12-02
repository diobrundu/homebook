package org.example.home.repository;

import org.example.home.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    
    /**
     * 统计今日访问用户数（last_login_time在今天）
     */
    @Query("SELECT COUNT(DISTINCT u.id) FROM User u WHERE u.lastLoginTime >= :startOfDay AND u.lastLoginTime < :endOfDay")
    long countTodayVisitors(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
