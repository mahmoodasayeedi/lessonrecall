package com.lessonrecall.backend.material;

import com.lessonrecall.backend.ai.AiClient;
import com.lessonrecall.backend.ai.AiDtos;
import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.course.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class MaterialService {

    public record MaterialResponse(Long id, MaterialType type, String title, String sourceUrl,
                                   MaterialStatus status, String errorMessage, Integer chunkCount,
                                   String externalId, Integer durationSeconds) {}

    private final MaterialRepository materials;
    private final CourseService courses;
    private final AiClient ai;

    public MaterialService(MaterialRepository materials, CourseService courses, AiClient ai) {
        this.materials = materials;
        this.courses = courses;
        this.ai = ai;
    }

    // ---------- Add materials (owner only) ----------

    public MaterialResponse addYoutube(Long userId, Long courseId, String url, String language) {
        Course course = courses.requireOwner(userId, courseId);
        Material m = start(course, MaterialType.YOUTUBE, url, url);
        try {
            var result = ai.ingestYoutube(url, course.getSlug(), language);
            return finish(m, result.videoId(), result.title(), result.storedChunks(), result.durationSeconds());
        } catch (RuntimeException e) {
            return fail(m, e);
        }
    }

    public MaterialResponse upload(Long userId, Long courseId, MultipartFile file) {
        Course course = courses.requireOwner(userId, courseId);
        String name = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        boolean isPdf = name.toLowerCase().endsWith(".pdf");
        Material m = start(course, isPdf ? MaterialType.PDF : MaterialType.UPLOAD, name, null);
        try {
            if (isPdf) {
                var result = ai.ingestPdf(file, course.getSlug());
                return finish(m, result.documentId(), result.title(), result.storedChunks(), null);
            }
            var result = ai.ingestUpload(file, course.getSlug());
            return finish(m, result.videoId(), result.title(), result.storedChunks(), result.durationSeconds());
        } catch (RuntimeException e) {
            return fail(m, e);
        }
    }

    // ---------- Read (owner or enrolled) ----------

    public List<MaterialResponse> list(Long userId, Long courseId) {
        courses.requireAccess(userId, courseId);
        return materials.findByCourseIdOrderByCreatedAtAsc(courseId).stream().map(this::toResponse).toList();
    }

    public AiDtos.SummaryResponse summary(Long userId, Long courseId, Long materialId) {
        Course course = courses.requireAccess(userId, courseId);
        Material m = materials.findByIdAndCourseId(materialId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
        if (m.getStatus() != MaterialStatus.READY || m.getType() == MaterialType.PDF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Summaries are available for ready videos only");
        }
        return ai.summary(course.getSlug(), m.getExternalId());
    }
    public AiDtos.TranscriptResponse transcript(Long userId, Long courseId, Long materialId) {
        Course course = courses.requireAccess(userId, courseId);
        Material m = materials.findByIdAndCourseId(materialId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
        if (m.getStatus() != MaterialStatus.READY || m.getType() == MaterialType.PDF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transcripts are available for ready videos only");
        }
        return ai.transcript(course.getSlug(), m.getExternalId());
    }
    // ---------- Helpers ----------

    private Material start(Course course, MaterialType type, String title, String sourceUrl) {
        Material m = new Material();
        m.setCourse(course);
        m.setType(type);
        m.setTitle(title);
        m.setSourceUrl(sourceUrl);
        m.setStatus(MaterialStatus.PROCESSING);
        return materials.save(m);   // saved first, so the row exists even if the AI call fails
    }

    private MaterialResponse finish(Material m, String externalId, String title, int chunks, Integer duration) {
        m.setExternalId(externalId);
        m.setTitle(title);
        m.setChunkCount(chunks);
        m.setDurationSeconds(duration);
        m.setStatus(MaterialStatus.READY);
        return toResponse(materials.save(m));
    }

    private MaterialResponse fail(Material m, RuntimeException e) {
        String msg = errorMessage(e);
        m.setStatus(MaterialStatus.FAILED);
        m.setErrorMessage(msg.length() > 1000 ? msg.substring(0, 1000) : msg);
        return toResponse(materials.save(m));
    }

    // FastAPI sends {"error": "NO_SPEECH", "message": "..."}; keep the human-readable message
    private String errorMessage(RuntimeException e) {
        if (e instanceof RestClientResponseException r) {
            try {
                Map<?, ?> body = r.getResponseBodyAs(Map.class);
                if (body != null && body.get("message") != null) return body.get("message").toString();
            } catch (RuntimeException ignored) { }
            return "AI service error " + r.getStatusCode().value();
        }
        if (e instanceof ResourceAccessException) return "The AI service is not reachable.";
        return "Unexpected error: " + e.getMessage();
    }

    private MaterialResponse toResponse(Material m) {
        return new MaterialResponse(m.getId(), m.getType(), m.getTitle(), m.getSourceUrl(),
                m.getStatus(), m.getErrorMessage(), m.getChunkCount(), m.getExternalId(), m.getDurationSeconds());
    }
    public AiDtos.QuizResponse quiz(Long userId, Long courseId, Long materialId, int count) {
        Course course = courses.requireAccess(userId, courseId);
        Material m = materials.findByIdAndCourseId(materialId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
        if (m.getStatus() != MaterialStatus.READY || m.getType() == MaterialType.PDF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quizzes are available for ready videos only");
        }
        return ai.quiz(course.getSlug(), m.getExternalId(), Math.max(1, Math.min(count, 10)));
    }

}