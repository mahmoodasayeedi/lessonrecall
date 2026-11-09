package com.lessonrecall.backend.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    // Weak topics = wrong answers, newest first
    List<QuizResult> findByUserIdAndCourseIdAndCorrectFalseOrderByCreatedAtDesc(Long userId, Long courseId);

    @Modifying
    @Query("delete from QuizResult q where q.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from QuizResult q where q.course.id = :courseId and q.videoId = :videoId")
    void deleteByCourseIdAndVideoId(@Param("courseId") Long courseId, @Param("videoId") String videoId);

}