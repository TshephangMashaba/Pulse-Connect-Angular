// course.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Test {
  id: string;
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  questions: Question[];
}

export interface Question {
  id: string;
  questionText: string;
  order: number;
  options: Option[];
}

export interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface TestAttempt {
  id: string;
  enrollmentId: string;
  testId: string;
  attemptDate: string;
  score: number;
  isPassed: boolean;
  totalQuestions: number;
  correctAnswers: number;
}

export interface TestSubmission {
  answers: TestAnswer[];
}

export interface TestAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  thumbnailUrl: string;
  estimatedDuration: number;
  createdDate: string;
  updatedDate: string;
  chapterCount: number;
  enrollmentCount: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  completionDate: string;
  isCompleted: boolean;
  progressPercentage: number;
  completedChapters: number;
  totalChapters: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  mediaUrl: string;
  mediaType: string;
  courseId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'https://localhost:7142/api/course';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getValidToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all courses
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}`);
  }

  // Get a specific course
  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  // Get user's enrolled courses
  getMyCourses(): Observable<Enrollment[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Enrollment[]>(`${this.apiUrl}/my-courses`, { headers });
  }

  // Enroll in a course
  enrollInCourse(courseId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/enroll/${courseId}`, {}, { headers });
  }

  // Unenroll from a course
  unenrollFromCourse(courseId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/unenroll/${courseId}`, {}, { headers });
  }

  // Get course chapters
  getChapters(courseId: string): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.apiUrl}/${courseId}/chapters`);
  }

  // Get a specific chapter
  getChapter(courseId: string, chapterId: string): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.apiUrl}/${courseId}/chapter/${chapterId}`);
  }

// course.service.ts - Update the markChapterComplete method
markChapterComplete(chapterId: string, minutesSpent: number): Observable<any> {
  const headers = this.getAuthHeaders();
  
  // Convert minutes to TimeSpan format (HH:MM:SS)
  const hours = Math.floor(minutesSpent / 60);
  const minutes = minutesSpent % 60;
  const timeSpanString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  
  return this.http.post(`${this.apiUrl}/complete-chapter`, {
    chapterId,
    timeSpent: timeSpanString
  }, { headers });
}

 getTest(courseId: string): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/${courseId}/test`);
  }

// CORRECTED method in course.service.ts
submitTest(testData: any): Observable<any> {
  const headers = this.getAuthHeaders();
  return this.http.post<any>(
    `${this.apiUrl}/submit-test`, 
    testData, // Send the complete test data object
    { headers }
  );
}

  // Get user's test attempts for a course
  getTestAttempts(courseId: string): Observable<TestAttempt[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TestAttempt[]>(`${this.apiUrl}/${courseId}/test-attempts`, { headers });
  }

  // course.service.ts - Add these methods
// course.service.ts - Update the certificate methods
generateCertificate(testAttemptId: string): Observable<any> {
  const headers = this.getAuthHeaders();
  // CORRECT ENDPOINT: Use the certificates controller, not course
  return this.http.post(`https://localhost:7142/api/certificates/generate`, {
    testAttemptId: testAttemptId,
    sendEmail: true
  }, {
    headers: headers
  });
}



getCourseCertificates(courseId: string): Observable<any[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<any[]>(`https://localhost:7142/api/certificates/course/${courseId}`, {
    headers: headers
  });
}


}
