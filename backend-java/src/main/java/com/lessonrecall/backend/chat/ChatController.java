package com.lessonrecall.backend.chat;

import com.lessonrecall.backend.chat.ChatService.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ChatController {

    public record SendRequest(@NotBlank String message, String videoId) {}

    private final ChatService service;

    public ChatController(ChatService service) {
        this.service = service;
    }

    private Long userId(Jwt jwt) { return Long.valueOf(jwt.getSubject()); }

    @PostMapping("/courses/{courseId}/chats")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse start(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        return service.start(userId(jwt), courseId);
    }

    @GetMapping("/courses/{courseId}/chats")
    public List<SessionResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        return service.list(userId(jwt), courseId);
    }

    @PostMapping("/chats/{sessionId}/messages")
    public ChatReply send(@AuthenticationPrincipal Jwt jwt, @PathVariable Long sessionId,
                          @Valid @RequestBody SendRequest request) {
        return service.send(userId(jwt), sessionId, request.message(), request.videoId());
    }

    @GetMapping("/chats/{sessionId}/messages")
    public List<MessageResponse> history(@AuthenticationPrincipal Jwt jwt, @PathVariable Long sessionId) {
        return service.history(userId(jwt), sessionId);
    }
}