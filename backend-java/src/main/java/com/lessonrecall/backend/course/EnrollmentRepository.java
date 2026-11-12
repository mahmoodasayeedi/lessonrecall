package com.lessonrecall.backend.course;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUserId(Long userId);
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
    List<Enrollment> findByCourseId(Long courseId);
    @Modifying
    @Query("delete from Enrollment e where e.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from Enrollment e where e.user.id = :userId and e.course.id = :courseId")
    int deleteByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);

}