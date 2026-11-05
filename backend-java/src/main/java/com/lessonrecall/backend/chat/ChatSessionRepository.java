package com.lessonrecall.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUserIdAndCourseIdOrderByCreatedAtDesc(Long userId, Long courseId);
}