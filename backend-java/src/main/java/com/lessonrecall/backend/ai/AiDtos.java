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

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record IngestResponse(@JsonProperty("video_id") String videoId,
                                 String title,
                                 @JsonProperty("stored_chunks") int storedChunks,
                                 @JsonProperty("duration_seconds") Integer durationSeconds) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PdfIngestResponse(@JsonProperty("document_id") String documentId,
                                    String title,
                                    @JsonProperty("stored_chunks") int storedChunks,
                                    @JsonProperty("duration_seconds") Integer durationSeconds){}


    public record ChatRequest(String message,
                              @JsonProperty("thread_id") String threadId,
                              @JsonProperty("course_id") String courseId,
                              @JsonProperty("video_id") String videoId,String language) {}


    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChatResponse(String answer,
                               @JsonProperty("tools_used") List<String> toolsUsed,
                               @JsonProperty("thread_id") String threadId,
                               List<String> suggestions) {}

    public record TranscriptRequest(@JsonProperty("course_id") String courseId,
                                    @JsonProperty("video_id") String videoId) {}

    public record TranscriptSection(@JsonProperty("start_seconds") int startSeconds,
                                    @JsonProperty("end_seconds") int endSeconds,
                                    String text) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TranscriptResponse(@JsonProperty("video_id") String videoId,
                                     List<TranscriptSection> sections) {}

    public record SummaryRequest(@JsonProperty("course_id") String courseId,
                                 @JsonProperty("video_id") String videoId) {}

    public record Chapter(String title, String timestamp, String url) {}

    public record SummaryResponse(@JsonProperty("video_id") String videoId, String title, String summary,
                                  @JsonProperty("key_points") List<String> keyPoints,
                                  List<Chapter> chapters) {}
    public record QuizRequest(@JsonProperty("course_id") String courseId,
                              @JsonProperty("video_id") String videoId,
                              @JsonProperty("number_of_questions") int numberOfQuestions) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuizQuestion(String question, List<String> options,
                               @JsonProperty("correct_option") int correctOption,
                               String explanation, String difficulty,
                               @JsonProperty("start_seconds") int startSeconds,
                               String timestamp, String url) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuizResponse(@JsonProperty("video_id") String videoId, List<QuizQuestion> questions) {}


    public record CourseQuizRequest(@JsonProperty("course_id") String courseId,
                                    @JsonProperty("document_ids") List<String> documentIds,
                                    @JsonProperty("number_of_questions") int numberOfQuestions) {}

    public record CourseQuizQuestion(String topic, String question, List<String> options,
                                     @JsonProperty("correct_option") int correctOption,
                                     String explanation, String difficulty,
                                     @JsonProperty("source_title") String sourceTitle, String location,
                                     @JsonProperty("video_id") String videoId,
                                     @JsonProperty("start_seconds") Integer startSeconds, String url) {}

    public record CourseQuizResponse(List<CourseQuizQuestion> questions) {}

}