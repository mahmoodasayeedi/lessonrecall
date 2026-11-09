package com.lessonrecall.backend.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CourseDtos {

    public record CreateCourseRequest(
            @NotBlank @Size(max = 120) String title,
            @Size(max = 1000) String description,
            @NotNull Visibility visibility) {}

    // myRelation: OWNER, ENROLLED or NOT_JOINED, so React knows which buttons to show
    public record CourseResponse(Long id, String title, String slug, String description,
                                 Visibility visibility, String ownerName, String myRelation) {}

    private CourseDtos() {}
    public record UpdateCourseRequest(@NotBlank String title, String description) {}
}