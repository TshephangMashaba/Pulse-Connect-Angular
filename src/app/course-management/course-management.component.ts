import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service'; // Import the alert service

// Interfaces (unchanged)
export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  thumbnailUrl: string;
  estimatedDuration: number;
  createdDate: Date;
  updatedDate: Date;
  chapterCount: number;
  enrollmentCount: number;
  status?: string;
  category?: string;
}

export interface CreateTestBasicDTO {
  title: string;
  description: string;
  passingScore: number;
}

export interface CreateCourseDTO {
  title: string;
  description: string;
  thumbnailUrl: string;
  estimatedDuration: number;
  category?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  mediaUrl: string;
  mediaType: string;
  courseId: string;
  order: number;
}

export interface CreateChapterDTO {
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  order?: number;
}

export interface CourseTest {
  id: string | null;
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  questions: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  questionText: string;
  order: number;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateTestDTO {
  title: string;
  description: string;
  passingScore: number;
  questions: CreateQuestionDTO[];
}

export interface CreateQuestionDTO {
  questionText: string;
  order: number;
  options: CreateOptionDTO[];
}

export interface CreateOptionDTO {
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  isCompleted: boolean;
  completionDate?: Date;
}

export interface EnrollmentDTO {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: Date;
  completionDate?: Date;
  isCompleted: boolean;
  completedChapters: number;
  totalChapters: number;
  progressPercentage: number;
}

export interface MarkChapterCompleteDTO {
  chapterId: string;
  timeSpent: number;
}

export interface SubmitTestDTO {
  answers: UserAnswerDTO[];
}

export interface UserAnswerDTO {
  questionId: string;
  selectedOptionId: string;
}

export interface TestAttempt {
  id: string;
  enrollmentId: string;
  testId: string;
  attemptDate: Date;
  score: number;
  isPassed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  userAnswers: UserAnswer[];
}

export interface UserAnswer {
  id: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  testAttemptId: string;
}

@Component({
  selector: 'app-course-management',
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css'],
  standalone: false
})
export class CourseManagementComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  searchTerm: string = '';
  selectedCourse: Course | null = null;
  selectedCourseChapters: Chapter[] = [];
  selectedCourseTest: CourseTest | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
 
  // Modal states
  showCourseModal = false;
  showChaptersModal = false;
  showQuizModal = false;
  activeTab = 'basic';
  currentPreviewUrl = '';
  
  // Form models
  courseForm: CreateCourseDTO = {
    title: '',
    description: '',
    thumbnailUrl: '',
    estimatedDuration: 0,
    category: 'Health'
  };

  showCreateTestModal = false;
  showAddQuestionsModal = false;
  testBasicForm: CreateTestBasicDTO = {
    title: '',
    description: '',
    passingScore: 70
  };

  chapterForm: CreateChapterDTO = {
    title: '',
    content: '',
    mediaUrl: '',
    mediaType: 'video'
  };

  testForm: CreateTestDTO = {
    title: '',
    description: '',
    passingScore: 70,
    questions: []
  };

  newQuestion: CreateQuestionDTO = {
    questionText: '',
    order: 0,
    options: []
  };

  newOption: CreateOptionDTO = {
    optionText: '',
    isCorrect: false,
    order: 0
  };

  selectedFile: File | null = null;
  uploadProgress = 0;
  isUploading = false;
  selectedChapterForEdit: Chapter | null = null;
  private objectUrls: string[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private alertService: AlertService // Inject the alert service
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getValidToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Course Management
loadCourses(): void {
  this.isLoading = true;
  this.http.get<Course[]>('https://localhost:7142/api/course', {
    headers: this.getAuthHeaders()
  }).subscribe({
    next: (courses) => {
      this.courses = courses;
      this.filteredCourses = courses;
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading courses:', error);
      this.errorMessage = 'Failed to load courses';
      this.isLoading = false;
      // Don't show alert for initialization errors, just set errorMessage
      // Users can see the error in the UI without a modal
    }
  });
}
  filterCourses(): void {
    if (!this.searchTerm) {
      this.filteredCourses = this.courses;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCourses = this.courses.filter(course =>
      course.title.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term) ||
      course.instructorName.toLowerCase().includes(term)
    );
  }

  createCourse(): void {
    this.isLoading = true;
    this.http.post<Course>('https://localhost:7142/api/course', this.courseForm, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (course) => {
        this.courses.push(course);
        this.filteredCourses = this.courses;
        this.showCourseModal = false;
        this.resetCourseForm();
        this.successMessage = 'Course created successfully!';
        this.isLoading = false;
        this.alertService.success('Course created successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error creating course:', error);
        this.errorMessage = 'Failed to create course';
        this.isLoading = false;
        this.alertService.error('Failed to create course. Please try again.');
      }
    });
  }

  updateCourse(courseId: string): void {
    this.isLoading = true;
    this.http.put(`https://localhost:7142/api/course/${courseId}`, this.courseForm, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.loadCourses();
        this.showCourseModal = false;
        this.successMessage = 'Course updated successfully!';
        this.isLoading = false;
        this.alertService.success('Course updated successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating course:', error);
        this.errorMessage = 'Failed to update course';
        this.isLoading = false;
        this.alertService.error('Failed to update course. Please try again.');
      }
    });
  }
async deleteCourse(courseId: string): Promise<void> {
  const confirmed = await this.alertService.confirm('Are you sure you want to delete this course? This action cannot be undone.');
  
  if (!confirmed) {
    return;
  }

  this.isLoading = true;
  this.http.delete(`https://localhost:7142/api/course/${courseId}`, {
    headers: this.getAuthHeaders()
  }).subscribe({
    next: () => {
      this.courses = this.courses.filter(c => c.id !== courseId);
      this.filteredCourses = this.filteredCourses.filter(c => c.id !== courseId);
      this.isLoading = false;
      this.alertService.success('Course deleted successfully!');
    },
    error: (error) => {
      console.error('Error deleting course:', error);
      this.isLoading = false;
      this.alertService.error('Failed to delete course. Please try again.');
    }
  });
}
  // Chapter Management
  loadChapters(courseId: string): void {
    this.isLoading = true;
    this.http.get<Chapter[]>(`https://localhost:7142/api/course/${courseId}/chapters`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (chapters) => {
        this.selectedCourseChapters = chapters;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.errorMessage = 'Failed to load chapters';
        this.isLoading = false;
        this.alertService.error('Failed to load chapters. Please try again.');
      }
    });
  }
  
  addChapter(courseId: string): void {
    this.isLoading = true;
    
    const formData = new FormData();
    formData.append('title', this.chapterForm.title);
    formData.append('content', this.chapterForm.content);
    
    // Only add mediaUrl if no file is selected
    if (!this.selectedFile && this.chapterForm.mediaUrl) {
      formData.append('mediaUrl', this.chapterForm.mediaUrl);
    }
    
    // MediaType will be auto-detected by backend if file is uploaded
    if (this.selectedFile) {
      formData.append('mediaFile', this.selectedFile);
      // Let backend auto-detect media type
    } else if (this.chapterForm.mediaType) {
      formData.append('mediaType', this.chapterForm.mediaType);
    }

    this.http.post<Chapter>(`https://localhost:7142/api/course/${courseId}/chapter`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getValidToken()}`
      })
    }).subscribe({
      next: (chapter) => {
        this.selectedCourseChapters.push(chapter);
        this.resetChapterForm();
        this.selectedFile = null;
        this.currentPreviewUrl = '';
        this.successMessage = 'Chapter added successfully!';
        this.isLoading = false;
        this.alertService.success('Chapter added successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error adding chapter:', error);
        if (error.error) {
          this.errorMessage = error.error.message || 'Failed to add chapter';
          this.alertService.error(this.errorMessage);
          // Log the full error for debugging
          console.log('Full error response:', error.error);
        } else {
          this.errorMessage = 'Failed to add chapter';
          this.alertService.error('Failed to add chapter. Please try again.');
        }
        this.isLoading = false;
      }
    });
  }

  editChapter(chapter: Chapter): void {
    this.selectedChapterForEdit = { ...chapter };
    this.chapterForm = {
      title: chapter.title,
      content: chapter.content,
      order: chapter.order,
      mediaUrl: chapter.mediaUrl,
      mediaType: chapter.mediaType
    };
  }

  cancelEditChapter(): void {
    this.selectedChapterForEdit = null;
    this.resetChapterForm();
  }

  updateChapter(): void {
    if (!this.selectedChapterForEdit || !this.selectedCourse) return;
    
    this.isLoading = true;
    this.http.put(`https://localhost:7142/api/course/${this.selectedCourse.id}/chapter/${this.selectedChapterForEdit.id}`, 
      this.chapterForm, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.loadChapters(this.selectedCourse!.id);
        this.selectedChapterForEdit = null;
        this.resetChapterForm();
        this.successMessage = 'Chapter updated successfully!';
        this.isLoading = false;
        this.alertService.success('Chapter updated successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating chapter:', error);
        this.errorMessage = 'Failed to update chapter';
        this.isLoading = false;
        this.alertService.error('Failed to update chapter. Please try again.');
      }
    });
  }

  async deleteChapter(chapterId: string): Promise<void> {
    const confirmed = await this.alertService.confirm('Are you sure you want to delete this chapter?');
    
    if (!confirmed) {
      return;
    }

    if (!this.selectedCourse) return;

    this.isLoading = true;
    this.http.delete(`https://localhost:7142/api/course/${this.selectedCourse.id}/chapter/${chapterId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.loadChapters(this.selectedCourse!.id);
        this.successMessage = 'Chapter deleted successfully!';
        this.isLoading = false;
        this.alertService.success('Chapter deleted successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error deleting chapter:', error);
        this.errorMessage = 'Failed to delete chapter. Make sure the backend supports this operation.';
        this.isLoading = false;
        this.alertService.error('Failed to delete chapter. Please try again.');
      }
    });
  }

  onFileSelected(event: any): void {
    // Clean up previous URLs
    this.cleanupObjectUrls();
    
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.chapterForm.mediaType = this.getMediaTypeFromFile(file);
      
      // Create the preview URL immediately and store it
      this.currentPreviewUrl = URL.createObjectURL(file);
      this.objectUrls.push(this.currentPreviewUrl);
    }
  }

  previewFile(file: File): void {
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      const previewUrl = e.target.result;
      
      // You can use this to show preview in your template
      this.showFilePreview(previewUrl, file.type);
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      reader.readAsDataURL(file);
    }
    // For other file types, you might show an icon preview
  }

  ngOnDestroy(): void {
    this.cleanupObjectUrls();
  }

  getFilePreviewUrl(): string {
    return this.currentPreviewUrl;
  }

  // Add method to clean up object URLs
  cleanupObjectUrls(): void {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.currentPreviewUrl = '';
  }

  showFilePreview(previewUrl: string, fileType: string): void {
    // You can implement preview logic here
    // For example, store the preview URL for template use
    console.log('Preview URL:', previewUrl);
    console.log('File Type:', fileType);
  }

  // Auto-detect media type from file
  getMediaTypeFromFile(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'wmv':
      case 'webm':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return 'audio';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'image';
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return 'document';
      default:
        return 'file';
    }
  }

  addOptionToNewQuestion(): void {
    if (this.newOption.optionText.trim()) {
      if (!this.newQuestion.options) {
        this.newQuestion.options = [];
      }
      
      this.newQuestion.options.push({
        optionText: this.newOption.optionText,
        isCorrect: this.newOption.isCorrect,
        order: this.newQuestion.options.length + 1
      });
      
      // Reset the option form but keep isCorrect state
      this.newOption.optionText = '';
      this.newOption.order = 0;
    }
  }

  removeNewOption(index: number): void {
    if (this.newQuestion.options && this.newQuestion.options.length > index) {
      this.newQuestion.options.splice(index, 1);
      // Reorder remaining options
      this.newQuestion.options.forEach((opt, i) => opt.order = i + 1);
    }
  }

  // Update your loadTest method
  loadTest(courseId: string): void {
    this.isLoading = true;
    this.http.get<any>(`https://localhost:7142/api/course/${courseId}/test`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        console.log('Test loaded:', response);
        
        this.selectedCourseTest = {
          id: response.id,
          courseId: response.courseId,
          title: response.title,
          description: response.description,
          passingScore: response.passingScore,
          questions: response.questions || []
        };
        
        // If test exists with no questions, it's a new test
        if (response.id && (!response.questions || response.questions.length === 0)) {
          this.showCreateTestModal = true;
        } else if (response.id) {
          // Populate form with existing test data
          this.testForm = {
            title: response.title,
            description: response.description,
            passingScore: response.passingScore,
            questions: response.questions
          };
          this.showAddQuestionsModal = true;
        } else {
          // No test exists yet
          this.selectedCourseTest = null;
          this.showCreateTestModal = true;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading test:', error);
        
        if (error.status === 500) {
          this.errorMessage = 'Server error loading test. Please check backend logs.';
          this.alertService.error('Server error loading test. Please check backend logs.');
        } else {
          this.errorMessage = 'Failed to load test';
          this.alertService.error('Failed to load test. Please try again.');
        }
        
        this.isLoading = false;
      }
    });
  }

  createTest(courseId: string): void {
    // Validate the test
    if (this.testForm.questions.length === 0) {
      this.errorMessage = 'Please add at least one question to the quiz';
      this.alertService.error('Please add at least one question to the quiz');
      return;
    }

    // Validate each question has exactly one correct answer
    for (const question of this.testForm.questions) {
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        this.errorMessage = `Question "${question.questionText}" must have exactly one correct answer`;
        this.alertService.error(`Question "${question.questionText}" must have exactly one correct answer`);
        return;
      }
    }

    this.isLoading = true;
    this.http.post<CourseTest>(`https://localhost:7142/api/course/${courseId}/test`, this.testForm, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (test) => {
        this.selectedCourseTest = test;
        this.resetTestForm();
        this.resetNewQuestionForm();
        this.successMessage = 'Test created successfully!';
        this.isLoading = false;
        this.alertService.success('Test created successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error creating test:', error);
        this.errorMessage = 'Failed to create test. Please try again.';
        this.isLoading = false;
        this.alertService.error('Failed to create test. Please try again.');
      }
    });
  }

  addQuestionsToTest(courseId: string): void {
    if (!this.selectedCourseTest) return;
    
    this.isLoading = true;
    this.http.post<any>(`https://localhost:7142/api/course/${courseId}/test/questions`, this.testForm.questions, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        // Update the test with the response data
        this.selectedCourseTest = {
          id: response.id,
          courseId: response.courseId,
          title: response.title,
          description: response.description,
          passingScore: response.passingScore,
          questions: response.questions || []
        };
        
        this.testForm.questions = response.questions || [];
        
        this.successMessage = 'Questions added successfully!';
        this.isLoading = false;
        this.alertService.success('Questions added successfully!');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error adding questions:', error);
        this.errorMessage = 'Failed to add questions';
        this.isLoading = false;
        this.alertService.error('Failed to add questions. Please try again.');
      }
    });
  }

  viewQuestions(course: Course): void {
    this.selectedCourse = course;
    this.loadTest(course.id);
    this.showQuizModal = true;
    this.showAddQuestionsModal = true;
  }

  // Modal Management
  openCourseModal(course?: Course): void {
    if (course) {
      this.selectedCourse = course;
      this.courseForm = {
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        estimatedDuration: course.estimatedDuration,
        category: 'Health'
      };
    } else {
      this.selectedCourse = null;
      this.resetCourseForm();
    }
    this.showCourseModal = true;
    this.activeTab = 'basic';
  }

  openChaptersModal(course: Course): void {
    this.selectedCourse = course;
    this.loadChapters(course.id);
    this.showChaptersModal = true;
  }

  openQuizModal(course: Course): void {
    this.selectedCourse = course;
    this.loadTest(course.id); // This will now determine which modal to show
  }

  closeModals(): void {
    this.showCourseModal = false;
    this.showChaptersModal = false;
    this.showQuizModal = false;
    this.selectedCourse = null;
    this.selectedCourseChapters = [];
    this.selectedCourseTest = null;
  }

  // Form Helpers
  resetCourseForm(): void {
    this.courseForm = {
      title: '',
      description: '',
      thumbnailUrl: '',
      estimatedDuration: 0,
      category: 'Health'
    };
  }

  // Add this method to your CourseManagementComponent class
  setCorrectAnswer(questionIndex: number, optionIndex: number): void {
    const question = this.testForm.questions[questionIndex];
    if (question && question.options) {
      question.options.forEach((option, index) => {
        option.isCorrect = index === optionIndex;
      });
    }
  }

  resetChapterForm(): void {
    this.chapterForm = {
      title: '',
      content: '',
      order: this.selectedCourseChapters.length > 0 
        ? Math.max(...this.selectedCourseChapters.map(c => c.order)) + 1 
        : 1,
      mediaUrl: '',
      mediaType: 'video'
    };
  }

  resetTestForm(): void {
    this.testForm = {
      title: '',
      description: '',
      passingScore: 70,
      questions: []
    };
  }

  addQuestion(): void {
    if (this.newQuestion.questionText.trim()) {
      // Make sure the new question has options
      if (!this.newQuestion.options || this.newQuestion.options.length === 0) {
        this.errorMessage = 'Please add at least 2 options for this question';
        this.alertService.error('Please add at least 2 options for this question');
        return;
      }
      
      // Count correct answers
      const correctOptions = this.newQuestion.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        this.errorMessage = 'Please select exactly one correct answer';
        this.alertService.error('Please select exactly one correct answer');
        return;
      }

      const newQuestion: CreateQuestionDTO = {
        questionText: this.newQuestion.questionText,
        order: this.testForm.questions.length + 1,
        options: [...this.newQuestion.options]
      };

      this.testForm.questions.push(newQuestion);
      
      // Reset the new question form
      this.resetNewQuestionForm();
      
      this.successMessage = 'Question added successfully!';
      this.alertService.success('Question added successfully!');
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  resetNewQuestionForm(): void {
    this.newQuestion = {
      questionText: '',
      order: 0,
      options: []
    };
    this.newOption = {
      optionText: '',
      isCorrect: false,
      order: 0
    };
  }

  addOption(): void {
    if (this.newOption.optionText.trim()) {
      // Add the option to the last question (the one being created)
      const lastQuestionIndex = this.testForm.questions.length - 1;
      if (lastQuestionIndex >= 0) {
        this.testForm.questions[lastQuestionIndex].options.push({
          ...this.newOption,
          order: this.testForm.questions[lastQuestionIndex].options.length + 1
        });
        this.newOption = {
          optionText: '',
          isCorrect: false,
          order: 0
        };
      }
    }
  }

  removeQuestion(index: number): void {
    this.testForm.questions.splice(index, 1);
    // Reorder questions
    this.testForm.questions.forEach((q, i) => q.order = i + 1);
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.testForm.questions[questionIndex].options.splice(optionIndex, 1);
    // Reorder options
    this.testForm.questions[questionIndex].options.forEach((o, i) => o.order = i + 1);
  }

  // Utility Methods
  getCourseStatus(course: Course): string {
    // Simple status logic - you can enhance this based on your business rules
    if (course.chapterCount === 0) return 'Draft';
    if (course.enrollmentCount > 10) return 'Popular';
    return 'Active';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'popular':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryIcon(category: string = 'Health'): string {
    switch (category.toLowerCase()) {
      case 'health':
        return 'fa-first-aid';
      case 'safety':
        return 'fa-shield-alt';
      case 'mental health':
        return 'fa-brain';
      default:
        return 'fa-book';
    }
  }

  getCategoryColor(category: string = 'Health'): string {
    switch (category.toLowerCase()) {
      case 'health':
        return 'bg-green-100 text-green-600';
      case 'safety':
        return 'bg-blue-100 text-blue-600';
      case 'mental health':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
  
  createTestBasic(courseId: string): void {
    this.isLoading = true;
    
    this.http.post<any>( // Use 'any' to handle the simplified response
      `https://localhost:7142/api/course/${courseId}/test/basic`, 
      this.testBasicForm, 
      {
        headers: this.getAuthHeaders()
      }
    ).subscribe({
      next: (response) => {
        // Map the response to our interface
        this.selectedCourseTest = {
          id: response.id,
          courseId: response.courseId,
          title: response.title,
          description: response.description,
          passingScore: response.passingScore,
          questions: []
        };
        
        this.showCreateTestModal = false;
        this.showAddQuestionsModal = true;
        this.resetTestForm();
        this.successMessage = 'Test created successfully! Now add questions.';
        this.isLoading = false;
        this.alertService.success('Test created successfully! Now add questions.');
      },
      error: (error) => {
        console.error('Error creating test:', error);
        this.errorMessage = 'Failed to create test';
        this.isLoading = false;
        this.alertService.error('Failed to create test. Please try again.');
      }
    });
  }

  openCreateTestModal(course: Course): void {
    this.selectedCourse = course;
    this.loadTest(course.id); // Check if test already exists
    this.showCreateTestModal = true;
  }

  // New method to open add questions modal
  openAddQuestionsModal(): void {
    if (this.selectedCourseTest) {
      this.showAddQuestionsModal = true;
      this.showCreateTestModal = false;
    }
  }
}