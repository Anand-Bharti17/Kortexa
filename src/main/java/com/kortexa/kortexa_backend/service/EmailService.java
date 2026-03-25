package com.kortexa.kortexa_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener; // NEW IMPORT
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    // This annotation tells Spring to listen to Kafka and trigger this method automatically
    @KafkaListener(topics = "order-emails", groupId = "kortexa-email-group")
    public void consumeOrderEventAndSendEmail(String messagePayload) {
        log.info("Kafka Consumer picked up new message: {}", messagePayload);

        try {
            // Unpack the string payload sent by OrderService
            String[] parts = messagePayload.split("\\|");
            String toEmail = parts[0];
            Long orderId = Long.parseLong(parts[1]); // Convert back to Long
            String totalAmount = parts[2];

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Order Confirmation - Kortexa #" + orderId);
            message.setText("Thank you for shopping with Kortexa!\n\n" +
                    "Your order #" + orderId + " has been successfully processed.\n" +
                    "Total Amount: $" + totalAmount + "\n\n" +
                    "We will notify you as soon as your items ship!");

            mailSender.send(message);
            log.info("Order confirmation email sent successfully in background to: {}, orderId={}", toEmail, orderId);

        } catch (Exception e) {
            log.error("Failed to process Kafka message or send email for payload [{}]. Error: {}", messagePayload, e.getMessage(), e);
        }
    }
}