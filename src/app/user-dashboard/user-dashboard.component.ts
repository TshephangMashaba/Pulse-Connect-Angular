import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Badge, Certificate, CertificateService, CertificateStats } from '../services/certificate.service';

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
  
  // Certificate data
  certificates: Certificate[] = [];
  recentCertificates: Certificate[] = [];
  certificateStats: CertificateStats = {
    totalCertificates: 0,
    xpPoints: 0,
    badgesEarned: 0,
    totalBadges: 0
  };
  achievementBadges: Badge[] = [];
  
  // UI state properties
  isLoading = true;
  activeTab = 'overview';
  userName = 'User';
  userAvatar = '/default-profile.png';
  apiErrors: { [key: string]: string } = {};


  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private certificateService: CertificateService
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
    this.loadCertificates(),
    this.loadAchievementBadges(),
    this.loadCertificateStats(), 
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

   loadCertificates(): Promise<void> {
    return new Promise((resolve) => {
      this.certificateService.getMyCertificates().subscribe({
        next: (data) => {
          this.certificates = data;
          // Get the 3 most recent certificates
          this.recentCertificates = [...data]
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
            .slice(0, 3);
          resolve();
        },
        error: (error) => {
          console.warn('Certificates endpoint not available:', error);
          this.apiErrors['certificates'] = 'Certificates temporarily unavailable';
          resolve();
        }
      });
    });
  }
loadCertificateStats(): Promise<void> {
  return new Promise((resolve) => {
    this.certificateService.getCertificateStats().subscribe({
      next: (data) => {
        this.certificateStats = data;
        resolve();
      },
      error: (error) => {
        console.warn('Certificate stats endpoint not available:', error);
        // Set default stats based on certificates
        this.certificateStats = {
          totalCertificates: this.certificates.length,
          xpPoints: this.certificates.length * 250,
          badgesEarned: this.achievementBadges.filter(b => b.earned).length,
          totalBadges: this.achievementBadges.length > 0 ? this.achievementBadges.length : 8 // Default to 8 if no badges loaded
        };
        resolve();
      }
    });
  });
}

loadAchievementBadges(): Promise<void> {
  return new Promise((resolve) => {
    this.certificateService.getAchievements().subscribe({
      next: (data) => {
        this.achievementBadges = data.badges;
        // Update certificate stats with badge information
        this.certificateStats.badgesEarned = data.earnedCount;
        this.certificateStats.totalBadges = data.totalBadges;
        resolve();
      },
      error: (error) => {
        console.warn('Achievement badges endpoint not available:', error);
        // Load default badges if API fails
        this.loadDefaultBadges();
        // Update certificate stats with default badge information
        this.certificateStats.badgesEarned = this.achievementBadges.filter(b => b.earned).length;
        this.certificateStats.totalBadges = this.achievementBadges.length;
        resolve();
      }
    });
  });
}
private loadDefaultBadges(): void {
  this.achievementBadges = [
    {
      id: '1',
      name: 'Health Champion',
      description: 'Complete 3 courses',
      icon: '🏆',
      earned: this.certificates.length >= 3,
      progress: Math.min(this.certificates.length, 3),
      target: 3,
      category: 'completion'
    },
    {
      id: '2',
      name: 'Quick Learner',
      description: 'Finish a course in 1 day',
      icon: '⚡',
      earned: false,
      progress: 0,
      target: 1,
      category: 'speed'
    },
    {
      id: '3',
      name: 'Community Helper',
      description: '5 forum posts',
      icon: '💬',
      earned: false,
      progress: 0,
      target: 5,
      category: 'community'
    },
    {
      id: '4',
      name: 'Quiz Master',
      description: 'Score 100% on a quiz',
      icon: '🎯',
      earned: this.certificates.some(c => c.score === 100),
      progress: this.certificates.some(c => c.score === 100) ? 1 : 0,
      target: 1,
      category: 'performance'
    },
    {
      id: '5',
      name: 'Knowledge Seeker',
      description: 'Complete 5 courses',
      icon: '📚',
      earned: this.certificates.length >= 5,
      progress: Math.min(this.certificates.length, 5),
      target: 5,
      category: 'completion'
    },
    {
      id: '6',
      name: 'Health Advocate',
      description: 'Share 3 certificates',
      icon: '📤',
      earned: false,
      progress: 0,
      target: 3,
      category: 'sharing'
    },
    {
      id: '7',
      name: 'Certified Pro',
      description: 'Earn 10 certificates',
      icon: '⭐',
      earned: this.certificates.length >= 10,
      progress: Math.min(this.certificates.length, 10),
      target: 10,
      category: 'mastery'
    },
    {
      id: '8',
      name: 'Perfect Score',
      description: 'Get 100% on 3 different courses',
      icon: '💯',
      earned: this.certificates.filter(c => c.score === 100).length >= 3,
      progress: Math.min(this.certificates.filter(c => c.score === 100).length, 3),
      target: 3,
      category: 'excellence'
    }
  ];
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
    event.target.src = '/default-profile.png';
  }

    // Helper methods for certificate display
  getCertificateColor(index: number): string {
    const colors = ['green', 'blue', 'purple', 'yellow', 'indigo', 'pink'];
    return colors[index % colors.length];
  }

  getGradientClass(color: string): string {
    switch (color) {
      case 'green': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'blue': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'purple': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'yellow': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'indigo': return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      case 'pink': return 'bg-gradient-to-r from-pink-500 to-pink-600';
      default: return 'bg-gradient-to-r from-green-500 to-green-600';
    }
  }
  viewCertificate(certificate: Certificate): void {
   
    this.router.navigate(['/certificates']);
  }

  // Add this method to your UserDashboardComponent class
getCompletionRate(): number {
  if (this.certificateStats.totalBadges === 0) {
    return 0;
  }
  return Math.round((this.certificateStats.badgesEarned / this.certificateStats.totalBadges) * 100);
}
  
}

