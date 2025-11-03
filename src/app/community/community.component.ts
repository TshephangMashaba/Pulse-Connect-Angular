import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Interfaces
interface CreatePostDto {
  title: string;
  content: string;
  province?: string;
  type: string;
  topic?: string;
  isAnonymous: boolean;
  imageUrls?: string[]; 
}

interface PostImageDto {
  id: string;
  imageUrl: string;
  caption?: string;
  order: number;
}




interface PostDto {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  province?: string;
  type: string;
  topic?: string;
  isAnonymous: boolean;
  createdAt: Date;
  likes: number;
  views: number;
  commentCount: number;
  images: PostImageDto[]; 
}

interface CreateCommentDto {
  content: string;
  postId: string;
  parentCommentId?: string;
}

interface CommentDto {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  postId: string;
  parentCommentId?: string;
  createdAt: Date;
  likes: number;
  replyCount: number;
}

interface JoinProvinceDto {
  province: string;
}

interface ProvinceStatsDto {
  province: string;
  memberCount: number;
  postCount: number;
  activeDiscussions: number;
}

interface CommunityStats {
  totalMembers: number;
  activeDiscussions: number;
  totalPosts: number;
  answeredQuestions: number;
}

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css'],
  standalone: false
})
export class CommunityComponent implements OnInit {
  // Tabs
  activeTab = 'discussions';
  showProvinceView = false;
  selectedProvinceGroup: string = '';
  // UI state for guidelines modal
showGuidelinesModal = false;
  // Posts and data
  posts: PostDto[] = [];
  provincePosts: PostDto[] = [];
  filteredPosts: PostDto[] = [];
  selectedPost: PostDto | null = null;
  comments: CommentDto[] = [];
  provinceStats: ProvinceStatsDto[] = [];
  communityStats: CommunityStats = {
    totalMembers: 0,
    activeDiscussions: 0,
    totalPosts: 0,
    answeredQuestions: 0
  };
  
  availableProvinces: string[] = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"
];

userLikedPosts: Set<string> = new Set();
likeAnimations: Set<string> = new Set();


  // Filter options
  searchTerm = '';
  selectedTopic = '';
  selectedSort = 'Newest First';
  selectedProvince = 'All Provinces';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPostsCount = 0;
  selectedFiles: FileList | null = null;
previewUrls: string[] = [];
  // Forms
  newPost: CreatePostDto = {
    title: '',
    content: '',
    province: '',
    type: 'Discussion',
    topic: '',
    isAnonymous: false
  };
  newCommentContent = '';
  userJoinedProvinces: Set<string> = new Set();

  // UI states
  isLoading = false;
  showModal = false;
  showProvinceModal = false;
selectedImage: string | null = null;
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) { }

ngOnInit(): void {
  this.loadPosts();
  this.loadProvinceStats();
  this.loadCommunityStats();
  this.loadAvailableProvinces();
  
  if (this.isAuthenticated()) {
    this.loadUserJoinedProvinces();
  }
}

private getAuthHeaders(): HttpHeaders {
  const token = this.authService.getValidToken();
  console.log('🔑 Token in getAuthHeaders:', token ? token.substring(0, 20) + '...' : 'No token');
  
  let headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}
  // API Calls
  loadPosts(): void {
      this.isLoading = true;
  let params = new HttpParams()
    .set('page', this.currentPage.toString())
    .set('pageSize', this.pageSize.toString())
    .set('sortBy', this.getSortByParam());


    // Add filters if selected
    if (this.selectedTopic && this.selectedTopic !== 'All Topics') {
      params = params.set('topic', this.selectedTopic);
    }
    
    if (this.selectedProvince && this.selectedProvince !== 'All Provinces') {
      params = params.set('province', this.selectedProvince);
    }
    
    if (this.activeTab !== 'discussions') {
      params = params.set('type', this.getPostTypeFromTab());
    }

   this.http.get<PostDto[]>('https://pulse-connect-api.onrender.com/api/community/posts', { 
    params, 
    headers: this.getAuthHeaders(),
    observe: 'response' 
  })
    .pipe(
      catchError(error => {
        console.error('Error loading posts:', error);
        this.isLoading = false;
        return throwError(() => error);
      })
    )
    .subscribe(response => {
      this.isLoading = false;
      if (response.body) {
        this.posts = response.body;
        this.filteredPosts = this.posts;
        this.checkUserLikeStatus(); // Add this line
        
        // Get pagination headers
        const totalCount = response.headers.get('X-Total-Count');
        if (totalCount) {
          this.totalPostsCount = parseInt(totalCount, 10);
        }
      }
    });
}

  loadProvincePosts(province: string): void {
    this.isLoading = true;
    let params = new HttpParams()
      .set('province', province)
      .set('sortBy', 'newest');

    this.http.get<PostDto[]>('https://pulse-connect-api.onrender.com/api/community/posts', { 
      params, 
      headers: this.getAuthHeaders()
    })
      .pipe(
        catchError(error => {
          console.error('Error loading province posts:', error);
          this.isLoading = false;
          return throwError(() => error);
        })
      )
      .subscribe(posts => {
        this.isLoading = false;
        this.provincePosts = posts;
      });
  }
loadPostDetails(id: string): void {
  this.http.get<PostDto>(`https://pulse-connect-api.onrender.com/api/community/posts/${id}`, { 
    headers: this.getAuthHeaders() 
  })
    .pipe(
      catchError(error => {
        console.error('Error loading post details:', error);
        return throwError(() => error);
      })
    )
    .subscribe(post => {
      this.selectedPost = post;
      this.loadComments(id);
      
      // Check if user liked this post
      if (this.authService.isAuthenticated()) {
        this.http.get<boolean>(`https://pulse-connect-api.onrender.com/api/community/posts/${id}/userlike`, {
          headers: this.getAuthHeaders()
        }).subscribe({
          next: (userLiked) => {
            if (userLiked) {
              this.userLikedPosts.add(id);
            } else {
              this.userLikedPosts.delete(id);
            }
          },
          error: (error) => {
            console.error('Error checking like status:', error);
          }
        });
      }
    });
}
isProvinceJoined(province: string): boolean {
  return this.userJoinedProvinces.has(province);
}
loadUserJoinedProvinces(): void {
  if (!this.authService.isAuthenticated()) return;

  this.http.get<string[]>('https://pulse-connect-api.onrender.com/api/community/provinces/joined', { 
    headers: this.getAuthHeaders() 
  })
    .pipe(
      catchError(error => {
        console.error('Error loading joined provinces:', error);
        return throwError(() => error);
      })
    )
    .subscribe(provinces => {
      // Clear and repopulate the set
      this.userJoinedProvinces.clear();
      provinces.forEach(province => this.userJoinedProvinces.add(province));
    });
}

  loadComments(postId: string): void {
    this.http.get<CommentDto[]>(`https://pulse-connect-api.onrender.com/api/community/posts/${postId}/comments`, { 
      headers: this.getAuthHeaders() 
    })
      .pipe(
        catchError(error => {
          console.error('Error loading comments:', error);
          return throwError(() => error);
        })
      )
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  loadProvinceStats(): void {
    this.http.get<ProvinceStatsDto[]>('https://pulse-connect-api.onrender.com/api/community/provinces/stats', { 
      headers: this.getAuthHeaders() 
    })
      .pipe(
        catchError(error => {
          console.error('Error loading province stats:', error);
          return throwError(() => error);
        })
      )
      .subscribe(stats => {
        this.provinceStats = stats;
      });
  }

  loadCommunityStats(): void {
    this.http.get<CommunityStats>('https://pulse-connect-api.onrender.com/api/community/stats', { 
      headers: this.getAuthHeaders() 
    })
      .pipe(
        catchError(error => {
          console.error('Error loading community stats:', error);
          return throwError(() => error);
        })
      )
      .subscribe(stats => {
        this.communityStats = stats;
      });
  }

  createPost(): void {
  if (!this.authService.isAuthenticated()) {
    this.redirectToLogin();
    return;
  }

  // If we're in a province view, automatically set the province
  if (this.showProvinceView && this.selectedProvinceGroup) {
    this.newPost.province = this.selectedProvinceGroup;
  }

  const formData = new FormData();
  
  // Add post data
  formData.append('title', this.newPost.title);
  formData.append('content', this.newPost.content);
  formData.append('type', this.newPost.type);
  formData.append('isAnonymous', this.newPost.isAnonymous.toString());
  
  if (this.newPost.province) {
    formData.append('province', this.newPost.province);
  }
  
  if (this.newPost.topic) {
    formData.append('topic', this.newPost.topic);
  }

  // Add images if any
  if (this.selectedFiles && this.selectedFiles.length > 0) {
    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append('images', this.selectedFiles[i]);
    }
  }

  // Get the token from auth service
  const token = this.authService.getValidToken();
  
  // Create headers with ONLY Authorization (let browser set Content-Type for FormData)
  let headers = new HttpHeaders();
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  console.log('📤 Sending POST request with token:', token ? 'Yes' : 'No');
  console.log('📦 FormData entries:');
  for (let [key, value] of (formData as any).entries()) {
    console.log(`  ${key}:`, value);
  }

  this.http.post<PostDto>('https://pulse-connect-api.onrender.com/api/community/posts', formData, { 
    headers: headers 
  })
    .pipe(
      catchError(error => {
        console.error('❌ Error creating post:', error);
        if (error.status === 401) {
          console.log('🔐 Token might be expired or invalid');
          this.handleUnauthorizedError();
        }
        return throwError(() => error);
      })
    )
    .subscribe({
      next: (post) => {
        console.log('✅ Post created successfully:', post);
        if (this.showProvinceView) {
          this.provincePosts.unshift(post);
        } else {
          this.posts.unshift(post);
        }
        this.closeModal();
        this.resetNewPostForm();
        this.selectedFiles = null;
        this.previewUrls = [];
      },
      error: (error) => {
        console.error('❌ Failed to create post:', error);
      }
    });
}

 likePost(postId: string, event?: MouseEvent): void {
  if (!this.authService.isAuthenticated()) {
    this.redirectToLogin();
    return;
  }

  // Prevent double clicks
  if (this.likeAnimations.has(postId)) return;
  
  // Add animation class
  this.likeAnimations.add(postId);
  if (event) {
    const button = event.target as HTMLElement;
    button.classList.add('liking');
  }

  this.http.post(`https://pulse-connect-api.onrender.com/api/community/posts/${postId}/like`, {}, { 
    headers: this.getAuthHeaders() 
  })
    .pipe(
      catchError(error => {
        console.error('Error liking post:', error);
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        this.likeAnimations.delete(postId);
        return throwError(() => error);
      })
    )
    .subscribe((response: any) => {
      // Remove animation after a delay
      setTimeout(() => {
        this.likeAnimations.delete(postId);
        if (event) {
          const button = event.target as HTMLElement;
          button.classList.remove('liking');
        }
      }, 1000);

      // Update user liked status based on response
      if (response.userLiked) {
        this.userLikedPosts.add(postId);
      } else {
        this.userLikedPosts.delete(postId);
      }

      // Update the post in the appropriate list with the new like count
      if (this.showProvinceView) {
        const postIndex = this.provincePosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          this.provincePosts[postIndex].likes = response.likes;
        }
      } else {
        const postIndex = this.posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          this.posts[postIndex].likes = response.likes;
        }
      }
      
      if (this.selectedPost && this.selectedPost.id === postId) {
        this.selectedPost.likes = response.likes;
      }
    });
}

  createComment(comment: CreateCommentDto): void {
    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }

    this.http.post<CommentDto>('https://pulse-connect-api.onrender.com/api/community/comments', comment, { 
      headers: this.getAuthHeaders() 
    })
      .pipe(
        catchError(error => {
          console.error('Error creating comment:', error);
          if (error.status === 401) {
            this.handleUnauthorizedError();
          }
          return throwError(() => error);
        })
      )
      .subscribe(newComment => {
        this.comments.unshift(newComment);
        
        // Update comment count on the post
        if (this.selectedPost) {
          this.selectedPost.commentCount++;
        }
      });
  }

getProvinceStats(province: string): ProvinceStatsDto | undefined {
  return this.provinceStats.find(p => p.province === province);
}
joinProvince(province: string): void {
  if (!this.authService.isAuthenticated()) {
    this.redirectToLogin();
    return;
  }

  const joinDto = { province };

  this.http.post('https://pulse-connect-api.onrender.com/api/community/provinces/join', joinDto, {
    headers: this.getAuthHeaders()
  })
    .pipe(
      catchError(error => {
        console.error('Error joining province:', error);
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        return throwError(() => error);
      })
    )
    .subscribe({
      next: (response: any) => {
        console.log('Successfully joined province:', response);
        
        // Add to user's joined provinces
        this.userJoinedProvinces.add(province);
        
        // If we're not already in the province view, load it
        if (!this.showProvinceView) {
          this.showProvinceView = true;
          this.selectedProvinceGroup = province;
          this.loadProvincePosts(province);
        }
        
        // Reload province stats to update member counts
        this.loadProvinceStats();
      },
      error: (error) => {
        console.error('Failed to join province:', error);
        alert('Failed to join province. Please try again.');
      }
    });
}

// Add a method to leave a province
leaveProvince(province: string): void {
  if (!this.authService.isAuthenticated()) {
    this.redirectToLogin();
    return;
  }

  this.http.post('https://pulse-connect-api.onrender.com/api/community/provinces/leave', { province }, {
    headers: this.getAuthHeaders()
  })
    .pipe(
      catchError(error => {
        console.error('Error leaving province:', error);
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        return throwError(() => error);
      })
    )
    .subscribe({
      next: (response: any) => {
        console.log('Successfully left province:', response);
        
        // Remove from user's joined provinces
        this.userJoinedProvinces.delete(province);
        
        // If we're currently viewing this province, go back to main view
        if (this.showProvinceView && this.selectedProvinceGroup === province) {
          this.backToGroups();
        }
        
        // Reload province stats
        this.loadProvinceStats();
      },
      error: (error) => {
        console.error('Failed to leave province:', error);
        alert('Failed to leave province. Please try again.');
      }
    });
}


  // Helper methods
  private getSortByParam(): string {
    switch (this.selectedSort) {
      case 'Most Popular': return 'popular';
      case 'Oldest First': return 'oldest';
      default: return 'newest';
    }
  }

getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // If URL is already absolute, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  if (imageUrl.includes('://')) {
    return imageUrl;
  }
  
  return `https://pulse-connect-api.onrender.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}


handleImageError(event: any): void {
  event.target.style.display = 'none';
  // Show the fallback div
  const fallback = event.target.nextElementSibling;
  if (fallback && fallback.classList.contains('fallback-profile')) {
    fallback.style.display = 'flex';
  }
}

  private getPostTypeFromTab(): string {
    switch (this.activeTab) {
      case 'questions': return 'Question';
      case 'resources': return 'Resource';
      case 'events': return 'Event';
      default: return 'Discussion';
    }
  }

  // UI Methods
  switchTab(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.showProvinceView = false;
    this.selectedProvinceGroup = '';
    this.loadPosts();
  }

  viewProvinceGroup(province: string): void {
    this.showProvinceView = true;
    this.selectedProvinceGroup = province;
    this.loadProvincePosts(province);
  }

  backToGroups(): void {
    this.showProvinceView = false;
    this.selectedProvinceGroup = '';
    this.loadPosts();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPosts();
  }

uploadImages(files: FileList): void {
  const formData = new FormData();
  
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  
  this.http.post<string[]>('/api/upload/images', formData, {
    headers: this.getAuthHeaders()
  }).subscribe(imageUrls => {
    this.newPost.imageUrls = imageUrls;
  });
}

  resetNewPostForm(): void {
    this.newPost = {
      title: '',
      content: '',
      province: '',
      type: 'Discussion',
      topic: '',
      isAnonymous: false
    };
  }

  openModal(): void {
    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetNewPostForm();
  }

  openProvinceModal(): void {
    this.showProvinceModal = true;
  }

  closeProvinceModal(): void {
    this.showProvinceModal = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const modal = document.getElementById('newPostModal');
    if (modal && event.target === modal) {
      this.closeModal();
    }
    
    const provinceModal = document.getElementById('provinceModal');
    if (provinceModal && event.target === provinceModal) {
      this.closeProvinceModal();
    }
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage * this.pageSize < this.totalPostsCount) {
      this.currentPage++;
      this.loadPosts();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPosts();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPosts();
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalPostsCount / this.pageSize);
    const pages: number[] = [];
    
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  addComment(): void {
    if (!this.selectedPost || !this.newCommentContent.trim()) return;
    
    const comment: CreateCommentDto = {
      content: this.newCommentContent,
      postId: this.selectedPost.id
    };
    
    this.createComment(comment);
    this.newCommentContent = '';
  }

  redirectToLogin(): void {
    alert('Please log in to perform this action');
    this.router.navigate(['/login']);
  }

  handleUnauthorizedError(): void {
    alert('Your session has expired. Please log in again.');
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Authentication helper
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  onFileSelected(event: any): void {
  this.selectedFiles = event.target.files;
  this.previewUrls = [];
  
  if (this.selectedFiles) {
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i];
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
      };
      
      reader.readAsDataURL(file);
    }
  }
}

// Add file removal handler
removeFile(index: number): void {
  if (this.selectedFiles) {
    const filesArray = Array.from(this.selectedFiles);
    filesArray.splice(index, 1);
    
    // Create a new FileList (this is a bit hacky since FileList is read-only)
    const dataTransfer = new DataTransfer();
    filesArray.forEach(file => dataTransfer.items.add(file));
    this.selectedFiles = dataTransfer.files;
    
    this.previewUrls.splice(index, 1);
  }
}

openImageModal(imageUrl: string): void {
  this.selectedImage = this.getImageUrl(imageUrl);
}

closePostModal(): void {
  this.selectedPost = null;
  this.comments = [];
  this.newCommentContent = '';
}

loadAvailableProvinces(): void {
  // Use the API endpoint if available, otherwise use the hardcoded list
  this.http.get<string[]>('https://pulse-connect-api.onrender.com/api/community/provinces/available', { 
    headers: this.getAuthHeaders() 
  }).subscribe({
    next: (provinces) => {
      this.availableProvinces = provinces;
    },
    error: (error) => {
      console.error('Error loading available provinces, using hardcoded list', error);
      // Fall back to hardcoded list if API fails
      this.availableProvinces = [
        "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
        "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"
      ];
    }
  });
}

// Add keyboard event listener for closing modal with ESC
@HostListener('document:keydown.escape')
onEscapeKey(): void {
  this.selectedImage = null;
}

checkUserLikeStatus(): void {
  if (!this.authService.isAuthenticated()) return;

  this.posts.forEach(post => {
    this.http.get<boolean>(`https://pulse-connect-api.onrender.com/api/community/posts/${post.id}/userlike`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (userLiked) => {
        if (userLiked) {
          this.userLikedPosts.add(post.id);
        }
      },
      error: (error) => {
        console.error('Error checking like status:', error);
      }
    });
  });
}

// In your component
imageLoadingStates: { [key: string]: boolean } = {};

onImageLoad(imageUrl: string) {
  this.imageLoadingStates[imageUrl] = false;
}

onImageError(imageUrl: string) {
  this.imageLoadingStates[imageUrl] = false;
  // Handle error (e.g., show placeholder)
}

// Community Guidelines Modal methods
openGuidelinesModal(): void {
  this.showGuidelinesModal = true;
}

closeGuidelinesModal(): void {
  this.showGuidelinesModal = false;
}


}