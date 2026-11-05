package com.lessonrecall.backend.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByOwnerId(Long ownerId);
    List<Course> findByVisibilityOrderByCreatedAtDesc(Visibility visibility);
    Optional<Course> findBySlug(String slug);
    boolean existsBySlug(String slug);
}