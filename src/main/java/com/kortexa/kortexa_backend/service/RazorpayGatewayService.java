package com.kortexa.kortexa_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kortexa.kortexa_backend.dto.RazorpayOrderResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class RazorpayGatewayService {

    @Value("${razorpay.key-id:rzp_test_1DP5mmOlF5G5ag}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public RazorpayOrderResponse createOrder(Long amountInPaise, String currency) {
        if (amountInPaise == null || amountInPaise <= 0) {
            throw new IllegalArgumentException("Invalid amount for Razorpay order");
        }

        if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            log.warn("Razorpay secret key is not configured, returning a fallback order response without order_id");
            return new RazorpayOrderResponse(razorpayKeyId, null, amountInPaise, currency);
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("amount", amountInPaise);
            requestBody.put("currency", currency);
            requestBody.put("receipt", "order_rcptid_" + System.currentTimeMillis());
            requestBody.put("payment_capture", 1);

            String body = objectMapper.writeValueAsString(requestBody);
            String credentials = razorpayKeyId + ":" + razorpayKeySecret;
            String basicAuth = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Basic " + basicAuth)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200 && response.statusCode() != 201) {
                log.error("Razorpay order creation failed: status={} body={}", response.statusCode(), response.body());
                throw new RuntimeException("Razorpay order creation failed");
            }

            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            String orderId = (String) responseMap.get("id");
            log.info("Razorpay order created: orderId={} amount={} currency={}", orderId, amountInPaise, currency);
            return new RazorpayOrderResponse(razorpayKeyId, orderId, amountInPaise, currency);
        } catch (Exception e) {
            log.error("Unable to create Razorpay order", e);
            throw new RuntimeException("Unable to create Razorpay order", e);
        }
    }

    public boolean verifySignature(String razorpayPaymentId, String razorpayOrderId, String razorpaySignature) {
        if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            log.warn("Razorpay key secret not configured; skipping signature verification");
            return true;
        }

        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : hashBytes) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString().equals(razorpaySignature);
        } catch (Exception e) {
            log.error("Unable to verify Razorpay signature", e);
            return false;
        }
    }
}
