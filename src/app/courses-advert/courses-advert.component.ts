import { Component, OnInit } from '@angular/core';
import { Course, CourseService, Enrollment } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-courses-advert',
  templateUrl: './courses-advert.component.html',
  styleUrls: ['./courses-advert.component.css'],
  standalone: false
})
export class CoursesAdvertComponent implements OnInit {
  allCourses: Course[] = [];
  myCourses: Enrollment[] = [];
  isLoading = true;
  errorMessage = '';
  defaultCourseImage = '/assets/images/default-course.jpg';

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading = true;
    this.errorMessage = '';

    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        if (this.authService.isAuthenticated()) {
          this.loadMyCourses();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage = 'Failed to load courses. Please try again.';
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
        if (error.status === 401) {
          this.errorMessage = 'Please log in to view your enrollment status.';
        } else {
          this.errorMessage = 'Failed to load enrollment status.';
        }
        this.myCourses = [];
        this.isLoading = false;
      }
    });
  }

  enrollInCourse(courseId: string) {
    if (!this.authService.isAuthenticated()) {
      alert('Please log in to enroll in courses');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.courseService.enrollInCourse(courseId).subscribe({
      next: () => {
        this.loadCourses();
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
        this.isLoading = false;
      }
    });
  }

  viewCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  isEnrolled(courseId: string): boolean {
    return this.myCourses.some(enrollment => enrollment.courseId === courseId);
  }
}