package com.lessonrecall.backend.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class AiDtos {

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
    private AiDtos() {}
}