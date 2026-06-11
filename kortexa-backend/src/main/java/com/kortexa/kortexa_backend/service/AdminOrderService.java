package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.AdminOrderDetailDto;
import com.kortexa.kortexa_backend.dto.AdminOrderItemDto;
import com.kortexa.kortexa_backend.model.Address;
import com.kortexa.kortexa_backend.model.Order;
import com.kortexa.kortexa_backend.model.OrderItem;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;

    public Page<AdminOrderDetailDto> getAllOrders(int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        return orderRepository
                .findAllByOrderByOrderDateDesc(PageRequest.of(page, safeSize))
                .map(this::toDetailDto);
    }

    private AdminOrderDetailDto toDetailDto(Order order) {
        User customer = order.getCustomer();
        return AdminOrderDetailDto.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .couponCode(order.getCouponCode())
                .customerId(customer != null ? customer.getId() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                .customerName(customer != null ? customer.getName() : null)
                .shippingSummary(formatShipping(order.getShippingAddress()))
                .items(mapItems(order.getItems()))
                .build();
    }

    private List<AdminOrderItemDto> mapItems(List<OrderItem> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream().map(this::toItemDto).collect(Collectors.toList());
    }

    private AdminOrderItemDto toItemDto(OrderItem item) {
        Product product = item.getProduct();
        User vendor = product != null ? product.getVendor() : null;
        BigDecimal lineTotal = item.getPriceAtPurchase()
                .multiply(BigDecimal.valueOf(item.getQuantity()));

        return AdminOrderItemDto.builder()
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : "Unknown product")
                .vendorEmail(vendor != null ? vendor.getEmail() : null)
                .vendorName(vendor != null ? vendor.getName() : null)
                .quantity(item.getQuantity())
                .priceAtPurchase(item.getPriceAtPurchase())
                .lineTotal(lineTotal)
                .build();
    }

    private String formatShipping(Address address) {
        if (address == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        if (address.getFullName() != null) {
            sb.append(address.getFullName());
        }
        if (address.getLine1() != null) {
            if (sb.length() > 0) {
                sb.append(" · ");
            }
            sb.append(address.getLine1());
        }
        if (address.getCity() != null) {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(address.getCity());
        }
        if (address.getPostalCode() != null) {
            sb.append(" ").append(address.getPostalCode());
        }
        return sb.toString();
    }
}
