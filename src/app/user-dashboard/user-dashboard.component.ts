import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';

// DTO Interfaces
interface DashboardStatsDTO {
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  totalCertificates: number;
  totalXpPoints: number;
  totalBadges: number;
  weeklyProgress: number;
  averageCompletionRate: number;
}

interface RecentActivityDTO {
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  courseId: string;
  courseTitle: string;
  isSuccess: boolean;
}

interface EnrollmentDTO {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: Date;
  completionDate: Date | null;
  isCompleted: boolean;
  progressPercentage: number;
  completedChapters: number;
  totalChapters: number;
}

interface AchievementsDTO {
  totalCertificates: number;
  perfectScores: number;
  coursesCompleted: number;
  chaptersCompleted: number;
  streakDays: number;
  totalLearningHours: number;
  badges: BadgeDTO[];
}

interface BadgeDTO {
  name: string;
  description: string;
  icon: string;
}

interface CourseDTO {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  thumbnailUrl: string;
  estimatedDuration: number;
  enrollmentCount: number;
  chapterCount: number;
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  standalone: false
})
export class UserDashboardComponent implements OnInit {
  // Data properties with default values
  dashboardStats: DashboardStatsDTO = {
    totalEnrollments: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalCertificates: 0,
    totalXpPoints: 0,
    totalBadges: 0,
    weeklyProgress: 0,
    averageCompletionRate: 0
  };
  
  recentActivities: RecentActivityDTO[] = [];
  myEnrollments: EnrollmentDTO[] = [];
  activeCourses: EnrollmentDTO[] = [];
  completedCourses: EnrollmentDTO[] = [];
  
  achievements: AchievementsDTO = {
    totalCertificates: 0,
    perfectScores: 0,
    coursesCompleted: 0,
    chaptersCompleted: 0,
    streakDays: 0,
    totalLearningHours: 0,
    badges: []
  };
  
  recommendedCourses: CourseDTO[] = [];
  
  // UI state properties
  isLoading = true;
  activeTab = 'overview';
  userName = 'User';
  userAvatar = 'assets/default-profile.png';
  apiErrors: { [key: string]: string } = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadAllData();
  }

  // Load user data from auth service
  private loadUserData(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User';
      this.userAvatar = currentUser.profilePhoto || 'assets/default-profile.png';
    }
  }

  // Get authentication headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getValidToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Load all data with error handling
  private loadAllData(): void {
    const requests = [
      this.loadDashboardStats(),
      this.loadRecentActivity(),
      this.loadMyEnrollments(),
      this.loadAchievements(),
      this.loadRecommendedCourses()
    ];

    // Use Promise.all to wait for all requests to complete
    Promise.all(requests).then(() => {
      this.isLoading = false;
    }).catch(() => {
      this.isLoading = false;
    });
  }

  // API Calls with improved error handling
  loadDashboardStats(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<DashboardStatsDTO>('https://localhost:7142/api/userdashboard/stats', { 
        headers: this.getAuthHeaders() 
      })
      .pipe(
        catchError(error => {
          console.warn('Dashboard stats endpoint not available or error:', error);
          this.apiErrors['stats'] = 'Dashboard statistics temporarily unavailable';
          return of(this.dashboardStats);
        })
      )
      .subscribe({
        next: (data) => {
          this.dashboardStats = data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadRecentActivity(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<RecentActivityDTO[]>('https://localhost:7142/api/userdashboard/recent-activity', { 
        headers: this.getAuthHeaders() 
      })
      .pipe(
        catchError(error => {
          console.warn('Recent activity endpoint not available:', error);
          this.apiErrors['recentActivity'] = 'Recent activity temporarily unavailable';
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.recentActivities = data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadMyEnrollments(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<EnrollmentDTO[]>('https://localhost:7142/api/course/my-enrollments', { 
        headers: this.getAuthHeaders() 
      })
      .pipe(
        catchError(error => {
          console.warn('My enrollments endpoint not available:', error);
          this.apiErrors['myEnrollments'] = 'Course progress temporarily unavailable';
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.myEnrollments = data;
          
          // Filter courses: active (not completed) and completed
          this.activeCourses = data.filter(course => 
            !course.isCompleted && course.progressPercentage < 100
          );
          
          this.completedCourses = data.filter(course => 
            course.isCompleted || course.progressPercentage >= 100
          );
          
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadAchievements(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<AchievementsDTO>('https://localhost:7142/api/userdashboard/achievements', { 
        headers: this.getAuthHeaders() 
      })
      .pipe(
        catchError(error => {
          console.warn('Achievements endpoint not available:', error);
          this.apiErrors['achievements'] = 'Achievements temporarily unavailable';
          return of(this.achievements);
        })
      )
      .subscribe({
        next: (data) => {
          this.achievements = data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadRecommendedCourses(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<CourseDTO[]>('https://localhost:7142/api/userdashboard/recommended-courses', { 
        headers: this.getAuthHeaders() 
      })
      .pipe(
        catchError(error => {
          console.warn('Recommended courses endpoint not available:', error);
          this.apiErrors['recommendedCourses'] = 'Recommended courses temporarily unavailable';
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.recommendedCourses = data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  // Tab navigation
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Format time for display
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  // Format date for display
  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  // Format date with time for display
  formatDateTime(date: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Calculate estimated time remaining
  calculateEstimatedTime(course: EnrollmentDTO): string {
    if (!course.totalChapters || course.totalChapters === 0) return 'N/A';
    
    const remainingChapters = course.totalChapters - course.completedChapters;
    
    // Assuming average of 30 minutes per chapter (you can adjust this)
    const avgTimePerChapter = 30; // minutes
    const remainingMinutes = remainingChapters * avgTimePerChapter;
    
    if (remainingMinutes < 60) {
      return `${remainingMinutes} minutes`;
    } else {
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  continueLearning(courseId: string): void {
    this.router.navigate(['/course', courseId]);
  }

  viewCompletedCourse(): void {
    // Navigate to the certificates page
    this.router.navigate(['/certificates']);
  }

  // Retry failed API calls
  retryApiCall(apiName: string): void {
    this.apiErrors[apiName] = '';
    
    switch(apiName) {
      case 'stats':
        this.loadDashboardStats();
        break;
      case 'recentActivity':
        this.loadRecentActivity();
        break;
      case 'myEnrollments':
        this.loadMyEnrollments();
        break;
      case 'achievements':
        this.loadAchievements();
        break;
      case 'recommendedCourses':
        this.loadRecommendedCourses();
        break;
    }
  }

  // Handle image errors
  onImageError(event: any): void {
    event.target.src = 'assets/default-profile.png';
  }
}