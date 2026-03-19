package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/vendors/pending")
    public ResponseEntity<List<User>> getPendingVendors() {
        return ResponseEntity.ok(adminService.getPendingVendors());
    }

    @PostMapping("/vendors/{vendorId}/approve")
    public ResponseEntity<Map<String, String>> approveVendor(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(adminService.approveVendor(vendorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}