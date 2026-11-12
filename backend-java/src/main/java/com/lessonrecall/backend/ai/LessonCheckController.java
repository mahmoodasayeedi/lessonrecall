package com.lessonrecall.backend.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/lesson-check")
public class LessonCheckController {

    public record CheckRequest(@NotBlank String url) {}

    private final AiClient ai;

    public LessonCheckController(AiClient ai) {
        this.ai = ai;
    }

    @PostMapping
    public Map<String, Object> check(@Valid @RequestBody CheckRequest request) {
        try {
            return ai.lessonCheck(request.url());
        } catch (RestClientResponseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "This video can't be checked: it has no captions, is private, or the link is not a YouTube video.");
        }
    }
}