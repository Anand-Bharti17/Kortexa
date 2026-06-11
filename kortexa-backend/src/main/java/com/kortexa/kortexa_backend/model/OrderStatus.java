package com.kortexa.kortexa_backend.model;

public enum OrderStatus {
    PENDING,    // Order placed, waiting for payment
    PAID,       // Payment successful, waiting for vendor to ship
    SHIPPED,    // Vendor has shipped the item
    DELIVERED,  // Customer received it
    CANCELLED,  // Order was cancelled
    RETURNED    // Return approved and completed
}