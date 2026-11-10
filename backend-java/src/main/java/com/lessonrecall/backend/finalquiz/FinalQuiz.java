package com.lessonrecall.backend.finalquiz;

import com.lessonrecall.backend.course.Course;      // FinalQuiz only
import com.lessonrecall.backend.user.User;          // FinalQuizAttempt only
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class FinalQuiz {
    public enum Status { DRAFT, PUBLISHED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(unique = true)
    private Course course;

    @Enumerated(EnumType.STRING)
    private Status status = Status.DRAFT;

    private int passMark = 70;               // percent
    private Instant publishedAt;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position")
    private List<FinalQuizQuestion> questions = new ArrayList<>();

    @CreationTimestamp
    private Instant createdAt;
}