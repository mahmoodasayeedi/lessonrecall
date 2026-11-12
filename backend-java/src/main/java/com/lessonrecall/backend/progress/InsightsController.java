package com.lessonrecall.backend.progress;

import com.lessonrecall.backend.chat.ChatMessageRepository;
import com.lessonrecall.backend.course.CourseService;
import com.lessonrecall.backend.course.EnrollmentRepository;
import com.lessonrecall.backend.material.Material;
import com.lessonrecall.backend.material.MaterialRepository;
import com.lessonrecall.backend.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses/{courseId}/insights")
public class InsightsController {

    public record WeakMoment(String videoId, String videoTitle, Integer startSeconds, String location, String url,
                             int wrong, int total, String sampleQuestion) {}
    public record LearnerRow(Long id, String name, String avatar, int answers, Integer correctPercent,
                             int weakSpots, Instant lastActivity) {}
    public record Insights(int learners, long questionsAsked, int quizAnswers, Integer correctPercent,
                           List<WeakMoment> weakMoments, List<LearnerRow> learnerRows) {}

    private final CourseService courses;
    private final EnrollmentRepository enrollments;
    private final QuizResultRepository results;
    private final ChatMessageRepository chatMessages;
    private final MaterialRepository materials;

    public InsightsController(CourseService courses, EnrollmentRepository enrollments, QuizResultRepository results,
                              ChatMessageRepository chatMessages, MaterialRepository materials) {
        this.courses = courses;
        this.enrollments = enrollments;
        this.results = results;
        this.chatMessages = chatMessages;
        this.materials = materials;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Insights insights(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        Long ownerId = Long.valueOf(jwt.getSubject());
        courses.requireOwner(ownerId, courseId);                     // only the instructor who owns the course

        List<User> learners = enrollments.findByCourseId(courseId).stream().map(e -> e.getUser()).toList();
        Set<Long> learnerIds = learners.stream().map(User::getId).collect(Collectors.toSet());

        // Only learners' answers (not the instructor's own tests), newest first
        List<QuizResult> all = results.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
                .filter(r -> learnerIds.contains(r.getUser().getId())).toList();

        Map<String, String> titles = materials.findByCourseIdOrderByCreatedAtAsc(courseId).stream()
                .filter(m -> m.getExternalId() != null)
                .collect(Collectors.toMap(Material::getExternalId, Material::getTitle, (a, b) -> a));

        // Where the class struggles: per video moment, how many answers were wrong
        Map<String, List<QuizResult>> byMoment = all.stream()
                .collect(Collectors.groupingBy(r -> r.getVideoId() + "@" + r.getStartSeconds(),
                        LinkedHashMap::new, Collectors.toList()));
        List<WeakMoment> weakMoments = byMoment.values().stream()
                .map(list -> {
                    QuizResult first = list.get(0);
                    int wrong = (int) list.stream().filter(r -> !r.isCorrect()).count();
                    return new WeakMoment(first.getVideoId(), titles.getOrDefault(first.getVideoId(), first.getVideoId()),
                            first.getStartSeconds(), first.getSourceLocation(), first.getSourceUrl(),
                            wrong, list.size(), first.getQuestion());
                })
                .filter(w -> w.wrong() > 0)
                .sorted(Comparator.comparingInt(WeakMoment::wrong).reversed())
                .limit(5)
                .toList();

        // One row per learner
        List<LearnerRow> rows = learners.stream().map(u -> {
            List<QuizResult> mine = all.stream().filter(r -> r.getUser().getId().equals(u.getId())).toList();
            Map<String, QuizResult> latest = new LinkedHashMap<>();     // latest answer per moment
            mine.forEach(r -> latest.putIfAbsent(r.getVideoId() + "@" + r.getStartSeconds(), r));
            int weakSpots = (int) latest.values().stream().filter(r -> !r.isCorrect()).count();
            Instant last = mine.isEmpty() ? null : mine.get(0).getCreatedAt();
            return new LearnerRow(u.getId(), u.getName(), u.getAvatar(), mine.size(), percent(mine), weakSpots, last);
        }).sorted(Comparator.comparingInt(LearnerRow::answers).reversed()).toList();

        long questionsAsked = chatMessages.countBySessionCourseIdAndRoleAndSessionUserIdNot(courseId, "user", ownerId);
        return new Insights(learners.size(), questionsAsked, all.size(), percent(all), weakMoments, rows);
    }

    private static Integer percent(List<QuizResult> list) {
        if (list.isEmpty()) return null;
        return (int) Math.round(100.0 * list.stream().filter(QuizResult::isCorrect).count() / list.size());
    }
}