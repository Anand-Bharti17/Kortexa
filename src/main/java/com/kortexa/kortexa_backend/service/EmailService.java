package com.kortexa.kortexa_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOrderConfirmation(String toEmail, Long orderId, String totalAmount) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Order Confirmation - Kortexa #" + orderId);
        message.setText("Thank you for shopping with Kortexa!\n\n" +
                "Your order #" + orderId + " has been successfully processed.\n" +
                "Total Amount: $" + totalAmount + "\n\n" +
                "We will notify you as soon as your items ship!");

        mailSender.send(message);
    }
}