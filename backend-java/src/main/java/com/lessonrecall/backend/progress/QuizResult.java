package com.lessonrecall.backend.progress;

import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Getter @Setter @NoArgsConstructor
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Course course;

    private String topic;

    @Column(columnDefinition = "TEXT")
    private String question;

    private boolean correct;

    private String sourceLocation;   // "2:23" or "page 6" → where to rewatch

    @Column(length = 1000)
    private String sourceUrl;

    @CreationTimestamp
    private Instant createdAt;
}