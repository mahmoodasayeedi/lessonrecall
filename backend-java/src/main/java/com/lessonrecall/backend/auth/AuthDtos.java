package com.lessonrecall.backend.auth;

import com.lessonrecall.backend.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    public record LanguageRequest(@Size(max = 30) String language) {}
    public record LanguageResponse(String language) {}
    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String password,
            @NotNull Role role) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record AuthResponse(String token, Long userId, String name, String email, Role role) {}

    private AuthDtos() {}
    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, message = "New password must have at least 8 characters") String newPassword) {}
}