package com.example.securities.repository;

import com.example.securities.dto.RegisterRequest;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@AllArgsConstructor
public class UserRepository {
    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> findByUsername(String username) {
        String sql = "SELECT * FROM participants WHERE username = ?";
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, username);
        return users.isEmpty() ? null : users.get(0);
    }

    public void createUser(RegisterRequest request, String passwordHash) {
        String sql = """
                INSERT INTO participants (username, password_hash, email, first_name, last_name)
                VALUES (?, ?, ?, ?, ?)
                """;
        jdbcTemplate.update(sql,
                request.getUsername(),
                passwordHash,
                request.getEmail(),
                request.getFirstName(),
                request.getLastName()
        );
    }
}
