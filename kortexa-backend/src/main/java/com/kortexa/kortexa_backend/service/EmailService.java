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

    // Kafka consumer: triggered automatically when a new message arrives in 'order-emails' topic.
    // Uses ConsumerRecord to capture Kafka metadata (topic, partition, offset) for observability.
    @KafkaListener(topics = "order-emails", groupId = "kortexa-email-group")
    public void consumeOrderEventAndSendEmail(ConsumerRecord<String, String> record) {
        String messagePayload = record.value();

        log.info("[KAFKA CONSUMER] Received order event: topic={}, partition={}, offset={}, payload={}",
                record.topic(), record.partition(), record.offset(), messagePayload);

        try {
            // Unpack the pipe-delimited payload sent by OrderService
            String[] parts = messagePayload.split("\\|");
            if (parts.length < 3) {
                log.error("[KAFKA CONSUMER] Malformed payload - expected 3 parts but got {}: payload={}",
                        parts.length, messagePayload);
                return;
            }

            String toEmail = parts[0];
            Long orderId = Long.parseLong(parts[1]);
            String totalAmount = parts[2];

            log.info("[KAFKA CONSUMER] Processing order email: orderId={}, recipient={}, totalAmount={}",
                    orderId, toEmail, totalAmount);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Order Confirmation - Veluno #" + orderId);
            message.setText("Thank you for shopping with Veluno!\n\n" +
                    "Your order #" + orderId + " has been successfully processed.\n" +
                    "Total Amount: $" + totalAmount + "\n\n" +
                    "We will notify you as soon as your items ship!");

            mailSender.send(message);
            log.info("[KAFKA CONSUMER] Order confirmation email sent successfully: orderId={}, recipient={}",
                    orderId, toEmail);

        } catch (NumberFormatException e) {
            log.error("[KAFKA CONSUMER] Failed to parse orderId from payload [{}]. Partition={}, Offset={}, Error: {}",
                    messagePayload, record.partition(), record.offset(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("[KAFKA CONSUMER] Failed to send email for payload [{}]. Partition={}, Offset={}, Error: {}",
                    messagePayload, record.partition(), record.offset(), e.getMessage(), e);
        }
    }
}