package com.lessonrecall.backend.finalquiz;
import com.lessonrecall.backend.course.Course;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.Id;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @NoArgsConstructor
public class FinalQuizQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private FinalQuiz quiz;

    private int position;
    private String topic;
    @Column(columnDefinition = "TEXT") private String question;

    @ElementCollection(fetch = FetchType.EAGER)
    @OrderColumn
    private List<String> options = new ArrayList<>();

    private int correctOption;
    @Column(columnDefinition = "TEXT") private String explanation;
    private String difficulty;
    private String location;                 // "9:16" or "page 4"
    private String videoId;
    private Integer startSeconds;
    private String url;
}