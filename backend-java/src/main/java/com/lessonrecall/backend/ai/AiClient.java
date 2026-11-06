package com.lessonrecall.backend.ai;

import com.lessonrecall.backend.ai.AiDtos.*;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
}