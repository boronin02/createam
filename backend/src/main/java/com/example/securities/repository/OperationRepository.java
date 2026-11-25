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

    // Проверка, принадлежит ли операция счёту текущего пользователя
    public boolean isOperationOwnedByUser(Long idOperation, String username) {
        String sql = """
            SELECT COUNT(*) FROM operation_register op
            JOIN account a ON a.id_account = op.id_account
            JOIN participants p ON p.id_investor = a.id_investor
            WHERE op.id_operation = ? AND p.username = ?
            """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, idOperation, username);
        return count != null && count > 0;
    }

    public void updateOperation(Long idOperation, OperationRequestDto request) {
        BigDecimal totalAmount = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        String sql = """
            UPDATE operation_register
            SET id_account = ?,
                id_security = ?,
                id_operation_type = ?,
                quantity = ?,
                price = ?,
                total_amount = ?,
                commission = ?
            WHERE id_operation = ?
            """;

        jdbcTemplate.update(sql,
                request.getIdAccount(),
                request.getIdSecurity(),
                request.getIdOperationType(),
                request.getQuantity(),
                request.getPrice(),
                totalAmount,
                request.getCommission(),
                idOperation
        );
    }

    public void deleteOperation(Long idOperation) {
        jdbcTemplate.update("DELETE FROM operation_register WHERE id_operation = ?", idOperation);
    }
}