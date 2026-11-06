package com.lessonrecall.backend.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class AiDtos {

    public record AskRequest(String question,
                             @JsonProperty("course_id") String courseId,
                             @JsonProperty("video_id") String videoId) {}

    public record Source(int number, String title, String timestamp, String url, double score) {}

    public record AskResponse(String answer, boolean covered, List<Source> sources) {}

    private AiDtos() {}
}