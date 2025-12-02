package org.example.home.service;

import org.example.home.entity.Message;
import org.example.home.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class MessageService {
    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) { this.messageRepository = messageRepository; }

    @Transactional
    public Message sendMessage(Message m) {
        m.setIsRead(false);
        m.setCreatedAt(LocalDateTime.now());
        return messageRepository.save(m);
    }
}
