package com.lessonrecall.backend.ai;

import com.lessonrecall.backend.ai.AiDtos.*;
import com.lessonrecall.backend.material.Material;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.http.HttpEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.lessonrecall.backend.ai.AiDtos.CourseQuizRequest;
import com.lessonrecall.backend.ai.AiDtos.CourseQuizResponse;
import java.util.List;
@Component
public class AiClient {

    private final RestClient rest;

    public AiClient(RestClient aiRestClient) {
        this.rest = aiRestClient;
    }

    public AskResponse ask(String question, String courseSlug, String videoId) {
        return rest.post().uri("/ask")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AskRequest(question, courseSlug, videoId))
                .retrieve()
                .body(AskResponse.class);
    }

    public IngestResponse ingestYoutube(String url, String courseSlug, String language) {
        return rest.post().uri("/ingest/youtube")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new YoutubeIngestRequest(url, courseSlug, language))
                .retrieve()
                .body(IngestResponse.class);
    }

    public IngestResponse ingestUpload(MultipartFile file, String courseSlug, String language) {
        var body = multipart(file, courseSlug);                                   // the map with file + course_id
        if (language != null && !language.isBlank()) body.add("language", language);
        return rest.post().uri("/ingest/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(IngestResponse.class);
    }

    public PdfIngestResponse ingestPdf(MultipartFile file, String courseSlug) {
        return rest.post().uri("/ingest/pdf")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(multipart(file, courseSlug))
                .retrieve()
                .body(PdfIngestResponse.class);
    }

    // Forwards the uploaded file to FastAPI as a multipart form: file + course_id
    private MultiValueMap<String, Object> multipart(MultipartFile file, String courseSlug) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", file.getResource());       // keeps the original file name
        form.add("course_id", courseSlug);
        return form;
    }
    public ChatResponse chat(String message, String threadId, String slug, String videoId, String language) {
        return rest.post().uri("/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChatRequest(message, threadId, slug, videoId, language))
                .retrieve()
                .body(ChatResponse.class);
    }

    public SummaryResponse summary(String courseSlug, String videoId) {
        return rest.post().uri("/summary")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new SummaryRequest(courseSlug, videoId))
                .retrieve()
                .body(SummaryResponse.class);
    }
    public TranscriptResponse transcript(String courseSlug, String videoId) {
        return rest.post().uri("/transcript")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TranscriptRequest(courseSlug, videoId))
                .retrieve()
                .body(TranscriptResponse.class);
    }
    public QuizResponse quiz(String courseSlug, String videoId, int count) {
        return rest.post().uri("/quiz")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new QuizRequest(courseSlug, videoId, count))
                .retrieve()
                .body(QuizResponse.class);
    }

    public void deleteCourse(String courseSlug) {
        rest.delete().uri("/courses/{c}", courseSlug).retrieve().toBodilessEntity();
    }

    public void deleteMaterial(String courseSlug, String externalId) {
        rest.delete().uri("/courses/{c}/documents/{d}", courseSlug, externalId)
                .retrieve().toBodilessEntity();
    }

    public CourseQuizResponse courseQuiz(String slug, List<String> documentIds, int count) {
        return rest.post().uri("/course-quiz")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CourseQuizRequest(slug, documentIds, count))
                .retrieve()
                .body(CourseQuizResponse.class);
    }

}