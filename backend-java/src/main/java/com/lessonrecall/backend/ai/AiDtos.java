package com.lessonrecall.backend.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class AiDtos {
    private AiDtos() {}
    public record AskRequest(String question,
                             @JsonProperty("course_id") String courseId,
                             @JsonProperty("video_id") String videoId) {}

    public record Source(int number, String title, String timestamp, String url, double score) {}

    public record AskResponse(String answer, boolean covered, List<Source> sources) {}

    public record YoutubeIngestRequest(String url,
                                       @JsonProperty("course_id") String courseId,
                                       String language) {}

    @JsonIgnoreProperties(ignoreUnknown = true)   // we don't need the chunks list in Java
    public record IngestResponse(@JsonProperty("video_id") String videoId,
                                 String title,
                                 @JsonProperty("stored_chunks") int storedChunks) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PdfIngestResponse(@JsonProperty("document_id") String documentId,
                                    String title,
                                    @JsonProperty("stored_chunks") int storedChunks) {}


    public record ChatRequest(String message,
                              @JsonProperty("thread_id") String threadId,
                              @JsonProperty("course_id") String courseId,
                              @JsonProperty("video_id") String videoId) {}

    public record ChatResponse(String answer,
                               @JsonProperty("tools_used") List<String> toolsUsed,
                               @JsonProperty("thread_id") String threadId) {}

    public record SummaryRequest(@JsonProperty("course_id") String courseId,
                                 @JsonProperty("video_id") String videoId) {}

    public record Chapter(String title, String timestamp, String url) {}

    public record SummaryResponse(@JsonProperty("video_id") String videoId, String title, String summary,
                                  @JsonProperty("key_points") List<String> keyPoints,
                                  List<Chapter> chapters) {}
}