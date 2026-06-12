package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ProductDetailDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal mrp;
    private Integer stockQuantity;
    private String category;
    private String imageUrl;
    private Boolean featured;
    private String vendorEmail;
    private Double averageRating;
    private Integer reviewCount;
    private Double vendorAverageRating;
    private Integer vendorReviewCount;
    private List<String> galleryImages;
    private List<ProductVariantDto> variants;

    public static ProductDetailDto from(Product product) {
        return ProductDetailDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .mrp(product.getMrp())
                .stockQuantity(product.getStockQuantity())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .featured(product.getFeatured())
                .vendorEmail(product.getVendorEmailForJson())
                .averageRating(product.getAverageRating())
                .reviewCount(product.getReviewCount())
                .build();
    }
}
