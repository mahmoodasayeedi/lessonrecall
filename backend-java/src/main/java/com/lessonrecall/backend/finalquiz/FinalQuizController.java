package com.lessonrecall.backend.finalquiz;

import com.lessonrecall.backend.finalquiz.FinalQuizDtos.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/final-quiz")
public class FinalQuizController {

    private final FinalQuizService service;

    public FinalQuizController(FinalQuizService service) { this.service = service; }

    private Long uid(Jwt jwt) { return Long.valueOf(jwt.getSubject()); }

    @GetMapping
    public QuizView get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        return service.get(uid(jwt), courseId);
    }

    @PostMapping("/generate")
    public QuizView generate(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                             @RequestParam(defaultValue = "10") int count) {
        return service.generate(uid(jwt), courseId, Math.max(3, Math.min(count, 20)));
    }

    @DeleteMapping("/questions/{questionId}")
    public QuizView removeQuestion(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                   @PathVariable Long questionId) {
        return service.removeQuestion(uid(jwt), courseId, questionId);
    }

    @PostMapping("/publish")
    public QuizView publish(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                            @Valid @RequestBody PublishRequest req) {
        return service.publish(uid(jwt), courseId, req.passMark());
    }

    @PostMapping("/attempt")
    public QuizView submit(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                           @Valid @RequestBody SubmitRequest req) {
        return service.submit(uid(jwt), courseId, req.answers());
    }

    @GetMapping("/results")
    public List<ResultRow> results(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        return service.results(uid(jwt), courseId);
    }
}