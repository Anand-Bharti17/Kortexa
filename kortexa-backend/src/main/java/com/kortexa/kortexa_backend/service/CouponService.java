package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.CouponRequest;
import com.kortexa.kortexa_backend.dto.CouponUpdateRequest;
import com.kortexa.kortexa_backend.model.Coupon;
import com.kortexa.kortexa_backend.model.DiscountType;
import com.kortexa.kortexa_backend.repository.CouponRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final ActivityService activityService;

    public Coupon validateCoupon(String code, BigDecimal subtotal) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new IllegalArgumentException("This coupon is no longer active");
        }

        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This coupon has expired");
        }

        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new IllegalArgumentException("This coupon has reached its usage limit");
        }

        if (coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException(
                    "Minimum order amount of ₹" + coupon.getMinOrderAmount() + " required for this coupon");
        }

        return coupon;
    }

    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENT) {
            discount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = coupon.getDiscountValue();
        }
        return discount.min(subtotal).max(BigDecimal.ZERO);
    }

    @Transactional
    public void incrementUsage(Coupon coupon) {
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Transactional
    public Coupon createCoupon(CouponRequest request, String adminEmail) {
        if (couponRepository.findByCodeIgnoreCase(request.getCode().trim()).isPresent()) {
            throw new IllegalArgumentException("Coupon code already exists");
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode().trim().toUpperCase())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxUses(request.getMaxUses())
                .active(request.isActive())
                .expiresAt(request.getExpiresAt())
                .build();

        Coupon saved = couponRepository.save(coupon);
        activityService.log(
                com.kortexa.kortexa_backend.model.ActivityType.COUPON_CREATED,
                adminEmail, "ADMIN",
                "Created coupon " + saved.getCode(),
                "COUPON", saved.getId());
        return saved;
    }

    @Transactional
    public Coupon updateCoupon(Long couponId, CouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));

        if (request.getDescription() != null) {
            coupon.setDescription(request.getDescription());
        }
        if (request.getActive() != null) {
            coupon.setActive(request.getActive());
        }
        if (request.getMaxUses() != null) {
            coupon.setMaxUses(request.getMaxUses());
        }

        return couponRepository.save(coupon);
    }
}
