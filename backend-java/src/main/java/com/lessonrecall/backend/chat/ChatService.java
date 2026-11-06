package com.lessonrecall.backend.chat;

import com.lessonrecall.backend.ai.AiClient;
import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.course.CourseService;
import com.lessonrecall.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    public record SessionResponse(Long id, String title, Instant createdAt) {}
    public record MessageResponse(Long id, String role, String content, Instant createdAt) {}
    public record ChatReply(MessageResponse userMessage, MessageResponse assistantMessage,
                            List<String> toolsUsed, List<String> suggestions) {}

    private final ChatSessionRepository sessions;
    private final ChatMessageRepository messages;
    private final CourseService courses;
    private final UserRepository users;
    private final AiClient ai;

    public ChatService(ChatSessionRepository sessions, ChatMessageRepository messages,
                       CourseService courses, UserRepository users, AiClient ai) {
        this.sessions = sessions;
        this.messages = messages;
        this.courses = courses;
        this.users = users;
        this.ai = ai;
    }

    public SessionResponse start(Long userId, Long courseId) {
        Course course = courses.requireAccess(userId, courseId);
        ChatSession s = new ChatSession();
        s.setUser(users.getReferenceById(userId));
        s.setCourse(course);
        s.setThreadId("u" + userId + "-c" + courseId + "-" + UUID.randomUUID());   // unique memory key
        s.setTitle("New chat");
        sessions.save(s);
        return new SessionResponse(s.getId(), s.getTitle(), s.getCreatedAt());
    }

    public List<SessionResponse> list(Long userId, Long courseId) {
        courses.requireAccess(userId, courseId);
        return sessions.findByUserIdAndCourseIdOrderByCreatedAtDesc(userId, courseId).stream()
                .map(s -> new SessionResponse(s.getId(), s.getTitle(), s.getCreatedAt())).toList();
    }

    public ChatReply send(Long userId, Long sessionId, String text, String videoId) {
        ChatSession s = ownSession(userId, sessionId);
        courses.requireAccess(userId, s.getCourse().getId());   // still enrolled?

        ChatMessage userMsg = save(s, "user", text);
        var result = ai.chat(text, s.getThreadId(), s.getCourse().getSlug(), videoId);
        ChatMessage botMsg = save(s, "assistant", result.answer());

        if ("New chat".equals(s.getTitle())) {                   // first question becomes the title
            s.setTitle(text.length() > 60 ? text.substring(0, 60) + "…" : text);
            sessions.save(s);
        }
        return new ChatReply(toResponse(userMsg), toResponse(botMsg), result.toolsUsed(),
                result.suggestions() == null ? List.of() : result.suggestions());
    }

    public List<MessageResponse> history(Long userId, Long sessionId) {
        ownSession(userId, sessionId);
        return messages.findBySessionIdOrderByCreatedAtAsc(sessionId).stream().map(this::toResponse).toList();
    }

    // Only the learner who owns a chat may read or continue it
    private ChatSession ownSession(Long userId, Long sessionId) {
        ChatSession s = sessions.findWithCourse(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found"));
        if (!s.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found");
        }
        return s;
    }

    private ChatMessage save(ChatSession s, String role, String content) {
        ChatMessage m = new ChatMessage();
        m.setSession(s);
        m.setRole(role);
        m.setContent(content);
        return messages.save(m);
    }

    private MessageResponse toResponse(ChatMessage m) {
        return new MessageResponse(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt());
    }
}