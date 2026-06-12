package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.OrderRequestResolveDto;
import com.kortexa.kortexa_backend.dto.OrderRequestResponseDto;
import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import com.kortexa.kortexa_backend.repository.OrderRequestRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderRequestService {

    private final OrderRequestRepository orderRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional
    public OrderRequestResponseDto submitCancelRequest(Long orderId, String customerEmail, String reason) {
        Order order = loadCustomerOrder(orderId, customerEmail);
        if (order.getStatus() != OrderStatus.PAID) {
            throw new IllegalArgumentException("Cancellation is only allowed before the order ships (PAID status)");
        }
        return createRequest(order, customerEmail, OrderRequestType.CANCEL, reason);
    }

    @Transactional
    public OrderRequestResponseDto submitReturnRequest(Long orderId, String customerEmail, String reason) {
        Order order = loadCustomerOrder(orderId, customerEmail);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Returns are only allowed for delivered orders");
        }
        return createRequest(order, customerEmail, OrderRequestType.RETURN, reason);
    }

    public List<OrderRequestResponseDto> getCustomerRequests(String customerEmail) {
        return orderRequestRepository.findByCustomer_EmailOrderByCreatedAtDesc(customerEmail)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<OrderRequestResponseDto> getVendorPendingRequests(String vendorEmail) {
        return orderRequestRepository
                .findPendingForVendor(vendorEmail.trim().toLowerCase(), OrderRequestStatus.PENDING)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public Page<OrderRequestResponseDto> getAllRequests(int page, int size, String statusFilter) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        PageRequest pageable = PageRequest.of(page, safeSize);
        if (statusFilter != null && !statusFilter.isBlank()) {
            OrderRequestStatus status = OrderRequestStatus.valueOf(statusFilter.trim().toUpperCase());
            return orderRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::toDto);
        }
        return orderRequestRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional
    public OrderRequestResponseDto resolveByVendor(Long requestId, String vendorEmail, OrderRequestResolveDto dto) {
        OrderRequest request = orderRequestRepository.findWithDetailsById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        assertVendorOwnsRequest(request, vendorEmail);
        return resolve(request, vendorEmail, dto, false);
    }

    @Transactional
    public OrderRequestResponseDto resolveByAdmin(Long requestId, String adminEmail, OrderRequestResolveDto dto) {
        OrderRequest request = orderRequestRepository.findWithDetailsById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        return resolve(request, adminEmail, dto, true);
    }

    private OrderRequestResponseDto createRequest(Order order, String customerEmail,
                                                  OrderRequestType type, String reason) {
        if (orderRequestRepository.existsByOrderIdAndRequestTypeAndStatus(
                order.getId(), type, OrderRequestStatus.PENDING)) {
            throw new IllegalArgumentException("A pending " + type.name().toLowerCase() + " request already exists");
        }

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        OrderRequest saved = orderRequestRepository.save(OrderRequest.builder()
                .order(order)
                .customer(customer)
                .requestType(type)
                .reason(reason.trim())
                .build());

        activityService.log(
                type == OrderRequestType.CANCEL ? ActivityType.ORDER_STATUS_CHANGED : ActivityType.ORDER_STATUS_CHANGED,
                customerEmail,
                customer.getRole().name(),
                "Requested " + type.name().toLowerCase() + " for order #" + order.getId(),
                "ORDER",
                order.getId());

        log.info("Order {} request created: orderId={}, customer={}", type, order.getId(), customerEmail);
        return toDto(saved);
    }

    private OrderRequestResponseDto resolve(OrderRequest request, String resolverEmail,
                                            OrderRequestResolveDto dto, boolean isAdmin) {
        if (request.getStatus() != OrderRequestStatus.PENDING) {
            throw new IllegalArgumentException("This request has already been resolved");
        }

        Order order = request.getOrder();
        request.setResolvedByEmail(resolverEmail);
        request.setResolutionNote(dto.getNote());
        request.setResolvedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.getApproved())) {
            request.setStatus(OrderRequestStatus.APPROVED);
            if (request.getRequestType() == OrderRequestType.CANCEL) {
                order.setStatus(OrderStatus.CANCELLED);
            } else {
                order.setStatus(OrderStatus.RETURNED);
            }
            restockOrderItems(order);
            orderRepository.save(order);

            activityService.log(
                    ActivityType.ORDER_STATUS_CHANGED,
                    resolverEmail,
                    isAdmin ? "ADMIN" : "VENDOR",
                    (request.getRequestType() == OrderRequestType.CANCEL ? "Cancelled" : "Returned")
                            + " order #" + order.getId(),
                    "ORDER",
                    order.getId());

            String customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : null;
            notificationService.notifyUser(
                    customerEmail,
                    "Request approved",
                    "Your " + request.getRequestType().name().toLowerCase()
                            + " request for order #" + order.getId() + " was approved.",
                    "ORDER_REQUEST_APPROVED",
                    "ORDER",
                    order.getId());
        } else {
            request.setStatus(OrderRequestStatus.REJECTED);
            activityService.log(
                    ActivityType.ORDER_STATUS_CHANGED,
                    resolverEmail,
                    isAdmin ? "ADMIN" : "VENDOR",
                    "Rejected " + request.getRequestType().name().toLowerCase()
                            + " request for order #" + order.getId(),
                    "ORDER",
                    order.getId());

            String customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : null;
            notificationService.notifyUser(
                    customerEmail,
                    "Request rejected",
                    "Your " + request.getRequestType().name().toLowerCase()
                            + " request for order #" + order.getId() + " was rejected.",
                    "ORDER_REQUEST_REJECTED",
                    "ORDER",
                    order.getId());
        }

        return toDto(orderRequestRepository.save(request));
    }

    private void restockOrderItems(Order order) {
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() == null) {
                continue;
            }
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }
    }

    private Order loadCustomerOrder(Long orderId, String customerEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (order.getCustomer() == null
                || !customerEmail.equalsIgnoreCase(order.getCustomer().getEmail())) {
            throw new SecurityException("You cannot modify this order");
        }
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.RETURNED) {
            throw new IllegalArgumentException("This order is already closed");
        }
        return order;
    }

    private void assertVendorOwnsRequest(OrderRequest request, String vendorEmail) {
        String email = vendorEmail.trim().toLowerCase();
        boolean owns = request.getOrder().getItems().stream()
                .anyMatch(item -> item.getProduct() != null
                        && item.getProduct().getVendor() != null
                        && email.equalsIgnoreCase(item.getProduct().getVendor().getEmail()));
        if (!owns) {
            throw new SecurityException("You cannot resolve this request");
        }
    }

    private OrderRequestResponseDto toDto(OrderRequest request) {
        Order order = request.getOrder();
        return OrderRequestResponseDto.builder()
                .id(request.getId())
                .orderId(order != null ? order.getId() : null)
                .requestType(request.getRequestType())
                .status(request.getStatus())
                .reason(request.getReason())
                .resolutionNote(request.getResolutionNote())
                .resolvedByEmail(request.getResolvedByEmail())
                .customerEmail(request.getCustomer() != null ? request.getCustomer().getEmail() : null)
                .orderStatus(order != null ? order.getStatus() : null)
                .createdAt(request.getCreatedAt())
                .resolvedAt(request.getResolvedAt())
                .build();
    }
}
