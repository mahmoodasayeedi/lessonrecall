package com.lessonrecall.backend.chat;

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
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Course course;

    @Column(nullable = false, unique = true)
    private String threadId;         // the agent's memory key in the AI service

    private String title;

    @CreationTimestamp
    private Instant createdAt;
}