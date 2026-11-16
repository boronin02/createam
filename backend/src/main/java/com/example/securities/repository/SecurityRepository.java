package com.example.securities.repository;

import com.example.securities.dto.SecurityDto;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@AllArgsConstructor
public class SecurityRepository {
    private final JdbcTemplate jdbcTemplate;

    public List<SecurityDto> getAllSecurities() {
        String sql = """
                SELECT id_security, ticker, isin, name, current_price, type_name, issuer_name, currency_code
                FROM v_securities_detailed
                ORDER BY ticker
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SecurityDto(
                rs.getLong("id_security"),
                rs.getString("ticker"),
                rs.getString("isin"),
                rs.getString("name"),
                rs.getBigDecimal("current_price"),
                rs.getString("type_name"),
                rs.getString("issuer_name"),
                rs.getString("currency_code")
        ));
    }
}
