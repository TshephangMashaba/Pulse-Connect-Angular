// course-view.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, Course, Chapter, Enrollment } from '../services/course.service';
import { AuthService } from '../services/auth.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourseData(courseId);
    } else {
      this.errorMessage = 'Course ID not provided';
      this.isLoading = false;
    }
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



  enrollInCourse() {
    if (this.course) {
      // Check if user is authenticated first
      if (!this.authService.isAuthenticated()) {
        alert('Please log in to enroll in courses');
        this.router.navigate(['/login']);
        return;
      }

      this.courseService.enrollInCourse(this.course.id).subscribe({
        next: () => {
          this.loadEnrollmentData(this.course!.id);
          alert('Successfully enrolled in the course!');
        },
        error: (error) => {
          console.error('Error enrolling in course:', error);
          if (error.status === 401) {
            alert('Please log in to enroll in courses');
            this.router.navigate(['/login']);
          } else {
            alert('Failed to enroll in the course. Please try again.');
          }
        }
      });
    }
  }

  unenrollFromCourse() {
    if (this.course && confirm('Are you sure you want to unenroll from this course?')) {
      this.courseService.unenrollFromCourse(this.course.id).subscribe({
        next: () => {
          this.router.navigate(['/courses']);
          alert('Successfully unenrolled from the course.');
        },
        error: (error) => {
          console.error('Error unenrolling from course:', error);
          alert('Failed to unenroll from the course. Please try again.');
        }
      });
    }
  }

  setCurrentChapter(chapter: Chapter) {
    this.currentChapter = chapter;
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

   onTestCompleted(isPassed: boolean) {
    this.showTest = false;
    this.testResult = isPassed;
    
    if (isPassed) {
      alert('Congratulations! You passed the test and completed the course!');
      // You might want to mark the course as completed here
    } else {
      alert('You didn\'t pass the test. You can review the material and try again.');
    }
  }

  startTest() {
    this.loadTest();
  }

  markChapterComplete() {
    if (this.currentChapter) {
      // Check if user is authenticated first
      if (!this.authService.isAuthenticated()) {
        alert('Please log in to mark chapters as complete');
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
            alert('All chapters completed! You can now take the final test.');
            this.loadTest(); // Load the test automatically
          } else {
            alert('Chapter marked as complete!');
          }
        },
        error: (error) => {
          console.error('Error marking chapter complete:', error);
          alert('Failed to mark chapter as complete. Please try again.');
        }
      });
    }
  }
}

