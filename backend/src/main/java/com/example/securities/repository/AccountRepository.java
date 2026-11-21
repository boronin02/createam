package com.example.securities.repository;

import com.example.securities.dto.AccountDto;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@AllArgsConstructor
public class AccountRepository {
    private final JdbcTemplate jdbcTemplate;

    public List<AccountDto> findAccountsByUsername(String username) {
        String sql = """
                SELECT a.id_account, a.account_number, a.name, c.code
                FROM account a
                JOIN participants p ON p.id_investor = a.id_investor
                JOIN currency_directory c ON c.id_currency = a.id_currency
                WHERE p.username = ?
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new AccountDto(
                rs.getLong("id_account"),
                rs.getString("account_number"),
                rs.getString("name"),
                rs.getString("code")
        ), username);
    }

    // Проверяет, есть ли у пользователя такой счет
    public boolean isAccountOwnedByUser(Long accountId, String username) {
        String sql = """
                SELECT COUNT(*) 
                FROM account a
                JOIN participants p ON p.id_investor = a.id_investor
                WHERE a.id_account = ? AND p.username = ?
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, accountId, username);
        return count != null && count > 0;
    }
}
