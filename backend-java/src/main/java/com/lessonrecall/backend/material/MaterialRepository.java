package com.lessonrecall.backend.material;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCourseIdOrderByCreatedAtAsc(Long courseId);
    Optional<Material> findByIdAndCourseId(Long id, Long courseId);
}