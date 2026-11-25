package com.example.securities.controller;

import com.example.securities.dto.OperationRequestDto;
import com.example.securities.repository.AccountRepository;
import com.example.securities.repository.OperationRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            return ResponseEntity.badRequest().body("Ошибка при создании операции");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateOperation(
            @PathVariable Long id,
            @RequestBody OperationRequestDto request,
            Principal principal) {
        String username = principal.getName();

        if (!operationRepository.isOperationOwnedByUser(id, username) ||
                !accountRepository.isAccountOwnedByUser(request.getIdAccount(), username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Доступ запрещен");
        }

        try {
            operationRepository.updateOperation(id, request);
            return ResponseEntity.ok("Операция обновлена, портфель пересчитан");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка при обновлении операции: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteOperation(@PathVariable Long id, Principal principal) {
        if (!operationRepository.isOperationOwnedByUser(id, principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Доступ запрещен");
        }

        try {
            operationRepository.deleteOperation(id);
            return ResponseEntity.ok("Операция удалена, портфель пересчитан");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Невозможно удалить операцию: " + e.getMessage());
        }
    }
}