package com.example.securities.repository;

import com.example.securities.dto.SecurityDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@AllArgsConstructor
public class SecurityRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<SecurityDto> getAllSecurities() {
        String sql = """
        SELECT id_security, ticker, isin, name, current_price, daily_change_rub, daily_change_percent, type_name, issuer_name, currency_code
        FROM v_securities_detailed
        ORDER BY ticker
        """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapToSecurityDto(rs));
    }

    public List<Map<String, Object>> findAllSecuritiesForSync() {
        return jdbcTemplate.queryForList(
            "SELECT id_security, ticker FROM securities"
        );
    }

    public void upsertSecurityFromMoex(
        String ticker,
        String shortName,
        String isin,
        BigDecimal price,
        BigDecimal prevPrice,
        Integer idType
    ) {
        String cleanTicker = ticker.trim();
        Long issuerId = getOrCreateIssuer(shortName.trim());

        String sql = """
        INSERT INTO securities
        (id_issuer, id_type, id_currency, ticker, isin, name, current_price, prev_close_price, updated_at, session_status)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, now(), 'OPEN')
        ON CONFLICT (ticker, id_currency)
        DO UPDATE SET
            current_price = EXCLUDED.current_price,
            prev_close_price = EXCLUDED.prev_close_price,
            updated_at = EXCLUDED.updated_at,
            id_type = EXCLUDED.id_type
        """;

        jdbcTemplate.update(
            sql,
            issuerId,
            idType,
            cleanTicker,
            isin,
            shortName,
            price,
            prevPrice
        );
    }

    private Long getOrCreateIssuer(String issuerName) {
        String checkSql = "SELECT id_issuer FROM issuers WHERE name = ?";
        List<Long> ids = jdbcTemplate.queryForList(
            checkSql,
            Long.class,
            issuerName
        );

        if (!ids.isEmpty()) {
            return ids.get(0);
        }

        // Генерируем случайный 10-значный ИНН
        String randomInn = String.valueOf(
            (long) (Math.random() * 9_000_000_000L) + 1_000_000_000L
        );

        String insertSql =
            "INSERT INTO issuers (name, inn) VALUES (?, ?) RETURNING id_issuer";
        return jdbcTemplate.queryForObject(
            insertSql,
            Long.class,
            issuerName,
            randomInn
        );
    }

    public SecurityDto getSecurityByTicker(String ticker) {
        String sql = """
        SELECT id_security, ticker, isin, name, current_price, daily_change_rub, daily_change_percent, type_name, issuer_name, currency_code
        FROM v_securities_detailed
        WHERE ticker = ?
        """;
        List<SecurityDto> list = jdbcTemplate.query(
            sql,
            (rs, rowNum) -> mapToSecurityDto(rs),
            ticker
        );
        return list.isEmpty() ? null : list.get(0);
    }

    // Вспомогательный метод для маппинга
    private SecurityDto mapToSecurityDto(
        java.sql.ResultSet rs
    ) throws java.sql.SQLException {
        return new SecurityDto(
            rs.getLong("id_security"),
            rs.getString("ticker"),
            rs.getString("isin"),
            rs.getString("name"),
            rs.getBigDecimal("current_price"),
            rs.getBigDecimal("daily_change_rub"),
            rs.getBigDecimal("daily_change_percent"),
            rs.getString("type_name"),
            rs.getString("issuer_name"),
            rs.getString("currency_code")
        );
    }

    public Integer getSecurityTypeId(String ticker) {
        String sql = "SELECT id_type FROM securities WHERE ticker = ? LIMIT 1";
        List<Integer> types = jdbcTemplate.queryForList(
            sql,
            Integer.class,
            ticker
        );
        return types.isEmpty() ? 1 : types.get(0);
    }
}
