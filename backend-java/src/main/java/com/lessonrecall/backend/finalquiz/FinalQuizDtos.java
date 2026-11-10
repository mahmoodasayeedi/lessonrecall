package com.lessonrecall.backend.finalquiz;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public class FinalQuizDtos {
    public record QuestionView(Long id, String topic, String question, List<String> options,
                               Integer correctOption, String explanation, String difficulty,
                               String location, String videoId, Integer startSeconds, String url) {}
    public record AttemptView(int score, int total, boolean passed, List<Integer> answers, Instant takenAt) {}
    public record QuizView(Long id, String status, int passMark, List<QuestionView> questions, AttemptView myAttempt) {}
    public record PublishRequest(@Min(1) @Max(100) int passMark) {}
    public record SubmitRequest(@NotNull List<Integer> answers) {}
    public record ResultRow(String learnerName, String email, int score, int total, int percent,
                            boolean passed, Instant takenAt) {}
}