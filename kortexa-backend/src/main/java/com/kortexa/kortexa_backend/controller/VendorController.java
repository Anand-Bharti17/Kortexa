package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.VendorSettlementResponse;
import com.kortexa.kortexa_backend.service.VendorSettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
public class VendorController {

    private final VendorSettlementService vendorSettlementService;

    @GetMapping("/settlement")
    public ResponseEntity<VendorSettlementResponse> getSettlement(Authentication authentication) {
        return ResponseEntity.ok(vendorSettlementService.getSettlement(authentication.getName()));
    }
}
