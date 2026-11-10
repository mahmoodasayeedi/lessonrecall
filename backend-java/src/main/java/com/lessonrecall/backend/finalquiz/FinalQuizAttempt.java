package com.lessonrecall.backend.finalquiz;
import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.user.User;
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
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"quiz_id", "user_id"}))
public class FinalQuizAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) private FinalQuiz quiz;
    @ManyToOne(optional = false) private User user;

    private int score;
    private int total;
    private boolean passed;
    private String answers;                  // e.g. "1,0,3,2" – the learner's choices

    @CreationTimestamp
    private Instant createdAt;
}