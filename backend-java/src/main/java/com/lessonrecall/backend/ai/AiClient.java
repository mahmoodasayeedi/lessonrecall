package com.lessonrecall.backend.ai;

import com.lessonrecall.backend.ai.AiDtos.*;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.http.HttpEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;

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

    public IngestResponse ingestUpload(MultipartFile file, String courseSlug) {
        return rest.post().uri("/ingest/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(multipart(file, courseSlug))
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
}