package com.lessonrecall.backend.ai;

import com.lessonrecall.backend.ai.AiDtos.AskResponse;
import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.course.CourseService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/{courseId}")
public class AskController {

    public record QuestionRequest(@NotBlank String question, String videoId) {}

    private final CourseService courses;
    private final AiClient ai;

    public AskController(CourseService courses, AiClient ai) {
        this.courses = courses;
        this.ai = ai;
    }

    @PostMapping("/ask")
    public AskResponse ask(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                           @Valid @RequestBody QuestionRequest request) {
        Course course = courses.requireAccess(Long.valueOf(jwt.getSubject()), courseId);   // owner or enrolled
        return ai.ask(request.question(), course.getSlug(), request.videoId());
    }
}