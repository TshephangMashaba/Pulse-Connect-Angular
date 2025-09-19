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
  
  // Direct mapping of course titles to specific health/medical images
  courseImageMap: {[key: string]: string} = {
    'HIV Awareness': 'https://images.pexels.com/photos/7155276/pexels-photo-7155276.jpeg', // Red ribbon for HIV awareness
    'Climate Change, Disasters, and Community Resilience': 'https://images.pexels.com/photos/7640744/pexels-photo-7640744.jpeg', // Community health
    'Diabetes Awareness': 'https://images.pexels.com/photos/4056725/pexels-photo-4056725.jpeg', // Blood sugar test
    'Community Safety, Violence Prevention, and Mental Wellbeing': 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg', // Community safety/mental health
    'Farm Safety and Occupational Health': 'https://images.pexels.com/photos/7366318/pexels-photo-7366318.jpeg', // Farm with medical symbol
    'Digital Safety': 'https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg', // Digital safety
    'Cancer Awareness': 'https://images.pexels.com/photos/5726708/pexels-photo-5726708.jpeg', // Cancer awareness ribbon
    'Tuberculosis Education': 'https://images.pexels.com/photos/7155279/pexels-photo-7155279.jpeg', // TB education with lungs visual
    'Birth Control Education': 'https://images.pexels.com/photos/7615478/pexels-photo-7615478.jpeg' // Birth control pills
  };

  defaultImage = 'https://images.pexels.com/photos/4167688/pexels-photo-4167688.jpeg'; // Generic medical image

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  // Simple algorithm to get course image based on exact title match
  getCourseImage(course: Course): string {
    if (course.thumbnailUrl) {
      return course.thumbnailUrl;
    }

    // Return the specific image for this course title if it exists
    if (this.courseImageMap[course.title]) {
      return this.courseImageMap[course.title];
    }
    
    // Fallback to default image
    return this.defaultImage;
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