package com.lessonrecall.backend.course;

import com.lessonrecall.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Getter @Setter @NoArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;            // also the Pinecone namespace, e.g. "neural-networks"

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User owner;             // who created it (instructor or learner)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility;  // CLASS = shared, PRIVATE = only the owner

    @CreationTimestamp
    private Instant createdAt;
}