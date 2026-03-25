package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    public List<User> getPendingVendors() {
        log.info("Admin request: fetching all vendors pending approval");
        List<User> pending = userRepository.findByRoleAndStatus(Role.VENDOR, AccountStatus.PENDING_APPROVAL);
        log.debug("Found {} vendor(s) pending approval", pending.size());
        return pending;
    }

    public Map<String, String> approveVendor(Long vendorId) {
        log.info("Admin request: approving vendor with id={}", vendorId);
        User vendor = userRepository.findById(vendorId)
                .orElseThrow(() -> {
                    log.warn("Vendor approval failed - vendor not found with id={}", vendorId);
                    return new IllegalArgumentException("Vendor not found");
                });

        if (vendor.getRole() != Role.VENDOR) {
            log.warn("Vendor approval failed - user id={} is not a VENDOR, actual role={}", vendorId, vendor.getRole());
            throw new IllegalArgumentException("User is not a vendor");
        }

        vendor.setStatus(AccountStatus.ACTIVE);
        userRepository.save(vendor);
        log.info("Vendor approved successfully: email={}, id={}", vendor.getEmail(), vendorId);

        return Map.of("message", "Vendor " + vendor.getEmail() + " has been approved successfully.");
    }
}