package com.lessonrecall.backend.material;

import com.lessonrecall.backend.ai.AiDtos;
import com.lessonrecall.backend.material.MaterialService.MaterialResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/materials")
public class MaterialController {

    public record YoutubeRequest(@NotBlank String url, String language) {}

    private final MaterialService service;

    public MaterialController(MaterialService service) {
        this.service = service;
    }

    @PostMapping("/youtube")
    public MaterialResponse addYoutube(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                       @Valid @RequestBody YoutubeRequest request) {
        return service.addYoutube(Long.valueOf(jwt.getSubject()), courseId, request.url(), request.language());
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MaterialResponse upload(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                   @RequestParam("file") MultipartFile file) {
        return service.upload(Long.valueOf(jwt.getSubject()), courseId, file);
    }

    @GetMapping
    public List<MaterialResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        return service.list(Long.valueOf(jwt.getSubject()), courseId);
    }

    @GetMapping("/{materialId}/summary")
    public AiDtos.SummaryResponse summary(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                          @PathVariable Long materialId) {
        return service.summary(Long.valueOf(jwt.getSubject()), courseId, materialId);
    }
    @GetMapping("/{materialId}/transcript")
    public AiDtos.TranscriptResponse transcript(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                                @PathVariable Long materialId) {
        return service.transcript(Long.valueOf(jwt.getSubject()), courseId, materialId);
    }
    @GetMapping("/{materialId}/quiz")
    public AiDtos.QuizResponse quiz(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                    @PathVariable Long materialId, @RequestParam(defaultValue = "5") int count) {
        return service.quiz(Long.valueOf(jwt.getSubject()), courseId, materialId, count);
    }
    @DeleteMapping("/{materialId}")
    public ResponseEntity<Void> delete(@PathVariable Long courseId, @PathVariable Long materialId,
                                       @AuthenticationPrincipal Jwt jwt) {
        service.delete(courseId, materialId, Long.parseLong(jwt.getSubject()));
        return ResponseEntity.noContent().build();
    }

}