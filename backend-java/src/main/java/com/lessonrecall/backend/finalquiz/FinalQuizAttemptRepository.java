package com.lessonrecall.backend.finalquiz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FinalQuizAttemptRepository extends JpaRepository<FinalQuizAttempt, Long> {
    Optional<FinalQuizAttempt> findByQuizIdAndUserId(Long quizId, Long userId);
    List<FinalQuizAttempt> findByQuizIdOrderByCreatedAtDesc(Long quizId);

    @Modifying
    @Query("delete from FinalQuizAttempt a where a.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
}