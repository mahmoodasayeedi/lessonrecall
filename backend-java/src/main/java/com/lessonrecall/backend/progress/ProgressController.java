package com.lessonrecall.backend.progress;

import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.course.CourseService;
import com.lessonrecall.backend.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/courses/{courseId}")
public class ProgressController {

    public record ResultItem(@NotBlank String question, boolean correct, String videoId,
                             Integer startSeconds, String timestamp, String url) {}
    public record SaveResultsRequest(@NotEmpty List<@Valid ResultItem> results) {}
    public record WeakTopic(String question, String videoId, Integer startSeconds,
                            String timestamp, String url, Instant missedAt) {}

    private final QuizResultRepository results;
    private final CourseService courses;
    private final UserRepository users;

    public ProgressController(QuizResultRepository results, CourseService courses, UserRepository users) {
        this.results = results;
        this.courses = courses;
        this.users = users;
    }

    @PostMapping("/quiz-results")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Integer> save(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
                                     @Valid @RequestBody SaveResultsRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        Course course = courses.requireAccess(userId, courseId);
        for (ResultItem item : request.results()) {
            QuizResult r = new QuizResult();
            r.setUser(users.getReferenceById(userId));
            r.setCourse(course);
            r.setQuestion(item.question());
            r.setTopic(item.question().length() > 250 ? item.question().substring(0, 250) : item.question());
            r.setCorrect(item.correct());
            r.setVideoId(item.videoId());
            r.setStartSeconds(item.startSeconds());
            r.setSourceLocation(item.timestamp());
            r.setSourceUrl(item.url());
            results.save(r);
        }
        int correct = (int) request.results().stream().filter(ResultItem::correct).count();
        return Map.of("saved", request.results().size(), "correct", correct);
    }
    // Weak topics = moments whose LATEST quiz answer was wrong (a later correct answer clears it)
    @GetMapping("/weak-topics")
    @Transactional(readOnly = true)
    public List<WeakTopic> weakTopics(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        Long userId = Long.valueOf(jwt.getSubject());
        courses.requireAccess(userId, courseId);

        Map<String, QuizResult> latest = new LinkedHashMap<>();       // newest first → first one per moment = latest
        for (QuizResult r : results.findByUserIdAndCourseIdOrderByCreatedAtDesc(userId, courseId)) {
            latest.putIfAbsent(r.getVideoId() + "@" + r.getStartSeconds(), r);
        }
        return latest.values().stream()
                .filter(r -> !r.isCorrect())
                .map(r -> new WeakTopic(r.getQuestion(), r.getVideoId(), r.getStartSeconds(),
                        r.getSourceLocation(), r.getSourceUrl(), r.getCreatedAt()))
                .toList();
    }
}