package com.lessonrecall.backend.course;

import com.lessonrecall.backend.course.CourseDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());   // the token's "sub" = user id
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateCourseRequest request) {
        return service.create(userId(jwt), request);
    }

    @GetMapping("/mine")
    public List<CourseResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.mine(userId(jwt));
    }

    @GetMapping("/catalog")
    public List<CourseResponse> catalog(@AuthenticationPrincipal Jwt jwt) {
        return service.catalog(userId(jwt));
    }

    @PostMapping("/{id}/join")
    public CourseResponse join(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.join(userId(jwt), id);
    }

    @GetMapping("/{id}")
    public CourseResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.get(userId(jwt), id);
    }
}