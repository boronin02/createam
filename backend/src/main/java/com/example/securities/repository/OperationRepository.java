package com.example.securities.repository;

import com.example.securities.dto.OperationRequestDto;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
@AllArgsConstructor
public class OperationRepository {
    private final JdbcTemplate jdbcTemplate;

    public void createOperation(OperationRequestDto request) {
        // Считаем общую сумму сделки (цена * количество)
        BigDecimal totalAmount = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        String sql = """
                INSERT INTO operation_register 
                (id_account, id_security, id_operation_type, quantity, price, total_amount, commission)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(sql,
                request.getIdAccount(),
                request.getIdSecurity(),
                request.getIdOperationType(),
                request.getQuantity(),
                request.getPrice(),
                totalAmount,
                request.getCommission()
        );
    }
}