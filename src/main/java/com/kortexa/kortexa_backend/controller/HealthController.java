package com.kortexa.kortexa_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    // Injecting the DataSource to verify database connection
    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "kortexa-backend");

        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(1000)) {
                status.put("database", "CONNECTED");
            } else {
                status.put("database", "DISCONNECTED");
            }
        } catch (Exception e) {
            status.put("database", "ERROR: " + e.getMessage());
            return ResponseEntity.status(500).body(status);
        }

        return ResponseEntity.ok(status);
    }
}