package com.lessonrecall.backend.finalquiz;

import com.lessonrecall.backend.ai.AiClient;
import com.lessonrecall.backend.course.Course;
import com.lessonrecall.backend.course.CourseService;
import com.lessonrecall.backend.finalquiz.FinalQuizDtos.*;
import com.lessonrecall.backend.material.Material;
import com.lessonrecall.backend.material.MaterialRepository;
import com.lessonrecall.backend.material.MaterialStatus;
import com.lessonrecall.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
@Service
@Transactional
public class FinalQuizService {

    private final FinalQuizRepository quizzes;
    private final FinalQuizAttemptRepository attempts;
    private final MaterialRepository materials;
    private final UserRepository users;
    private final CourseService courses;
    private final AiClient ai;

    public FinalQuizService(FinalQuizRepository quizzes, FinalQuizAttemptRepository attempts,
                            MaterialRepository materials, UserRepository users,
                            CourseService courses, AiClient ai) {
        this.quizzes = quizzes;
        this.attempts = attempts;
        this.materials = materials;
        this.users = users;
        this.courses = courses;
        this.ai = ai;
    }

    /** Instructor: generate a new DRAFT from all READY materials (replaces an old draft). */
    public FinalQuizDtos.QuizView generate(Long userId, Long courseId, int count) {
        Course course = courses.requireOwner(userId, courseId);
        quizzes.findByCourseId(courseId).ifPresent(old -> {
            if (old.getStatus() == FinalQuiz.Status.PUBLISHED)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "The final quiz is already published.");
            quizzes.delete(old);
            quizzes.flush();
        });
        List<String> docIds = materials.findByCourseIdOrderByCreatedAtAsc(courseId).stream()
                .filter(m -> m.getStatus() == MaterialStatus.READY && m.getExternalId() != null)
                .map(Material::getExternalId).toList();
        if (docIds.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one ready material first.");

        var generated = ai.courseQuiz(course.getSlug(), docIds, count).questions();
        FinalQuiz quiz = new FinalQuiz();
        quiz.setCourse(course);
        for (int i = 0; i < generated.size(); i++) {
            var g = generated.get(i);
            FinalQuizQuestion q = new FinalQuizQuestion();
            q.setQuiz(quiz);
            q.setPosition(i);
            q.setTopic(g.topic());
            q.setQuestion(g.question());
            q.setOptions(new ArrayList<>(g.options()));
            q.setCorrectOption(g.correctOption());
            q.setExplanation(g.explanation());
            q.setDifficulty(g.difficulty());
            q.setLocation(g.location());
            q.setVideoId(g.videoId());
            q.setStartSeconds(g.startSeconds());
            q.setUrl(g.url());
            quiz.getQuestions().add(q);
        }
        return view(quizzes.save(quiz), true, null);
    }

    /** Owner sees everything. A learner sees a PUBLISHED quiz; answers only after their attempt. */
    @Transactional(readOnly = true)
    public FinalQuizDtos.QuizView get(Long userId, Long courseId) {
        Course course = courses.requireAccess(userId, courseId);
        boolean owner = course.getOwner().getId().equals(userId);
        FinalQuiz quiz = quizzes.findByCourseId(courseId)
                .filter(q -> owner || q.getStatus() == FinalQuiz.Status.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No final quiz yet."));
        FinalQuizAttempt attempt = owner ? null
                : attempts.findByQuizIdAndUserId(quiz.getId(), userId).orElse(null);
        return view(quiz, owner || attempt != null, attempt);
    }

    /** Instructor review: remove a bad question from the draft. */
    public QuizView removeQuestion(Long userId, Long courseId, Long questionId) {
        FinalQuiz quiz = ownDraft(userId, courseId);
        quiz.getQuestions().removeIf(q -> q.getId().equals(questionId));
        return view(quiz, true, null);
    }

    public QuizView publish(Long userId, Long courseId, int passMark) {
        FinalQuiz quiz = ownDraft(userId, courseId);
        if (quiz.getQuestions().size() < 3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Keep at least 3 questions.");
        quiz.setPassMark(passMark);
        quiz.setStatus(FinalQuiz.Status.PUBLISHED);
        quiz.setPublishedAt(Instant.now());
        return view(quiz, true, null);
    }

    /** Learner: one attempt, graded here on the server. */
    public QuizView submit(Long userId, Long courseId, List<Integer> answers) {
        Course course = courses.requireAccess(userId, courseId);
        if (course.getOwner().getId().equals(userId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Instructors don't take their own quiz.");
        FinalQuiz quiz = quizzes.findByCourseId(courseId)
                .filter(q -> q.getStatus() == FinalQuiz.Status.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No final quiz yet."));
        if (attempts.findByQuizIdAndUserId(quiz.getId(), userId).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already taken this quiz.");
        List<FinalQuizQuestion> qs = quiz.getQuestions();
        if (answers.size() != qs.size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please answer every question.");

        int score = 0;
        for (int i = 0; i < qs.size(); i++) {
            if (answers.get(i) != null && answers.get(i) == qs.get(i).getCorrectOption()) score++;
        }
        FinalQuizAttempt attempt = new FinalQuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setUser(users.getReferenceById(userId));
        attempt.setScore(score);
        attempt.setTotal(qs.size());
        attempt.setPassed(score * 100 >= quiz.getPassMark() * qs.size());
        attempt.setAnswers(answers.stream().map(a -> a == null ? "-1" : a.toString())
                .collect(Collectors.joining(",")));
        attempts.save(attempt);
        return view(quiz, true, attempt);
    }

    /** Instructor: class results. */
    @Transactional(readOnly = true)
    public List<ResultRow> results(Long userId, Long courseId) {
        courses.requireOwner(userId, courseId);
        FinalQuiz quiz = quizzes.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No final quiz yet."));
        return attempts.findByQuizIdOrderByCreatedAtDesc(quiz.getId()).stream()
                .map(a -> new ResultRow(a.getUser().getName(), a.getUser().getEmail(), a.getScore(), a.getTotal(),
                        a.getTotal() == 0 ? 0 : a.getScore() * 100 / a.getTotal(), a.isPassed(), a.getCreatedAt()))
                .toList();
    }

    // ---------- helpers ----------

    private FinalQuiz ownDraft(Long userId, Long courseId) {
        courses.requireOwner(userId, courseId);
        FinalQuiz quiz = quizzes.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No final quiz yet."));
        if (quiz.getStatus() != FinalQuiz.Status.DRAFT)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A published quiz can't be changed.");
        return quiz;
    }

    private QuizView view(FinalQuiz quiz, boolean withAnswers, FinalQuizAttempt attempt) {
        List<QuestionView> qs = quiz.getQuestions().stream().map(q -> new QuestionView(
                q.getId(), q.getTopic(), q.getQuestion(), List.copyOf(q.getOptions()),
                withAnswers ? q.getCorrectOption() : null,
                withAnswers ? q.getExplanation() : null,
                q.getDifficulty(),
                withAnswers ? q.getLocation() : null,
                withAnswers ? q.getVideoId() : null,
                withAnswers ? q.getStartSeconds() : null,
                withAnswers ? q.getUrl() : null)).toList();
        AttemptView av = attempt == null ? null : new AttemptView(attempt.getScore(), attempt.getTotal(),
                attempt.isPassed(),
                Arrays.stream(attempt.getAnswers().split(",")).map(Integer::valueOf).toList(),
                attempt.getCreatedAt());
        return new QuizView(quiz.getId(), quiz.getStatus().name(), quiz.getPassMark(), qs, av);
    }
}