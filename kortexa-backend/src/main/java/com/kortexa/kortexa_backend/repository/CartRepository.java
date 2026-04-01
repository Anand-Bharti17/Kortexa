package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    // Find the exact cart belonging to the logged-in customer
    Optional<Cart> findByUserEmail(String email);
}