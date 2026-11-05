package com.lessonrecall.backend.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    // Weak topics = wrong answers, newest first
    List<QuizResult> findByUserIdAndCourseIdAndCorrectFalseOrderByCreatedAtDesc(Long userId, Long courseId);
}