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
  
  // Categorized stock images
  courseImageCategories = {
    health: [
      'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg', // Health worker
      'https://images.pexels.com/photos/4167544/pexels-photo-4167544.jpeg', // Medical equipment
      'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg', // Health checkup
      'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg', // Safety equipment
      'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg'  // First aid kit
    ],
    hygiene: [
      'https://images.pexels.com/photos/4167449/pexels-photo-4167449.jpeg', // Hand washing
      'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg', // Hygiene supplies
      'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg', // Clean environment
      'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg', // Sanitization
      'https://images.pexels.com/photos/4386324/pexels-photo-4386324.jpeg'  // Health monitoring
    ],
    rural: [
      'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg', // Rural farmland
      'https://images.pexels.com/photos/158251/forest-the-sun-morning-tucholskie-158251.jpeg', // Rural forest
      'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg', // Country road
      'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg', // Rural village
      'https://images.pexels.com/photos/325044/pexels-photo-325044.jpeg'  // Farm fields
    ],
    education: [
      'https://images.pexels.com/photos/4386421/pexels-photo-4386421.jpeg', // Safety training
      'https://images.pexels.com/photos/4167688/pexels-photo-4167688.jpeg', // Health education
      'https://images.pexels.com/photos/4386295/pexels-photo-4386295.jpeg', // Hygiene practice
      'https://images.pexels.com/photos/371589/pexels-photo-371589.jpeg',  // Rural landscape
      'https://images.pexels.com/photos/247676/pexels-photo-247676.jpeg'   // Agricultural field
    ]
  };

  defaultImage = 'https://images.pexels.com/photos/4167688/pexels-photo-4167688.jpeg'; // Generic education image

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  // Algorithm to match course content with appropriate images
  getCourseImage(course: Course): string {
    if (course.thumbnailUrl) {
      return course.thumbnailUrl;
    }

    const title = course.title.toLowerCase();
    const description = course.description.toLowerCase();
    
    // Define keywords for each category
    const healthKeywords = ['health', 'medical', 'medicine', 'doctor', 'nurse', 'patient', 'treatment', 'care', 'first aid'];
    const hygieneKeywords = ['hygiene', 'clean', 'sanitation', 'wash', 'handwashing', 'sanitize', 'germ', 'bacteria'];
    const ruralKeywords = ['rural', 'village', 'farm', 'agriculture', 'community', 'local', 'countryside'];
    const educationKeywords = ['education', 'learn', 'training', 'teach', 'course', 'lesson', 'study', 'certificate'];

    // Score each category based on keyword matches
    const scores = {
      health: this.calculateMatchScore(title + description, healthKeywords),
      hygiene: this.calculateMatchScore(title + description, hygieneKeywords),
      rural: this.calculateMatchScore(title + description, ruralKeywords),
      education: this.calculateMatchScore(title + description, educationKeywords)
    };

    // Find the category with the highest score
    let bestCategory = 'education'; // Default category
    let highestScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }

    // If no strong match, use default image
    if (highestScore === 0) {
      return this.defaultImage;
    }

    // Select a random image from the best matching category
    const categoryImages = this.courseImageCategories[bestCategory as keyof typeof this.courseImageCategories];
    const randomIndex = Math.floor(Math.random() * categoryImages.length);
    
    return categoryImages[randomIndex];
  }

  // Helper method to calculate match score
  private calculateMatchScore(text: string, keywords: string[]): number {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1;
        // Additional points for multiple occurrences
        const occurrences = (text.match(new RegExp(keyword, 'g')) || []).length;
        score += (occurrences - 1) * 0.5;
      }
    });
    return score;
  }

  // Alternative: Simple keyword-based approach (faster but less sophisticated)
  getCourseImageSimple(course: Course): string {
    if (course.thumbnailUrl) {
      return course.thumbnailUrl;
    }

    const text = (course.title + ' ' + course.description).toLowerCase();
    
    if (text.includes('health') || text.includes('medical') || text.includes('doctor')) {
      return this.getRandomImage('health');
    }
    if (text.includes('hygiene') || text.includes('clean') || text.includes('sanitation')) {
      return this.getRandomImage('hygiene');
    }
    if (text.includes('rural') || text.includes('farm') || text.includes('village')) {
      return this.getRandomImage('rural');
    }
    if (text.includes('education') || text.includes('training') || text.includes('learn')) {
      return this.getRandomImage('education');
    }
    
    return this.defaultImage;
  }

  private getRandomImage(category: keyof typeof this.courseImageCategories): string {
    const images = this.courseImageCategories[category];
    return images[Math.floor(Math.random() * images.length)];
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