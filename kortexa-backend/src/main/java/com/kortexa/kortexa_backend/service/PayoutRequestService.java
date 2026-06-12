package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.PayoutRequestResolveDto;
import com.kortexa.kortexa_backend.dto.PayoutRequestResponseDto;
import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.LedgerEntryRepository;
import com.kortexa.kortexa_backend.repository.PayoutRequestRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import com.kortexa.kortexa_backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayoutRequestService {

    private final PayoutRequestRepository payoutRequestRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional
    public PayoutRequestResponseDto submit(String vendorEmail, BigDecimal amount, String paymentNote) {
        if (amount.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException("Minimum withdrawal is ₹1");
        }

        if (payoutRequestRepository.existsByVendor_EmailAndStatus(
                vendorEmail, PayoutRequestStatus.PENDING)) {
            throw new IllegalArgumentException("You already have a pending payout request");
        }

        User vendor = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));

        Wallet wallet = walletRepository.findByUserEmail(vendorEmail)
                .orElseThrow(() -> new IllegalArgumentException("No wallet balance available"));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient wallet balance. Available: ₹" + wallet.getBalance());
        }

        PayoutRequest saved = payoutRequestRepository.save(PayoutRequest.builder()
                .vendor(vendor)
                .amount(amount)
                .paymentNote(paymentNote != null ? paymentNote.trim() : null)
                .build());

        activityService.log(
                ActivityType.PAYOUT_REQUESTED,
                vendorEmail,
                "VENDOR",
                "Requested payout of ₹" + amount,
                "PAYOUT",
                saved.getId());

        return toDto(saved);
    }

    public List<PayoutRequestResponseDto> getVendorRequests(String vendorEmail) {
        return payoutRequestRepository.findByVendor_EmailOrderByCreatedAtDesc(vendorEmail)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public Page<PayoutRequestResponseDto> getAllRequests(int page, int size, String statusFilter) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        PageRequest pageable = PageRequest.of(page, safeSize);
        if (statusFilter != null && !statusFilter.isBlank()) {
            PayoutRequestStatus status = PayoutRequestStatus.valueOf(statusFilter.trim().toUpperCase());
            return payoutRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::toDto);
        }
        return payoutRequestRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional
    public PayoutRequestResponseDto resolveByAdmin(Long requestId, String adminEmail, PayoutRequestResolveDto dto) {
        PayoutRequest request = payoutRequestRepository.findWithVendorById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payout request not found"));

        if (request.getStatus() != PayoutRequestStatus.PENDING) {
            throw new IllegalArgumentException("This payout request has already been resolved");
        }

        request.setResolvedByEmail(adminEmail);
        request.setResolutionNote(dto.getNote());
        request.setResolvedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.getApproved())) {
            String vendorEmail = request.getVendor().getEmail();
            Wallet wallet = walletRepository.findByUserEmail(vendorEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Vendor wallet not found"));

            if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
                throw new IllegalArgumentException("Vendor no longer has sufficient balance for this payout");
            }

            wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
            walletRepository.save(wallet);

            ledgerEntryRepository.save(LedgerEntry.builder()
                    .wallet(wallet)
                    .transactionType("WITHDRAWAL")
                    .amount(request.getAmount().negate())
                    .referenceId("PAYOUT-" + request.getId())
                    .description("Withdrawal approved by admin")
                    .build());

            request.setStatus(PayoutRequestStatus.APPROVED);

            activityService.log(
                    ActivityType.PAYOUT_APPROVED,
                    adminEmail,
                    "ADMIN",
                    "Approved payout of ₹" + request.getAmount() + " for " + vendorEmail,
                    "PAYOUT",
                    request.getId());

            notificationService.notifyUser(
                    vendorEmail,
                    "Payout approved",
                    "Your withdrawal of ₹" + request.getAmount() + " was approved.",
                    "PAYOUT_APPROVED",
                    "PAYOUT",
                    request.getId());
        } else {
            request.setStatus(PayoutRequestStatus.REJECTED);
            activityService.log(
                    ActivityType.PAYOUT_REJECTED,
                    adminEmail,
                    "ADMIN",
                    "Rejected payout request #" + request.getId(),
                    "PAYOUT",
                    request.getId());

            String vendorEmail = request.getVendor() != null ? request.getVendor().getEmail() : null;
            notificationService.notifyUser(
                    vendorEmail,
                    "Payout rejected",
                    "Your withdrawal request was rejected.",
                    "PAYOUT_REJECTED",
                    "PAYOUT",
                    request.getId());
        }

        return toDto(payoutRequestRepository.save(request));
    }

    private PayoutRequestResponseDto toDto(PayoutRequest request) {
        return PayoutRequestResponseDto.builder()
                .id(request.getId())
                .vendorEmail(request.getVendor() != null ? request.getVendor().getEmail() : null)
                .amount(request.getAmount())
                .status(request.getStatus())
                .paymentNote(request.getPaymentNote())
                .resolutionNote(request.getResolutionNote())
                .resolvedByEmail(request.getResolvedByEmail())
                .createdAt(request.getCreatedAt())
                .resolvedAt(request.getResolvedAt())
                .build();
    }
}
