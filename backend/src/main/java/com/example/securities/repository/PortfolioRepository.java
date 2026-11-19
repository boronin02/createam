package com.example.securities.repository;

import com.example.securities.dto.PortfolioItemDto;
import com.example.securities.dto.PortfolioSummaryDto;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
@AllArgsConstructor
public class PortfolioRepository {
    private final JdbcTemplate jdbcTemplate;

    public List<PortfolioItemDto> getPortfolioByAccount(Long accountId) {
        String sql = """
                SELECT id_account, account_number, id_security, ticker, security_name,
                       quantity, average_purchase_price, current_price, current_value, unrealized_pnl
                FROM v_portfolio_pnl
                WHERE id_account = ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new PortfolioItemDto(
                rs.getLong("id_account"),
                rs.getString("account_number"),
                rs.getLong("id_security"),
                rs.getString("ticker"),
                rs.getString("security_name"),
                rs.getLong("quantity"),
                rs.getBigDecimal("average_purchase_price"),
                rs.getBigDecimal("current_price"),
                rs.getBigDecimal("current_value"),
                rs.getBigDecimal("unrealized_pnl")
        ), accountId);
    }

    public PortfolioSummaryDto getPortfolioSummary(Long accountId) {
        String sql = "SELECT total_assets, total_value, total_pnl FROM v_portfolio_summary WHERE id_account = ?";
        List<PortfolioSummaryDto> list = jdbcTemplate.query(sql, (rs, rowNum) -> new PortfolioSummaryDto(
                rs.getLong("total_assets"),
                rs.getBigDecimal("total_value"),
                rs.getBigDecimal("total_pnl")
        ), accountId);

        // Если портфель пуст (нет ни одной бумаги), возвращаем нули
        return list.isEmpty() ? new PortfolioSummaryDto(0L, BigDecimal.ZERO, BigDecimal.ZERO) : list.get(0);
    }
}
