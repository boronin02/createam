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

    public List<Map<String, Object>> getOperationHistory() {
        return jdbcTemplate.queryForList("SELECT * FROM v_operation_history ORDER BY operation_date DESC");
    }

    public List<Map<String, Object>> getIncomeSummary() {
        return jdbcTemplate.queryForList("SELECT * FROM v_income_summary ORDER BY payment_date DESC");
    }

    public List<Map<String, Object>> getMarketDataFreshness() {
        return jdbcTemplate.queryForList("SELECT * FROM v_market_data_freshness");
    }

    public List<Map<String, Object>> getCommissionsByDay() {
        return jdbcTemplate.queryForList("SELECT * FROM v_commissions_by_day ORDER BY day DESC");
    }
}
