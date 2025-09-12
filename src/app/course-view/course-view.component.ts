// course-view.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, Course, Chapter, Enrollment } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';
import { Subscription } from 'rxjs';
import { TextToSpeechService } from '../services/tts.service';

@Component({
  selector: 'app-course-view',
  templateUrl:'./course-view.component.html',
  styleUrls: ['./course-view.component.css'],
  standalone: false
})
export class CourseViewComponent implements OnInit {
  course: Course | null = null;
  chapters: Chapter[] = [];
  enrollment: Enrollment | null = null;
  currentChapter: Chapter | null = null;
  isLoading = true;
  errorMessage = '';
  showTest = false;
  test: any = null;
  testResult: any = null;
  testAttempts: any[] = [];


  isPlaying = false;
  private ttsSubscription: Subscription;
  @ViewChild('chapterContent') chapterContent!: ElementRef;

  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private alertService: AlertService,
    private ttsService: TextToSpeechService
  ) { 
       this.ttsSubscription = this.ttsService.getIsSpeaking().subscribe(speaking => {
      this.isPlaying = speaking;
    });
  }

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourseData(courseId);
    } else {
      this.errorMessage = 'Course ID not provided';
      this.isLoading = false;
    }
  }

   ngOnDestroy() {
    // Clean up TTS when component is destroyed
    this.ttsService.stop();
    if (this.ttsSubscription) {
      this.ttsSubscription.unsubscribe();
    }
  }

  toggleTTS() {
    if (this.isPlaying) {
      this.ttsService.pause();
    } else {
      this.readChapterContent();
    }
  }

   stopTTS() {
    this.ttsService.stop();
  }

  private readChapterContent() {
    if (!this.currentChapter || !this.chapterContent) return;
    
    // Extract text content from HTML
    const contentElement = this.chapterContent.nativeElement;
    const textContent = contentElement.textContent || '';
    
    if (!textContent.trim()) return;
    
    // Get text nodes and their boundaries for highlighting
    const textNodes: Node[] = [];
    const wordBoundaries: { node: Node, start: number, end: number }[] = [];
    let currentIndex = 0;
    
    this.collectTextNodes(contentElement, textNodes, wordBoundaries, currentIndex);
    
    // Start reading
    this.ttsService.speak(textContent, textNodes, wordBoundaries);
  }

   private collectTextNodes(
    element: Node, 
    textNodes: Node[], 
    wordBoundaries: any[], 
    currentIndex: number
  ): number {
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const text = node.textContent;
        textNodes.push(node);
        
        // Split text into words and record their boundaries
        const words = text.split(/(\s+)/);
        let wordStart = currentIndex;
        
        for (const word of words) {
          if (word.trim()) { // Only non-whitespace words
            wordBoundaries.push({
              node: node,
              start: wordStart,
              end: wordStart + word.length
            });
          }
          wordStart += word.length;
        }
        
        currentIndex += text.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        currentIndex = this.collectTextNodes(node, textNodes, wordBoundaries, currentIndex);
      }
    }
    
    return currentIndex;
  }




  loadCourseData(courseId: string) {
    this.isLoading = true;
    
    // Load course details
    this.courseService.getCourse(courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.loadChapters(courseId);
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.errorMessage = 'Failed to load course details';
        this.isLoading = false;
      }
    });
  }

  loadTestAttempts() {
    if (this.course && this.authService.isAuthenticated()) {
      this.courseService.getTestAttempts(this.course.id).subscribe({
        next: (attempts) => {
          this.testAttempts = attempts;
        },
        error: (error) => {
          console.error('Error loading test attempts:', error);
        }
      });
    }
  }

  loadChapters(courseId: string) {
    this.courseService.getChapters(courseId).subscribe({
      next: (chapters) => {
        this.chapters = chapters.sort((a, b) => a.order - b.order);
        this.loadEnrollmentData(courseId);
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.errorMessage = 'Failed to load course chapters';
        this.isLoading = false;
      }
    });
  }

  loadEnrollmentData(courseId: string) {
    this.courseService.getMyCourses().subscribe({
      next: (enrollments) => {
        this.enrollment = enrollments.find(e => e.courseId === courseId) || null;
        
        // Set current chapter based on progress
        if (this.enrollment && this.enrollment.completedChapters < this.chapters.length) {
          this.currentChapter = this.chapters[this.enrollment.completedChapters];
        } else if (this.chapters.length > 0) {
          this.currentChapter = this.chapters[0];
        }
        
        // Load test attempts if all chapters are completed
        if (this.checkIfAllChaptersCompleted()) {
          this.loadTestAttempts();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading enrollment data:', error);
        this.enrollment = null;
        this.currentChapter = this.chapters.length > 0 ? this.chapters[0] : null;
        this.isLoading = false;
      }
    });
  }

  async enrollInCourse() {
    if (this.course) {
      // Check if user is authenticated first
      if (!this.authService.isAuthenticated()) {
        const confirmed = await this.alertService.confirm('Please log in to enroll in courses. Would you like to go to the login page?');
        if (confirmed) {
          this.router.navigate(['/login']);
        }
        return;
      }

      this.courseService.enrollInCourse(this.course.id).subscribe({
        next: () => {
          this.loadEnrollmentData(this.course!.id);
          this.alertService.success('Successfully enrolled in the course!');
        },
        error: (error) => {
          console.error('Error enrolling in course:', error);
          if (error.status === 401) {
            this.alertService.error('Please log in to enroll in courses');
            this.router.navigate(['/login']);
          } else {
            this.alertService.error('Failed to enroll in the course. Please try again.');
          }
        }
      });
    }
  }

  async unenrollFromCourse() {
    if (this.course) {
      const confirmed = await this.alertService.confirm('Are you sure you want to unenroll from this course?');
      
      if (confirmed) {
        this.courseService.unenrollFromCourse(this.course.id).subscribe({
          next: () => {
            this.router.navigate(['/courses']);
            this.alertService.success('Successfully unenrolled from the course.');
          },
          error: (error) => {
            console.error('Error unenrolling from course:', error);
            this.alertService.error('Failed to unenroll from the course. Please try again.');
          }
        });
      }
    }
  }

   setCurrentChapter(chapter: Chapter) {
    this.ttsService.stop();
    this.currentChapter = chapter;
    
    setTimeout(() => {
      if (this.isPlaying) {
        this.readChapterContent();
      }
    }, 100);
  }

  isChapterCompleted(chapterIndex: number): boolean {
    return this.enrollment ? chapterIndex < this.enrollment.completedChapters : false;
  }

  isChapterCurrent(chapterIndex: number): boolean {
    return this.enrollment ? chapterIndex === this.enrollment.completedChapters : chapterIndex === 0;
  }

  isChapterLocked(chapterIndex: number): boolean {
    return this.enrollment ? chapterIndex > this.enrollment.completedChapters : chapterIndex > 0;
  }

  checkIfAllChaptersCompleted(): boolean {
    return this.enrollment ? 
      this.enrollment.completedChapters >= this.enrollment.totalChapters : 
      false;
  }

  loadTest() {
    if (this.course) {
      this.courseService.getTest(this.course.id).subscribe({
        next: (test) => {
          this.test = test;
          this.showTest = true;
        },
        error: (error) => {
          console.error('Error loading test:', error);
          // Test might not exist yet, which is fine
        }
      });
    }
  }

  onTestCompleted(testResult: any) {
    console.log('Test completed with result:', testResult);
    this.showTest = false;
    this.testResult = testResult;
    
    // Debug: Check the structure of the test result
    console.log('Test result structure:', JSON.stringify(testResult, null, 2));
    
    // Check if the user passed based on different possible property names
    const isPassed = this.determineIfPassed(testResult);
    const score = this.getScore(testResult);
    
    console.log('Determined passed status:', isPassed, 'Score:', score);
    
    if (isPassed) {
      // Generate certificate automatically
      this.courseService.generateCertificate(testResult.id).subscribe({
        next: (certificate) => {
          console.log('Certificate generated:', certificate);
          this.alertService.success(`Congratulations! You passed the test with ${score}% and earned a certificate!`);
          // Reload the page to show the certificate and updated test attempts
          this.loadCourseData(this.course!.id);
        },
        error: (error) => {
          console.error('Error generating certificate:', error);
          this.alertService.info(`Congratulations! You passed the test with ${score}%! (Certificate generation may take a moment)`);
          // Still reload to show the updated test attempts
          this.loadCourseData(this.course!.id);
        }
      });
    } else {
      this.alertService.warning(`You scored ${score}% but didn't pass the test. You can review the material and try again.`);
      // Reload to show the updated test attempts
      this.loadCourseData(this.course!.id);
    }
  }

  // Helper method to determine if the test was passed
  private determineIfPassed(testResult: any): boolean {
    // Check various possible property names for passed status
    if (testResult.isPassed !== undefined) return testResult.isPassed;
    if (testResult.passed !== undefined) return testResult.passed;
    if (testResult.isSuccessful !== undefined) return testResult.isSuccessful;
    
    // Check if score meets passing criteria
    const score = this.getScore(testResult);
    if (score !== undefined && this.test && this.test.passingScore) {
      return score >= this.test.passingScore;
    }
    
    // Default to false if we can't determine
    return false;
  }

  // Helper method to extract score from test result
  private getScore(testResult: any): number {
    // Check various possible property names for score
    if (testResult.score !== undefined) return testResult.score;
    if (testResult.percentage !== undefined) return testResult.percentage;
    if (testResult.correctAnswers !== undefined && testResult.totalQuestions !== undefined) {
      return (testResult.correctAnswers / testResult.totalQuestions) * 100;
    }
    
    // Default to 0 if we can't determine
    return 0;
  }

  startTest() {
    this.loadTest();
  }

  async markChapterComplete() {
    if (this.currentChapter) {
      // Check if user is authenticated first
      if (!this.authService.isAuthenticated()) {
        this.alertService.error('Please log in to mark chapters as complete');
        return;
      }

      // Assuming 30 minutes spent on this chapter
      const timeSpent = 30; // Total minutes
      
      this.courseService.markChapterComplete(this.currentChapter.id, timeSpent).subscribe({
        next: () => {
          // Reload enrollment data to update progress
          this.loadEnrollmentData(this.course!.id);
          
          // Check if all chapters are now completed
          if (this.checkIfAllChaptersCompleted()) {
            this.alertService.success('All chapters completed! You can now take the final test.');
            this.loadTest(); // Load the test automatically
          } else {
            this.alertService.success('Chapter marked as complete!');
          }
        },
        error: (error) => {
          console.error('Error marking chapter complete:', error);
          this.alertService.error('Failed to mark chapter as complete. Please try again.');
        }
      });
    }
  }
}