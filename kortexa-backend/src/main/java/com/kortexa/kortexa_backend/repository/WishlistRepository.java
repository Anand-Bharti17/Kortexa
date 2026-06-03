package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    @Query("SELECT w FROM WishlistItem w JOIN FETCH w.product p JOIN w.user u WHERE u.email = :email ORDER BY w.createdAt DESC")
    List<WishlistItem> findByUserEmailOrderByCreatedAtDesc(@Param("email") String email);

    @Query("SELECT COUNT(w) > 0 FROM WishlistItem w WHERE w.user.email = :email AND w.product.id = :productId")
    boolean existsByUserEmailAndProductId(@Param("email") String email, @Param("productId") Long productId);

    @Modifying
    @Query("DELETE FROM WishlistItem w WHERE w.user.email = :email AND w.product.id = :productId")
    void deleteByUserEmailAndProductId(@Param("email") String email, @Param("productId") Long productId);
}
