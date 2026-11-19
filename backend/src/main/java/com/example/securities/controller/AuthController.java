package com.example.securities.controller;

import com.example.securities.dto.AuthResponse;
import com.example.securities.dto.LoginRequest;
import com.example.securities.dto.RegisterRequest;
import com.example.securities.repository.UserRepository;
import com.example.securities.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Не авторизован");
        }
        // principal.getName() вернет нам username из токена
        Map<String, Object> user = userRepository.findByUsername(principal.getName());

        if (user != null) {
            user.remove("password_hash"); // Никогда не отдаем хэш пароля наружу!
        }
        return ResponseEntity.ok(user);
    }
}
