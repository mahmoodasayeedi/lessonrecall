package com.lessonrecall.backend.ai;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

@RestControllerAdvice
public class AiErrorHandler {

    // FastAPI answered with an error, e.g. {"error":"NO_SPEECH","message":"..."}
    @ExceptionHandler(RestClientResponseException.class)
    public ProblemDetail aiError(RestClientResponseException e) {
        ProblemDetail problem = ProblemDetail.forStatus(e.getStatusCode());
        problem.setTitle("AI service error");
        problem.setDetail(e.getResponseBodyAsString());
        return problem;
    }

    // FastAPI is not running or not reachable
    @ExceptionHandler(ResourceAccessException.class)
    public ProblemDetail aiDown(ResourceAccessException e) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
        problem.setTitle("AI service unavailable");
        problem.setDetail("The AI service is not reachable. Please try again later.");
        return problem;
    }
}