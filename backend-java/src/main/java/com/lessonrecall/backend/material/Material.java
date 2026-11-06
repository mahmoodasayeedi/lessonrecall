package com.lessonrecall.backend.material;

import com.lessonrecall.backend.course.Course;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Getter @Setter @NoArgsConstructor
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialType type;

    private String title;

    @Column(length = 1000)
    private String sourceUrl;        // YouTube link, null for uploads

    private String externalId;       // video_id / document_id from the AI service (links to Pinecone)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialStatus status;

    @Column(length = 1000)
    private String errorMessage;     // filled when status = FAILED

    private Integer chunkCount;

    @CreationTimestamp
    private Instant createdAt;
    private Integer durationSeconds;     // null for PDFs
}