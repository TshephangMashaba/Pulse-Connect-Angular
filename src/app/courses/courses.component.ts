// courses.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService, Course, Enrollment } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
  standalone: false
})
export class CoursesComponent implements OnInit {
  allCourses: Course[] = [];
  myCourses: Enrollment[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router,
     private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading = true;
    
    // Load all available courses
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        this.loadMyCourses();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage = 'Failed to load courses';
        this.isLoading = false;
      }
    });
  }

  loadMyCourses() {
    this.courseService.getMyCourses().subscribe({
      next: (enrollments) => {
        this.myCourses = enrollments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading my courses:', error);
        // Check if it's an authentication error
        if (error.status === 401) {
          this.errorMessage = 'Please log in to view your courses';
          // You might want to redirect to login page
          // this.router.navigate(['/login']);
        } else {
          this.errorMessage = 'Failed to load your courses';
        }
        this.myCourses = [];
        this.isLoading = false;
      }
    });
  }

  async enrollInCourse(courseId: string) {
    // Check if user is authenticated first
    if (!this.authService.isAuthenticated()) {
      const confirmed = await this.alertService.confirm('Please log in to enroll in courses. Would you like to go to the login page?');
      if (confirmed) {
        this.router.navigate(['/login']);
      }
      return;
    }

    this.courseService.enrollInCourse(courseId).subscribe({
      next: () => {
        // Refresh the courses list after enrollment
        this.loadCourses();
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

async unenrollFromCourse(courseId: string) {
    const confirmed = await this.alertService.confirm('Are you sure you want to unenroll from this course?');
    
    if (confirmed) {
      this.courseService.unenrollFromCourse(courseId).subscribe({
        next: () => {
          // Refresh the courses list after unenrollment
          this.loadCourses();
          this.alertService.success('Successfully unenrolled from the course.');
        },
        error: (error) => {
          console.error('Error unenrolling from course:', error);
          this.alertService.error('Failed to unenroll from the course. Please try again.');
        }
      });
    }
  }


  viewCourse(courseId: string) {
    // FIXED: Changed from '/courses' to '/course'
    this.router.navigate(['/course', courseId]);
  }

  continueLearning(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  isEnrolled(courseId: string): boolean {
    return this.myCourses.some(enrollment => enrollment.courseId === courseId);
  }

  getEnrollmentProgress(courseId: string): number {
    const enrollment = this.myCourses.find(e => e.courseId === courseId);
    return enrollment ? enrollment.progressPercentage : 0;
  }
}