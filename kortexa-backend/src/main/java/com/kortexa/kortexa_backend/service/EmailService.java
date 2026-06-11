package com.kortexa.kortexa_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
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

    @KafkaListener(topics = "order-emails", groupId = "kortexa-email-group")
    public void consumeOrderEventAndSendEmail(ConsumerRecord<String, String> record) {
        String messagePayload = record.value();

        log.info("[KAFKA CONSUMER] Received order event: topic={}, partition={}, offset={}, payload={}",
                record.topic(), record.partition(), record.offset(), messagePayload);

        try {
            String[] parts = messagePayload.split("\\|");
            if (parts.length < 3) {
                log.error("[KAFKA CONSUMER] Malformed payload - expected 3 parts but got {}: payload={}",
                        parts.length, messagePayload);
                return;
            }

            String toEmail = parts[0];
            Long orderId = Long.parseLong(parts[1]);
            String totalAmount = parts[2];

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Order Confirmation - Veluno #" + orderId);
            message.setText("Thank you for shopping with Veluno!\n\n" +
                    "Your order #" + orderId + " has been successfully processed.\n" +
                    "Total Amount: ₹" + totalAmount + "\n\n" +
                    "We will notify you as soon as your items ship!");

            mailSender.send(message);
            log.info("[KAFKA CONSUMER] Order confirmation email sent: orderId={}, recipient={}",
                    orderId, toEmail);

        } catch (NumberFormatException e) {
            log.error("[KAFKA CONSUMER] Failed to parse orderId from payload [{}]: {}",
                    messagePayload, e.getMessage(), e);
        } catch (Exception e) {
            log.error("[KAFKA CONSUMER] Failed to send email for payload [{}]: {}",
                    messagePayload, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "order-status-emails", groupId = "kortexa-email-group")
    public void consumeOrderStatusEventAndSendEmail(ConsumerRecord<String, String> record) {
        String messagePayload = record.value();

        log.info("[KAFKA CONSUMER] Received order status event: payload={}", messagePayload);

        try {
            String[] parts = messagePayload.split("\\|");
            if (parts.length < 4) {
                log.error("[KAFKA CONSUMER] Malformed status payload: {}", messagePayload);
                return;
            }

            String toEmail = parts[0];
            Long orderId = Long.parseLong(parts[1]);
            String status = parts[2];
            String totalAmount = parts[3];

            String statusMessage = switch (status) {
                case "SHIPPED" -> "Great news! Your order #" + orderId + " has been shipped and is on its way.";
                case "DELIVERED" -> "Your order #" + orderId + " has been delivered. We hope you enjoy your purchase!";
                default -> "Your order #" + orderId + " status has been updated to " + status + ".";
            };

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Order Update - Veluno #" + orderId);
            message.setText(statusMessage + "\n\nOrder total: ₹" + totalAmount + "\n\nThank you for shopping with Veluno!");

            mailSender.send(message);
            log.info("[KAFKA CONSUMER] Order status email sent: orderId={}, status={}, recipient={}",
                    orderId, status, toEmail);

        } catch (Exception e) {
            log.error("[KAFKA CONSUMER] Failed to send status email for payload [{}]: {}",
                    messagePayload, e.getMessage(), e);
        }
    }
}
