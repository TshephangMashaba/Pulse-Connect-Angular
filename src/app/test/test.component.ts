// test.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CourseService, Test, TestSubmission, TestAnswer } from '../services/course.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-course-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
  standalone: false
})
export class TestComponent implements OnInit {
  @Input() courseId: string = '';
  @Input() test: Test | null = null;
  @Output() testCompleted = new EventEmitter<any>(); // Changed to emit the full result
  
  userAnswers: { [questionId: string]: string } = {};
  isSubmitting = false;
  errorMessage = '';
  testResult: any = null;

  constructor(
    private courseService: CourseService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    if (!this.test) {
      this.loadTest();
    }
  }

  loadTest() {
    this.courseService.getTest(this.courseId).subscribe({
      next: (test) => {
        this.test = test;
      },
      error: (error) => {
        console.error('Error loading test:', error);
        this.errorMessage = 'Failed to load test';
      }
    });
  }

  onAnswerSelect(questionId: string, optionId: string) {
    this.userAnswers[questionId] = optionId;
  }

  submitTest() {
    if (!this.test || !this.authService.isAuthenticated()) {
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = this.test.questions.filter(
      q => !this.userAnswers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      this.errorMessage = 'Please answer all questions before submitting';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Prepare submission in the NEW format
    const submissionData = {
      testId: this.test.id, // Include the testId
      answers: Object.entries(this.userAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId
      }))
    };

    console.log('Submitting test data:', submissionData);

    // Call the NEW submitTest method (single parameter)
    this.courseService.submitTest(submissionData).subscribe({
      next: (result) => {
        this.testResult = result;
        this.isSubmitting = false;
        // Emit the full result object instead of just isPassed
        this.testCompleted.emit(result);
      },
      error: (error) => {
        console.error('Error submitting test:', error);
        this.errorMessage = 'Failed to submit test. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.test) return 0;
    
    const answeredCount = Object.keys(this.userAnswers).length;
    return (answeredCount / this.test.questions.length) * 100;
  }

  isAllQuestionsAnswered(): boolean {
    if (!this.test) return false;
    return Object.keys(this.userAnswers).length === this.test.questions.length;
  }
}