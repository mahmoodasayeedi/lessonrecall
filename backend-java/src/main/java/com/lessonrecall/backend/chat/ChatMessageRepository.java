package com.lessonrecall.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    long countBySessionCourseIdAndRoleAndSessionUserIdNot(Long courseId, String role, Long ownerId);

    @Modifying
    @Query("delete from ChatMessage m where m.session.id in (select s.id from ChatSession s where s.course.id = :courseId)")
    void deleteByCourseId(@Param("courseId") Long courseId);
}