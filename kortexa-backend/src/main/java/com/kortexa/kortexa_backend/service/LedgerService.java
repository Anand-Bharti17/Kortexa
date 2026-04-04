package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    private static final BigDecimal PLATFORM_COMMISSION_RATE = new BigDecimal("0.10"); // 10% commission

    @Transactional
    public void processOrderPayout(Order order) {
        log.info("Processing ledger payouts for order: {}", order.getId());

        for (OrderItem item : order.getItems()) {
            User vendor = item.getProduct().getVendor();
            if (vendor == null) {
                log.warn("Vendor missing for product ID: {}", item.getProduct().getId());
                continue;
            }

            BigDecimal itemTotal = item.getPriceAtPurchase().multiply(new BigDecimal(item.getQuantity()));
            
            // Calculate 10% commission
            BigDecimal commission = itemTotal.multiply(PLATFORM_COMMISSION_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal vendorShare = itemTotal.subtract(commission);

            // Fetch or create Vendor Wallet
            Wallet vendorWallet = walletRepository.findByUserEmail(vendor.getEmail())
                    .orElseGet(() -> walletRepository.save(Wallet.builder().user(vendor).balance(BigDecimal.ZERO).build()));

            // Update balance
            vendorWallet.setBalance(vendorWallet.getBalance().add(vendorShare));
            walletRepository.save(vendorWallet);

            // Record Ledger Entry
            LedgerEntry entry = LedgerEntry.builder()
                    .wallet(vendorWallet)
                    .transactionType("VENDOR_PAYOUT")
                    .amount(vendorShare)
                    .referenceId("ORDER-" + order.getId())
                    .description("Payout for " + item.getQuantity() + "x " + item.getProduct().getName())
                    .build();
            
            ledgerEntryRepository.save(entry);
            log.info("Ledger updated: Vendor {} credited ₹{}", vendor.getEmail(), vendorShare);
        }
    }
}
