package com.kortexa.kortexa_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.io.Serializable;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product implements Serializable{

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NEW: Link the product to the vendor who sells it
    @ManyToOne(fetch = FetchType.EAGER) // Changed to EAGER to avoid lazy loading issues
    @JoinColumn(name = "vendor_id", nullable = false)
    @JsonIgnore // Prevent Jackson from trying to serialize lazy-loaded vendor
    private User vendor;

    @Transient
    private String vendorEmail;

    @NotBlank(message = "Product name is required")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @PositiveOrZero(message = "Price cannot be negative")
    @Column(nullable = false)
    private BigDecimal price;

    @PositiveOrZero(message = "Stock quantity cannot be negative")
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    private String category;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Formula("(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = id)")
    private Double averageRating;

    @Formula("(SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = id)")
    private Integer reviewCount;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @com.fasterxml.jackson.annotation.JsonGetter("vendorEmail")
    public String getVendorEmailForJson() {
        return vendor != null ? vendor.getEmail() : null;
    }
}