package org.example.home.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class VerificationCodeService {
    private static class CodeEntry {
        private final String code;
        private final LocalDateTime expireAt;

        CodeEntry(String code, LocalDateTime expireAt) {
            this.code = code;
            this.expireAt = expireAt;
        }
    }

    private final Map<String, CodeEntry> store = new ConcurrentHashMap<>();
    private static final int EXPIRE_MINUTES = 10;

    public String generateCode(String email) {
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        store.put(email.toLowerCase(), new CodeEntry(code, LocalDateTime.now().plusMinutes(EXPIRE_MINUTES)));
        return code;
    }

    public boolean validateCode(String email, String code) {
        if (email == null || code == null) return false;
        CodeEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (entry.expireAt.isBefore(LocalDateTime.now())) {
            store.remove(email.toLowerCase());
            return false;
        }
        boolean valid = entry.code.equalsIgnoreCase(code.trim());
        if (valid) {
            store.remove(email.toLowerCase());
        }
        return valid;
    }
}

