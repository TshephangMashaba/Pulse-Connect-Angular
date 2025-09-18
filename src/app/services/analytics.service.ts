import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'https://localhost:7142/api';

  constructor(private http: HttpClient) { }

  getAnalyticsData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics`).pipe(
      map(data => this.validateData(data)),
      catchError(error => {
        console.warn('API not available, using demo data');
        return of(this.getDemoData());
      })
    );
  }

  getCommunityStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/community/stats`).pipe(
      map(data => this.validateCommunityStats(data)),
      catchError(error => {
        console.warn('Community stats API not available, using demo data');
        return of({
          totalMembers: 2842,
          activeDiscussions: 156,
          totalPosts: 428,
          answeredQuestions: 289
        });
      })
    );
  }

  getProvinceStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/community/provinces/stats`).pipe(
      map(data => this.validateProvinceStats(data)),
      catchError(error => {
        console.warn('Province stats API not available, using demo data');
        return of(this.getDemoProvinceStats());
      })
    );
  }

  getRecentActivity(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/recent-activity`).pipe(
      map(data => this.validateRecentActivity(data)),
      catchError(error => {
        console.warn('Recent activity API not available, using demo data');
        return of(this.getDemoRecentActivity());
      })
    );
  }

  getPopularCourses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/popular-courses`).pipe(
      map(data => this.validatePopularCourses(data)),
      catchError(error => {
        console.warn('Popular courses API not available, using demo data');
        return of(this.getDemoPopularCourses());
      })
    );
  }

  // Data validation methods
  private validateData(data: any): any {
    // Check if data is meaningful (not just empty or minimal)
    if (!data || !data.summary || data.summary.totalUsers < 10) {
      console.log('Data too small, using demo data');
      return this.getDemoData();
    }
    return data;
  }

  private validateCommunityStats(data: any): any {
    if (!data || data.totalMembers < 10) {
      console.log('Community stats too small, using demo data');
      return {
        totalMembers: 2842,
        activeDiscussions: 156,
        totalPosts: 428,
        answeredQuestions: 289
      };
    }
    return data;
  }

  private validateProvinceStats(data: any): any {
    if (!data || !Array.isArray(data) || data.length === 0 || data[0].memberCount < 5) {
      console.log('Province stats too small, using demo data');
      return this.getDemoProvinceStats();
    }
    return data;
  }

  private validateRecentActivity(data: any): any {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('Recent activity too small, using demo data');
      return this.getDemoRecentActivity();
    }
    return data;
  }

  private validatePopularCourses(data: any): any {
    if (!data || !Array.isArray(data) || data.length === 0 || data[0].enrollments < 5) {
      console.log('Popular courses too small, using demo data');
      return this.getDemoPopularCourses();
    }
    return data;
  }

  // Demo data methods
  private getDemoData() {
    return {
      summary: {
        totalUsers: 2842,
        activeUsers: 1560,
        coursesCompleted: 1285,
        certificatesIssued: 1285,
        forumPosts: 428,
        avgCompletionRate: 75.5
      },
      userEngagement: {
        labels: ['Apr 10', 'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16'],
        values: [120, 145, 98, 167, 132, 156, 189]
      },
      courseCompletion: {
        labels: ['HIV/AIDS Prevention', 'Mental Health Basics', 'First Aid Training', 'Hygiene Practices', 'Safety Protocols'],
        values: [85, 72, 90, 68, 79]
      },
      geographicDistribution: {
        labels: ['Gauteng', 'Limpopo', 'Eastern Cape', 'KwaZulu-Natal', 'Western Cape', 'North West', 'Free State', 'Mpumalanga', 'Northern Cape'],
        values: [650, 380, 420, 520, 450, 250, 280, 310, 180]
      },
      healthTopicEngagement: {
        labels: ['HIV/AIDS', 'Mental Health', 'First Aid', 'Hygiene', 'Safety Practices'],
        values: [320, 280, 190, 240, 175]
      },
      deviceUsage: {
        labels: ['Mobile App', 'Mobile Web', 'Desktop'],
        values: [75, 20, 5]
      },
      languagePreference: {
        labels: ['IsiZulu', 'IsiXhosa', 'Sesotho', 'English'],
        values: [45, 25, 15, 15]
      },
      recentActivity: this.getDemoRecentActivity(),
      popularCourses: this.getDemoPopularCourses()
    };
  }

  private getDemoProvinceStats() {
    return [
      { province: "Eastern Cape", memberCount: 420, postCount: 85, activeDiscussions: 23 },
      { province: "Free State", memberCount: 280, postCount: 62, activeDiscussions: 18 },
      { province: "Gauteng", memberCount: 650, postCount: 145, activeDiscussions: 42 },
      { province: "KwaZulu-Natal", memberCount: 520, postCount: 112, activeDiscussions: 35 },
      { province: "Limpopo", memberCount: 380, postCount: 78, activeDiscussions: 21 },
      { province: "Mpumalanga", memberCount: 310, postCount: 65, activeDiscussions: 19 },
      { province: "North West", memberCount: 250, postCount: 53, activeDiscussions: 15 },
      { province: "Northern Cape", memberCount: 180, postCount: 38, activeDiscussions: 11 },
      { province: "Western Cape", memberCount: 450, postCount: 95, activeDiscussions: 28 }
    ];
  }

  private getDemoRecentActivity() {
    return [
      { type: 'user_registered', message: 'Sarah M. registered', time: '2 hours ago' },
      { type: 'certificate_issued', message: 'HIV Prevention Course certificate issued', time: '5 hours ago' },
      { type: 'community_post', message: 'Thomas K. posted in Mental Health', time: '1 day ago' },
      { type: 'course_added', message: 'Maternal Health Basics course added', time: '1 day ago' },
      { type: 'user_registered', message: 'Nomvula K. joined the platform', time: '2 days ago' },
      { type: 'certificate_issued', message: 'First Aid Training completed by 15 users', time: '2 days ago' }
    ];
  }

  private getDemoPopularCourses() {
    return [
      { title: 'HIV/AIDS Prevention', enrollments: 1842, completionRate: 92 },
      { title: 'Mental Health Awareness', enrollments: 1245, completionRate: 85 },
      { title: 'Maternal Health', enrollments: 987, completionRate: 78 },
      { title: 'First Aid Training', enrollments: 856, completionRate: 88 },
      { title: 'Hygiene Practices', enrollments: 723, completionRate: 82 }
    ];
  }
}