package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.CartItemRequest;
import com.kortexa.kortexa_backend.dto.CartSummaryResponse;
import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.AddressRepository;
import com.kortexa.kortexa_backend.repository.CartRepository;
import com.kortexa.kortexa_backend.repository.CouponRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final CouponRepository couponRepository;
    private final AddressRepository addressRepository;
    private final ActivityService activityService;

    public Cart getOrCreateCart(String email) {
        return cartRepository.findByUserEmail(email).orElseGet(() -> {
            log.info("No existing cart found for user: {}. Creating a new cart.", email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Cart newCart = Cart.builder().user(user).build();
            Cart saved = cartRepository.save(newCart);
            log.debug("New cart created with id={} for user={}", saved.getId(), email);
            return saved;
        });
    }

    public CartSummaryResponse getCartSummary(String email) {
        Cart cart = getOrCreateCart(email);
        BigDecimal subtotal = calculateSubtotal(cart);
        return CartSummaryResponse.builder()
                .subtotal(subtotal)
                .discountAmount(cart.getDiscountAmount())
                .total(cart.getTotalPrice())
                .couponCode(cart.getCouponCode())
                .selectedAddressId(cart.getSelectedAddress() != null ? cart.getSelectedAddress().getId() : null)
                .build();
    }

    @Transactional
    public Cart addItemToCart(String email, CartItemRequest request) {
        log.info("Adding item to cart: user={}, productId={}, quantity={}", email, request.getProductId(), request.getQuantity());
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> {
                    log.warn("Add to cart failed - product not found: productId={}", request.getProductId());
                    return new RuntimeException("Product not found");
                });

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            if (newQty > product.getStockQuantity()) {
                throw new IllegalArgumentException(
                        "Only " + product.getStockQuantity() + " units available for " + product.getName());
            }
            item.setQuantity(newQty);
        } else {
            if (request.getQuantity() > product.getStockQuantity()) {
                throw new IllegalArgumentException(
                        "Only " + product.getStockQuantity() + " units available for " + product.getName());
            }
            CartItem newItem = CartItem.builder()
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.addItem(newItem);
        }

        recalculateTotal(cart);
        Cart savedCart = cartRepository.save(cart);
        log.info("Cart updated for user={}, total={}", email, savedCart.getTotalPrice());
        return savedCart;
    }

    @Transactional
    public Cart removeItemFromCart(String email, Long productId) {
        log.info("Removing item from cart: user={}, productId={}", email, productId);
        Cart cart = getOrCreateCart(email);
        cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        recalculateTotal(cart);
        return cartRepository.save(cart);
    }

    @Transactional
    public CartSummaryResponse applyCoupon(String email, String code) {
        Cart cart = getOrCreateCart(email);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Add items to your cart before applying a coupon");
        }

        BigDecimal subtotal = calculateSubtotal(cart);
        Coupon coupon = couponService.validateCoupon(code, subtotal);
        BigDecimal discount = couponService.calculateDiscount(coupon, subtotal);

        cart.setCouponCode(coupon.getCode());
        cart.setDiscountAmount(discount);
        cart.setTotalPrice(subtotal.subtract(discount).max(BigDecimal.ZERO));
        cartRepository.save(cart);

        User user = cart.getUser();
        activityService.log(ActivityType.COUPON_APPLIED, email,
                user != null ? user.getRole().name() : "CUSTOMER",
                "Applied coupon " + coupon.getCode() + " (₹" + discount + " off)",
                "COUPON", coupon.getId());

        return getCartSummary(email);
    }

    @Transactional
    public CartSummaryResponse removeCoupon(String email) {
        Cart cart = getOrCreateCart(email);
        cart.setCouponCode(null);
        cart.setDiscountAmount(BigDecimal.ZERO);
        recalculateTotal(cart);
        cartRepository.save(cart);
        return getCartSummary(email);
    }

    @Transactional
    public CartSummaryResponse selectShippingAddress(String email, Long addressId) {
        Cart cart = getOrCreateCart(email);
        Address address = addressRepository.findByIdAndUser_Email(addressId, email)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        cart.setSelectedAddress(address);
        cartRepository.save(cart);
        return getCartSummary(email);
    }

    @Transactional
    public void clearCartAfterCheckout(Cart cart) {
        cart.getItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cart.setCouponCode(null);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setSelectedAddress(null);
        cartRepository.save(cart);
    }

    public void applyCouponUsageIfPresent(Cart cart) {
        if (cart.getCouponCode() == null) {
            return;
        }
        couponRepository.findByCodeIgnoreCase(cart.getCouponCode())
                .ifPresent(couponService::incrementUsage);
    }

    private BigDecimal calculateSubtotal(Cart cart) {
        return cart.getItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void recalculateTotal(Cart cart) {
        BigDecimal subtotal = calculateSubtotal(cart);
        if (cart.getCouponCode() != null) {
            try {
                Coupon coupon = couponService.validateCoupon(cart.getCouponCode(), subtotal);
                BigDecimal discount = couponService.calculateDiscount(coupon, subtotal);
                cart.setDiscountAmount(discount);
                cart.setTotalPrice(subtotal.subtract(discount).max(BigDecimal.ZERO));
                return;
            } catch (IllegalArgumentException ex) {
                cart.setCouponCode(null);
                cart.setDiscountAmount(BigDecimal.ZERO);
            }
        }
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setTotalPrice(subtotal);
    }
}
