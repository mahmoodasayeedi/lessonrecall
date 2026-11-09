package com.lessonrecall.backend.material;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCourseIdOrderByCreatedAtAsc(Long courseId);
    Optional<Material> findByIdAndCourseId(Long id, Long courseId);

    @Modifying
    @Query("delete from Material m where m.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

}