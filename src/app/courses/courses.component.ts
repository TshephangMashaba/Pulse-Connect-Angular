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

  // Direct mapping of course titles to specific health/medical images
  courseImageMap: {[key: string]: string} = {
    'HIV Awareness': 'https://images.pexels.com/photos/7155276/pexels-photo-7155276.jpeg',
    'Climate Change, Disasters, and Community Resilience': 'https://images.pexels.com/photos/7640744/pexels-photo-7640744.jpeg',
    'Diabetes Awareness': 'https://images.pexels.com/photos/4056725/pexels-photo-4056725.jpeg',
    'Community Safety, Violence Prevention, and Mental Wellbeing': 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
    'Farm Safety and Occupational Health': 'https://images.pexels.com/photos/7366318/pexels-photo-7366318.jpeg',
    'Digital Safety': 'https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg',
    'Cancer Awareness': 'https://images.pexels.com/photos/5726708/pexels-photo-5726708.jpeg',
    'Tuberculosis Education': 'https://images.pexels.com/photos/7155279/pexels-photo-7155279.jpeg',
    'Birth Control Education': 'https://images.pexels.com/photos/7615478/pexels-photo-7615478.jpeg'
  };

  defaultImage = 'https://images.pexels.com/photos/4167688/pexels-photo-4167688.jpeg';

  constructor(
    private courseService: CourseService,
    public authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) { }

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

  // Get course image by ID (for enrolled courses)
  getCourseImageById(courseId: string): string {
    const course = this.allCourses.find(c => c.id === courseId);
    if (course) {
      return this.getCourseImage(course);
    }
    return this.defaultImage;
  }

  // Get progress bar color class based on completion percentage
  getProgressColorClass(percentage: number): string {
    if (percentage < 25) {
      return 'bg-red-500';
    } else if (percentage < 50) {
      return 'bg-orange-500';
    } else if (percentage < 80) {
      return 'bg-green-500';
    } else if (percentage < 100) {
      return 'bg-green-600';
    } else {
      return 'bg-green-800';
    }
  }

  // In your CoursesComponent - update the loadCourses method:
loadCourses() {
  this.isLoading = true;
  this.errorMessage = '';
  
  console.log('🔍 CoursesComponent: Starting to load courses...');
  console.log('🔍 Is user authenticated?', this.authService.isAuthenticated());

  this.courseService.getCourses().subscribe({
    next: (courses) => {
      console.log('✅ CoursesComponent: Courses loaded successfully', courses);
      console.log('✅ Number of courses:', courses.length);
      this.allCourses = courses;
      
      // Only load enrolled courses if user is authenticated
      if (this.authService.isAuthenticated()) {
        console.log('🔍 User is authenticated, loading enrolled courses...');
        this.loadMyCourses();
      } else {
        console.log('🔍 User not authenticated, showing all courses only');
        this.isLoading = false; // Stop loading if not authenticated
      }
    },
    error: (error) => {
      console.error('❌ CoursesComponent: Error loading courses:', error);
      console.error('❌ Error status:', error.status);
      console.error('❌ Error message:', error.message);
      this.errorMessage = 'Failed to load courses. Please try again.';
      this.isLoading = false;
    }
  });
}

loadMyCourses() {
  console.log('🔍 Loading enrolled courses...');
  
  this.courseService.getMyCourses().subscribe({
    next: (enrollments) => {
      console.log('✅ Enrolled courses loaded:', enrollments);
      console.log('✅ Number of enrolled courses:', enrollments.length);
      this.myCourses = enrollments;
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error loading enrolled courses:', error);
      console.error('❌ Error status:', error.status);
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