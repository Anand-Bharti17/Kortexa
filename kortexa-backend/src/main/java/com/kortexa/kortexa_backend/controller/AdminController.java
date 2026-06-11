package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.ActivityEventResponse;
import com.kortexa.kortexa_backend.dto.AdminOrderDetailDto;
import com.kortexa.kortexa_backend.dto.CouponRequest;
import com.kortexa.kortexa_backend.model.Coupon;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.service.ActivityService;
import com.kortexa.kortexa_backend.service.AdminOrderService;
import com.kortexa.kortexa_backend.service.AdminService;
import com.kortexa.kortexa_backend.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
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
    private final AdminOrderService adminOrderService;
    private final ActivityService activityService;
    private final CouponService couponService;

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

    @GetMapping("/orders")
    public ResponseEntity<Page<AdminOrderDetailDto>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminOrderService.getAllOrders(page, size));
    }

    @GetMapping("/activity")
    public ResponseEntity<Page<ActivityEventResponse>> getRecentActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(activityService.getRecentActivity(page, size));
    }

    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @PostMapping("/coupons")
    public ResponseEntity<?> createCoupon(
            @Valid @RequestBody CouponRequest request,
            java.security.Principal principal) {
        try {
            return ResponseEntity.ok(couponService.createCoupon(request, principal.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}