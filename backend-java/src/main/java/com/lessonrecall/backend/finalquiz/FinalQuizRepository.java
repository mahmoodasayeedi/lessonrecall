package com.lessonrecall.backend.finalquiz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FinalQuizRepository extends JpaRepository<FinalQuiz, Long> {
    Optional<FinalQuiz> findByCourseId(Long courseId);
}