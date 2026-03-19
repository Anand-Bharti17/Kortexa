package com.kortexa.kortexa_backend.model;

public enum AccountStatus {
    PENDING_APPROVAL, // For new vendors
    ACTIVE,           // For customers and approved vendors
    SUSPENDED         // If a vendor violates terms
}