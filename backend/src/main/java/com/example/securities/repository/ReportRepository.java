package com.example.securities.repository;

import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@AllArgsConstructor
public class ReportRepository {
    private final JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> getOperationHistory(String username) {
        String sql = """
                SELECT v.* FROM v_operation_history v
                JOIN account a ON v.account_number = a.account_number
                JOIN participants p ON a.id_investor = p.id_investor
                WHERE p.username = ?
                ORDER BY v.operation_date DESC
                """;
        return jdbcTemplate.queryForList(sql, username);
    }

    public List<Map<String, Object>> getIncomeSummary(String username) {
        String sql = """
                SELECT v.* FROM v_income_summary v
                JOIN account a ON v.account_number = a.account_number
                JOIN participants p ON a.id_investor = p.id_investor
                WHERE p.username = ?
                ORDER BY v.payment_date DESC
                """;
        return jdbcTemplate.queryForList(sql, username);
    }

    public List<Map<String, Object>> getMarketDataFreshness() {
        // Тут нет приватных данных, это публичная инфа по бумагам. Оставляем как есть.
        return jdbcTemplate.queryForList("SELECT * FROM v_market_data_freshness");
    }

    public List<Map<String, Object>> getCommissionsByDay(String username) {
        String sql = """
                SELECT v.* FROM v_commissions_by_day v
                JOIN account a ON v.account_number = a.account_number
                JOIN participants p ON a.id_investor = p.id_investor
                WHERE p.username = ?
                ORDER BY v.day DESC
                """;
        return jdbcTemplate.queryForList(sql, username);
    }
}
