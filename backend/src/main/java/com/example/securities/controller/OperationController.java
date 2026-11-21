package com.example.securities.controller;

import com.example.securities.dto.OperationRequestDto;
import com.example.securities.repository.AccountRepository;
import com.example.securities.repository.OperationRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/operations")
@AllArgsConstructor
public class OperationController {
    private final OperationRepository operationRepository;
    private final AccountRepository accountRepository;

    @PostMapping
    public ResponseEntity<String> createOperation(@RequestBody OperationRequestDto request, Principal principal) {
        // Проверка владельца счета
        if (!accountRepository.isAccountOwnedByUser(request.getIdAccount(), principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Доступ запрещен: вы не владелец этого счета");
        }

        try {
            operationRepository.createOperation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("Операция успешно добавлена, портфель обновлен триггером!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка при создании операции: " + e.getMessage());
        }
    }
}
