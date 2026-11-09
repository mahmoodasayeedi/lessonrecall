package com.lessonrecall.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserIdAndCourseIdOrderByCreatedAtDesc(Long userId, Long courseId);

    @Query("select s from ChatSession s join fetch s.course where s.id = :id")
    Optional<ChatSession> findWithCourse(@Param("id") Long id);

    @Modifying
    @Query("delete from ChatSession s where s.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

}