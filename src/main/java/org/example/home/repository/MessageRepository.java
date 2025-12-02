package org.example.home.repository;

import org.example.home.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    List<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Integer senderId, Integer receiverId);
}
