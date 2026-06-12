package com.kortexa.kortexa_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payout_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private User vendor;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PayoutRequestStatus status = PayoutRequestStatus.PENDING;

    @Column(name = "payment_note")
    private String paymentNote;

    @Column(name = "resolution_note")
    private String resolutionNote;

    @Column(name = "resolved_by_email")
    private String resolvedByEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
