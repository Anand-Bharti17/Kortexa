package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    public List<User> getPendingVendors() {
        return userRepository.findByRoleAndStatus(Role.VENDOR, AccountStatus.PENDING_APPROVAL);
    }

    public Map<String, String> approveVendor(Long vendorId) {
        User vendor = userRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));

        if (vendor.getRole() != Role.VENDOR) {
            throw new IllegalArgumentException("User is not a vendor");
        }

        vendor.setStatus(AccountStatus.ACTIVE);
        userRepository.save(vendor);

        return Map.of("message", "Vendor " + vendor.getEmail() + " has been approved successfully.");
    }
}