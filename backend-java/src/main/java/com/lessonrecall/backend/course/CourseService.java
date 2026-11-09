package com.lessonrecall.backend.course;

import com.lessonrecall.backend.ai.AiClient;
import com.lessonrecall.backend.chat.ChatMessageRepository;
import com.lessonrecall.backend.chat.ChatSessionRepository;
import com.lessonrecall.backend.course.CourseDtos.*;
import com.lessonrecall.backend.material.MaterialRepository;
import com.lessonrecall.backend.progress.QuizResultRepository;
import com.lessonrecall.backend.user.Role;
import com.lessonrecall.backend.user.User;
import com.lessonrecall.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final UserRepository users;
    private final MaterialRepository materials;
    private final QuizResultRepository quizResults;
    private final ChatSessionRepository chatSessions;
    private final ChatMessageRepository chatMessages;
    private final AiClient ai;

    public CourseService(CourseRepository courses, EnrollmentRepository enrollments, UserRepository users,
                         MaterialRepository materials, QuizResultRepository quizResults,
                         ChatSessionRepository chatSessions, ChatMessageRepository chatMessages,
                         AiClient ai) {
        this.courses = courses;
        this.enrollments = enrollments;
        this.users = users;
        this.materials = materials;
        this.quizResults = quizResults;
        this.chatSessions = chatSessions;
        this.chatMessages = chatMessages;
        this.ai = ai;
    }
    public CourseResponse create(Long userId, CreateCourseRequest request) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (request.visibility() == Visibility.CLASS && user.getRole() != Role.INSTRUCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only instructors can create class courses");
        }
        Course course = new Course();
        course.setTitle(request.title().trim());
        course.setDescription(request.description());
        course.setVisibility(request.visibility());
        course.setOwner(user);
        course.setSlug(uniqueSlug(request.title()));
        courses.save(course);
        return toResponse(course, "OWNER");
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> mine(Long userId) {
        List<CourseResponse> result = new ArrayList<>();
        courses.findByOwnerId(userId).forEach(c -> result.add(toResponse(c, "OWNER")));
        enrollments.findByUserId(userId).forEach(e -> result.add(toResponse(e.getCourse(), "ENROLLED")));
        return result;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> catalog(Long userId) {
        Set<Long> joined = enrollments.findByUserId(userId).stream()
                .map(e -> e.getCourse().getId()).collect(Collectors.toSet());
        return courses.findByVisibilityOrderByCreatedAtDesc(Visibility.CLASS).stream()
                .map(c -> toResponse(c, relation(c, userId, joined.contains(c.getId()))))
                .toList();
    }

    public CourseResponse join(Long userId, Long courseId) {
        Course course = find(courseId);
        if (course.getVisibility() != Visibility.CLASS) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        if (course.getOwner().getId().equals(userId)) {
            return toResponse(course, "OWNER");
        }
        if (!enrollments.existsByUserIdAndCourseId(userId, courseId)) {
            Enrollment enrollment = new Enrollment();
            enrollment.setUser(users.getReferenceById(userId));
            enrollment.setCourse(course);
            enrollments.save(enrollment);
        }
        return toResponse(course, "ENROLLED");
    }

    @Transactional(readOnly = true)
    public CourseResponse get(Long userId, Long courseId) {
        Course course = requireAccess(userId, courseId);
        boolean enrolled = enrollments.existsByUserIdAndCourseId(userId, courseId);
        return toResponse(course, relation(course, userId, enrolled));
    }

    /** Used by every course feature (materials, ask, chat): owner, or enrolled in a CLASS course. */
    @Transactional(readOnly = true)
    public Course requireAccess(Long userId, Long courseId) {
        Course course = find(courseId);
        boolean isOwner = course.getOwner().getId().equals(userId);
        boolean isMember = course.getVisibility() == Visibility.CLASS
                && enrollments.existsByUserIdAndCourseId(userId, courseId);
        if (!isOwner && !isMember) {
            // 404, not 403: don't reveal that a private course exists
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        return course;
    }
    /** Only the owner may change a course (add or delete materials). */
    @Transactional(readOnly = true)
    public Course requireOwner(Long userId, Long courseId) {
        Course course = requireAccess(userId, courseId);   // 404 if no access at all
        if (!course.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the course owner can do this");
        }
        return course;
    }

    private Course find(Long courseId) {
        return courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private String relation(Course c, Long userId, boolean enrolled) {
        if (c.getOwner().getId().equals(userId)) return "OWNER";
        return enrolled ? "ENROLLED" : "NOT_JOINED";
    }

    // "Neural Networks 101!" -> "neural-networks-101" (and "-2", "-3" if taken)
    private String uniqueSlug(String title) {
        String base = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "course";
        if (base.length() > 50) base = base.substring(0, 50);
        String slug = base;
        for (int i = 2; courses.existsBySlug(slug); i++) {
            slug = base + "-" + i;
        }
        return slug;
    }

    private CourseResponse toResponse(Course c, String relation) {
        return new CourseResponse(c.getId(), c.getTitle(), c.getSlug(), c.getDescription(),
                c.getVisibility(), c.getOwner().getName(), relation);
    }

    @Transactional
    public CourseResponse update(Long courseId, Long userId, UpdateCourseRequest req) {
        Course course = requireOwner(userId, courseId);
        course.setTitle(req.title());
        course.setDescription(req.description());
        return toResponse(course, "OWNER");
    }

    @Transactional
    public void delete(Long courseId, Long userId) {
        Course course = requireOwner(userId, courseId);
        chatMessages.deleteByCourseId(courseId);
        chatSessions.deleteByCourseId(courseId);
        quizResults.deleteByCourseId(courseId);
        materials.deleteByCourseId(courseId);
        enrollments.deleteByCourseId(courseId);
        courses.delete(course);
        try {
            ai.deleteCourse(course.getSlug());
        } catch (Exception e) {
            log.warn("Could not delete Pinecone namespace {}: {}", course.getSlug(), e.getMessage());
        }
    }

    @Transactional
    public void leave(Long courseId, Long userId) {
        Course course = courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (course.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You own this course. Delete it instead of leaving.");
        }
        if (enrollments.deleteByUserIdAndCourseId(userId, courseId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "You are not enrolled in this course");
        }
    }
}