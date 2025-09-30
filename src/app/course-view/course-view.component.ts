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
   isGenerating = false;

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
// In course-view.component.ts - simplified readChapterContent
// In course-view.component.ts - update the readChapterContent method
private readChapterContent() {
  if (!this.currentChapter || !this.chapterContent) {
    console.warn('No chapter content available for TTS');
    return;
  }
  
  // Get the HTML content directly from the chapter
  const htmlContent = this.currentChapter.content;
  
  if (!htmlContent || !htmlContent.trim()) {
    console.warn('Chapter content is empty');
    return;
  }
  
  console.log('Starting TTS for chapter:', this.currentChapter.title);
  
  // Use the HTML content directly - the service will extract text
  this.ttsService.speak(htmlContent, this.chapterContent.nativeElement);
}

// Add a test method to verify TTS
testTTS() {
  console.log('=== Testing TTS Functionality ===');
  
  if (!this.ttsService.isSupported()) {
    console.error('Speech Synthesis not supported in this browser');
    this.alertService.error('Text-to-speech is not supported in your browser');
    return;
  }
  
  // Test with simple text first
  const testText = 'Text to speech is working correctly. This is a test. If you can hear this, the TTS system is functioning properly.';
  this.ttsService.speak(testText);
  
  console.log('TTS test initiated');
  
  // Also test with actual chapter content if available
  setTimeout(() => {
    if (this.currentChapter?.content) {
      console.log('Now testing with actual chapter content...');
      // Don't auto-start, just log that it's ready
    }
  }, 3000);
}

// Add a method to check TTS status
checkTTSStatus() {
  console.log('=== TTS Status Check ===');
  console.log('TTS Supported:', this.ttsService.isSupported());
  console.log('Is Speaking:', this.isPlaying);
  console.log('Current Chapter:', this.currentChapter?.title);
  console.log('Chapter Content Available:', !!this.currentChapter?.content);
  console.log('Content Length:', this.currentChapter?.content?.length || 0);
  console.log('Available Voices:', this.ttsService.getVoices().length);
  
  if (this.ttsService.isSupported()) {
    this.alertService.info('TTS is supported and ready to use');
  } else {
    this.alertService.error('TTS not supported in this browser. Please use Chrome, Edge, or Safari.');
  }
}

// In course-view.component.ts
get isTTSSupported(): boolean {
  return this.ttsService.isSupported();
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

  // In course-view.component.ts - update unenrollFromCourse method
async unenrollFromCourse() {
  if (this.course) {
    const confirmed = await this.alertService.confirm(
      'Are you sure you want to unenroll from this course?'
    );
    
    if (confirmed) {
      this.isLoading = true;
      this.courseService.unenrollFromCourse(this.course.id).subscribe({
        next: () => {
          this.router.navigate(['/courses']);
          this.alertService.success('Successfully unenrolled from the course.');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error unenrolling from course:', error);
          this.alertService.error(error.message || 'Failed to unenroll from the course. Please try again.');
          this.isLoading = false;
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
  // In course-view.component.ts - FIX the onTestCompleted method
async onTestCompleted(testResult: any) {
  try {
    this.isLoading = true;
    
    console.log('Test result received:', testResult);
    
    // The testResult should already contain the full result from the backend
    // No need to submit again - just process the result
    
    this.showTest = false;
    this.testResult = testResult;

    if (testResult.isPassed) {
      // Show congratulations message
      this.alertService.success(testResult.message);
      
      // Generate certificate if passed
      try {
        const certificate = await this.courseService.generateCertificate(testResult.attemptId).toPromise();
        console.log('Certificate generated:', certificate);
        this.alertService.success('Certificate generated successfully!');
      } catch (certError) {
        console.error('Certificate generation error:', certError);
        // Don't show error to user - certificate generation is secondary
      }
    } else {
      this.alertService.warning(testResult.message);
    }

    // Reload test attempts
    this.loadTestAttempts();
    
  } catch (error) {
    console.error('Error processing test result:', error);
    this.alertService.error('Failed to process test result. Please try again.');
  } finally {
    this.isLoading = false;
  }
}


  // Helper method to extract score from test result
getScore(testResult: any): number {
  if (testResult.score !== undefined) return testResult.score;
  if (testResult.percentage !== undefined) return testResult.percentage;
  if (testResult.correctAnswers !== undefined && testResult.totalQuestions !== undefined) {
    return Math.round((testResult.correctAnswers / testResult.totalQuestions) * 100);
  }
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