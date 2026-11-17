package com.example.securities.service;

import com.example.securities.dto.AuthResponse;
import com.example.securities.dto.LoginRequest;
import com.example.securities.dto.RegisterRequest;
import com.example.securities.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new RuntimeException("Пользователь с таким логином уже существует");
        }

        // Хэшируем пароль перед сохранением
        String passwordHash = passwordEncoder.encode(request.getPassword());
        userRepository.createUser(request, passwordHash);

        String jwtToken = jwtService.generateToken(request.getUsername());
        return new AuthResponse(jwtToken);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // Генерируем токен
        String jwtToken = jwtService.generateToken(request.getUsername());
        return new AuthResponse(jwtToken);
    }
}
