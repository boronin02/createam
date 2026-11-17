package com.example.securities.security;

import com.example.securities.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Map<String, Object> userMap = userRepository.findByUsername(username);

        if (userMap == null) {
            throw new UsernameNotFoundException("Пользователь не найден: " + username);
        }

        // В базе поле называется password_hash, Spring Security ждет password
        String passwordHash = (String) userMap.get("password_hash");

        return new User(
                username,
                passwordHash,
                Collections.emptyList()
        );
    }
}
