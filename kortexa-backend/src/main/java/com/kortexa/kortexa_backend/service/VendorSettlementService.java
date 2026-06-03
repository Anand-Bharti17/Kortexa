package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.LedgerEntryResponse;
import com.kortexa.kortexa_backend.dto.VendorSettlementResponse;
import com.kortexa.kortexa_backend.model.LedgerEntry;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.model.Wallet;
import com.kortexa.kortexa_backend.repository.LedgerEntryRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import com.kortexa.kortexa_backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorSettlementService {

    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.10");

    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final UserRepository userRepository;

    public VendorSettlementResponse getSettlement(String vendorEmail) {
        User vendor = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));

        Wallet wallet = walletRepository.findByUserEmail(vendorEmail)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().user(vendor).balance(BigDecimal.ZERO).build()));

        List<LedgerEntryResponse> entries = ledgerEntryRepository
                .findByWallet_User_EmailOrderByCreatedAtDesc(vendorEmail, PageRequest.of(0, 20))
                .stream()
                .map(this::toResponse)
                .toList();

        return new VendorSettlementResponse(wallet.getBalance(), COMMISSION_RATE, entries);
    }

    private LedgerEntryResponse toResponse(LedgerEntry entry) {
        return new LedgerEntryResponse(
                entry.getId(),
                entry.getTransactionType(),
                entry.getAmount(),
                entry.getReferenceId(),
                entry.getDescription(),
                entry.getCreatedAt());
    }
}
