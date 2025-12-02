package org.example.home.exception;

import org.example.home.config.WebConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        
        // Build a readable error message
        StringBuilder errorMessage = new StringBuilder("Validation failed: ");
        errors.forEach((field, message) -> errorMessage.append(field).append(" - ").append(message).append("; "));
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", errorMessage.toString().trim());
        response.put("errors", errors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(WebConfig.APPLICATION_JSON_UTF8)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(WebConfig.APPLICATION_JSON_UTF8)
                .body(Map.of("error", ex.getMessage()));
    }
}
