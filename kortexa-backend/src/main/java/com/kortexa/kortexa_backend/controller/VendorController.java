package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.PayoutRequestResponseDto;
import com.kortexa.kortexa_backend.dto.PayoutRequestSubmitDto;
import com.kortexa.kortexa_backend.dto.VendorSettlementResponse;
import com.kortexa.kortexa_backend.service.PayoutRequestService;
import com.kortexa.kortexa_backend.service.VendorSettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
public class VendorController {

    private final VendorSettlementService vendorSettlementService;
    private final PayoutRequestService payoutRequestService;

    @GetMapping("/settlement")
    public ResponseEntity<VendorSettlementResponse> getSettlement(Authentication authentication) {
        return ResponseEntity.ok(vendorSettlementService.getSettlement(authentication.getName()));
    }

    @GetMapping("/payout-requests")
    public ResponseEntity<List<PayoutRequestResponseDto>> getPayoutRequests(Authentication authentication) {
        return ResponseEntity.ok(payoutRequestService.getVendorRequests(authentication.getName()));
    }

    @PostMapping("/payout-requests")
    public ResponseEntity<?> submitPayoutRequest(
            @Valid @RequestBody PayoutRequestSubmitDto body,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(payoutRequestService.submit(
                    authentication.getName(), body.getAmount(), body.getPaymentNote()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
