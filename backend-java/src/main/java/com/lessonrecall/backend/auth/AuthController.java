package com.lessonrecall.backend.auth;

import com.lessonrecall.backend.auth.AuthDtos.*;
import com.lessonrecall.backend.user.User;
import com.lessonrecall.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        users.save(user);
        return toResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user = users.findByEmail(request.email().trim().toLowerCase())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong email or password"));
        return toResponse(user);
    }

    // Who am I? Proves the token works.
    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
                "userId", jwt.getSubject(),
                "name", jwt.getClaimAsString("name"),
                "email", jwt.getClaimAsString("email"),
                "role", jwt.getClaimAsString("role"));
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(tokenService.createToken(user), user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody ChangePasswordRequest req) {
        User user = users.findById(Long.parseLong(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is wrong");
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(user);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/language")
    public LanguageResponse getLanguage(@AuthenticationPrincipal Jwt jwt) {
        User user = users.findById(Long.parseLong(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return new LanguageResponse(user.getAnswerLanguage());
    }

    @PutMapping("/language")
    public LanguageResponse setLanguage(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody LanguageRequest req) {
        User user = users.findById(Long.parseLong(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String lang = (req.language() == null || req.language().isBlank()) ? null : req.language();
        user.setAnswerLanguage(lang);
        users.save(user);
        return new LanguageResponse(lang);
    }
}