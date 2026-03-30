package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/vendors/pending")
    public ResponseEntity<List<User>> getPendingVendors() {
        return ResponseEntity.ok(adminService.getPendingVendors());
    }

    @GetMapping("/vendors/active")
    public ResponseEntity<List<User>> getActiveVendors() {
        return ResponseEntity.ok(adminService.getActiveVendors());
    }

    @GetMapping("/vendors/suspended")
    public ResponseEntity<List<User>> getSuspendedVendors() {
        return ResponseEntity.ok(adminService.getSuspendedVendors());
    }

    @GetMapping("/vendors/stats")
    public ResponseEntity<Map<String, Long>> getVendorStats() {
        return ResponseEntity.ok(adminService.getVendorStats());
    }

    @PostMapping("/vendors/{vendorId}/approve")
    public ResponseEntity<Map<String, String>> approveVendor(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(adminService.approveVendor(vendorId));
        } catch (IllegalArgumentException e) {
            log.warn("Vendor approval request rejected: vendorId={}, reason={}", vendorId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/vendors/{vendorId}/suspend")
    public ResponseEntity<Map<String, String>> suspendVendor(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(adminService.suspendVendor(vendorId));
        } catch (IllegalArgumentException e) {
            log.warn("Vendor suspension request rejected: vendorId={}, reason={}", vendorId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/vendors/{vendorId}/reactivate")
    public ResponseEntity<Map<String, String>> reactivateVendor(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(adminService.reactivateVendor(vendorId));
        } catch (IllegalArgumentException e) {
            log.warn("Vendor reactivation request rejected: vendorId={}, reason={}", vendorId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}