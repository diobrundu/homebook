package org.example.home.service;

import org.example.home.entity.User;
import org.example.home.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> findAll() { return userRepository.findAll(); }

    @Transactional
    public User register(User u) {
        // Encrypt password before saving
        if (u.getPassword() != null && !u.getPassword().startsWith("$2a$") && !u.getPassword().startsWith("$2b$") && !u.getPassword().startsWith("$2y$")) {
            u.setPassword(passwordEncoder.encode(u.getPassword()));
        }
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

    @Transactional
    public void updateProfile(Integer id, String name, String phone, String email) {
        userRepository.findById(id).ifPresent(u -> {
            u.setName(name);
            u.setPhone(phone);
            u.setEmail(email);
            u.setUpdatedAt(LocalDateTime.now());
            userRepository.save(u);
        });
    }
}
