import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, map, Observable, of, Subject, tap } from 'rxjs';

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  q_Number?: string;
  email: string;
  profilePhoto?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  race?: string;
  gender?: string;
  role?: string;
  token?: string;
}

export interface UserRegistration {
  firstName?: string;
  lastName?: string;
  q_Number?: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePicturePath?: string;
  role?: string;
}



export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OnboardingResponse {
  id: string;
  fullName: string;
  idNumber: string;
  gender: string;
  race: string;
  province: string;
  city: string;
  suburb: string;
  streetAddress: string;
  submittedDate: string;
  idPhotoPath?: string;
  certifiedIdCopyPath?: string;
  proofOfRegistrationPath?: string;
  role?: string;
}

export const DEFAULT_AVATAR = '/default-profile.png';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public apiUrl = 'https://localhost:7142';
  public currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  public refreshOnboardingSubject = new Subject<void>();
  public refreshOnboarding$ = this.refreshOnboardingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private injector: Injector,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let user: User | null = null;

    if (isPlatformBrowser(this.platformId)) {
      try {
        const userData = this.safeGetItem('currentUser');
        const token = this.safeGetItem('token');
        user = userData ? JSON.parse(userData) : null;

        if (user && token && !user.token) {
          user.token = token;
        }
      } catch (e) {
        console.error('Error initializing user data:', e);
        user = null;
      }
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  private safeSetItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('Error setting localStorage item:', e);
      }
    }
  }

  private safeGetItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Error getting localStorage item:', e);
        return null;
      }
    }
    return null;
  }

  private safeRemoveItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing localStorage item:', e);
      }
    }
  }

  triggerOnboardingRefresh(): void {
    this.refreshOnboardingSubject.next();
  }

  public getAuthHeaders(): { [header: string]: string } {
    const token = this.currentUserValue?.token;
    const headers: { [header: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  register(user: UserRegistration): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Account/register`, user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Account/login`, credentials).pipe(
      tap((response: any) => {
        if (response.isSuccessful && response.token) {
          const userWithId = {
            ...response.user,
            id: response.user.id || response.user.userId || response.userId,
            token: response.token,
            role: response.user.roles?.[0] || ''
          };
          this.setCurrentUser(userWithId);
        }
      }),
      catchError(err => {
        console.error('Login failed', err);
        this.clearUserData();
        throw err;
      })
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Account/resend-otp`, { email }, { headers: this.getAuthHeaders() });
  }

  setCurrentUser(user: User): void {
    try {
      const token = user.token || this.safeGetItem('token') || undefined;
      const userWithToken = {
        ...user,
        token: token === null ? undefined : token,
        role: user.role || ''
      };

      console.log('🔧 setCurrentUser - Final user object:', userWithToken);

      this.safeSetItem('currentUser', JSON.stringify(userWithToken));
      this.currentUserSubject.next(userWithToken);
    } catch (e) {
      console.error('Failed to stringify user data', e);
    }
  }

  getValidToken(): string | null {
    const current = this.currentUserValue;
    if (current?.token) {
      console.log('🔑 Token from currentUser:', current.token.substring(0, 20) + '...');
      return current.token;
    }

    try {
      const localToken = this.safeGetItem('token');
      if (localToken) {
        console.log('🔑 Token from localStorage:', localToken.substring(0, 20) + '...');
        return localToken;
      }

      const userData = this.safeGetItem('currentUser');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed?.token) {
          console.log('🔑 Token from localStorage user object:', parsed.token.substring(0, 20) + '...');
          return parsed.token;
        }
      }
    } catch (e) {
      console.error('Error parsing token from localStorage', e);
    }

    console.log('🔑 No valid token found');
    return null;
  }

  isAuthenticated(): boolean {
    const currentUser = this.currentUserValue;
    const token = this.getValidToken();

    console.log('🔍 isAuthenticated check:');
    console.log('  - currentUser exists:', !!currentUser);
    console.log('  - token exists:', !!token);

    return !!(currentUser && token);
  }

  getCurrentUserId(): string {
    const user = this.currentUserValue;
    if (user) {
      if (user.id) {
        return user.id;
      }
      if (user.email) {
        return user.email;
      }
    }

    try {
      const userData = this.safeGetItem('currentUser');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return parsedUser?.id || parsedUser?.userId || parsedUser?.email || '';
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
    }

    return '';
  }

  getOnboardingDetails(userId: string): Observable<OnboardingResponse> {
    return this.http.get<OnboardingResponse>(`${this.apiUrl}/onboarding/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  resetPassword(data: ResetPasswordPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Account/reset-password`, data);
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  changePassword(data: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Account/change-password`, {
      CurrentPassword: data.currentPassword,
      NewPassword: data.newPassword,
      ConfirmNewPassword: data.confirmNewPassword
    }, { headers: this.getAuthHeaders() });
  }

  getUserFirstName(): string {
    const storedUser = this.getStoredUser();
    return storedUser?.firstName || 'User';
  }

  get currentAvatar$(): Observable<string> {
    return this.currentUser$.pipe(
      map((u: User | null) => u?.profilePhoto ?? DEFAULT_AVATAR)
    );
  }

  get currentDisplayName$(): Observable<string> {
    return this.currentUser$.pipe(
      map((u: User | null) => {
        if (!u) return 'User';
        const parts = [u.firstName, u.lastName].filter(n => !!n);
        return parts.length ? parts.join(' ') : 'User';
      })
    );
  }

  get currentUserRole$(): Observable<string> {
    return this.currentUser$.pipe(
      map((u: User | null) => u?.role ?? '')
    );
  }

  getCurrentUserRole(): string {
    return this.currentUserValue?.role || '';
  }

  private getStoredUser(): User | null {
    try {
      const userData = this.safeGetItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
      this.clearUserData();
      return null;
    }
  }

  logout(): Observable<any> {
    if (this.currentUserValue?.token) {
      return this.http.post(`${this.apiUrl}/api/Account/logout`, {}, {
        headers: this.getAuthHeaders()
      }).pipe(
        tap(() => {
          this.clearUserData();
        }),
        catchError((error) => {
          this.clearUserData();
          return of(null);
        })
      );
    }

    this.clearUserData();
    return of(null);
  }

  private ensureUserHasRole(): Promise<User> {
    return new Promise((resolve, reject) => {
      const user = this.currentUserValue;
      if (!user) {
        reject(new Error('No user logged in'));
        return;
      }

      if (user.role && user.role.trim() !== '') {
        resolve(user);
        return;
      }

      this.fetchUserData().subscribe({
        next: (updatedUser) => {
          if (!updatedUser.role) {
            console.warn('User role still not available after fetching user data');
          }
          resolve(updatedUser);
        },
        error: (err) => reject(err)
      });
    });
  }

  getCurrentUserWithRole(): Promise<User> {
    return this.ensureUserHasRole();
  }

  clearUserData(): void {
    this.safeRemoveItem('currentUser');
    this.safeRemoveItem('token');
    this.currentUserSubject.next(null);
  }

  getAllOnboardedUsers(): Observable<OnboardingResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OnboardingResponse[]>(`${this.apiUrl}/api/account/onboard`, {
      headers: headers
    });
  }

  refreshUserData(): Observable<User> {
    return this.http.get<{
      id?: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      address?: string;
      race?: string;
      gender?: string;
      profilePhoto?: string;
      qNumber?: string;
      role?: string;
    }>(`${this.apiUrl}/api/Account/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(apiUser => {
        console.log('=== API RESPONSE DEBUG ===');
        console.log('Raw API response:', apiUser);

        const userId = apiUser.id;
        if (!userId) {
          throw new Error('User ID not found in profile response');
        }

        let profilePhoto = apiUser.profilePhoto;
        if (profilePhoto) {
          if (!profilePhoto.startsWith('http') &&
              !profilePhoto.includes('null') &&
              !profilePhoto.includes('undefined')) {
            profilePhoto = profilePhoto.startsWith('/')
              ? `${this.apiUrl}${profilePhoto}`
              : `${this.apiUrl}/${profilePhoto}`;
          }
        } else {
          profilePhoto = DEFAULT_AVATAR;
        }

        const updatedUser: User = {
          id: userId,
          firstName: apiUser.firstName || '',
          lastName: apiUser.lastName || '',
          email: apiUser.email,
          q_Number: apiUser.qNumber,
          profilePhoto: profilePhoto,
          phoneNumber: apiUser.phoneNumber,
          dateOfBirth: apiUser.dateOfBirth,
          address: apiUser.address,
          race: apiUser.race,
          gender: apiUser.gender,
          token: this.currentUserValue?.token,
          role: apiUser.role || this.currentUserValue?.role || ''
        };

        console.log('Processed user object:', updatedUser);
        return updatedUser;
      }),
      tap(user => {
        if (user.id && user.email) {
          this.setCurrentUser(user);
        }
      }),
      catchError(error => {
        console.error('Profile refresh failed:', {
          status: error.status,
          message: error.message,
          response: error.error
        });
        return of(this.currentUserValue || {} as User);
      })
    );
  }

  fetchUserData(): Observable<User> {
    return this.refreshUserData();
  }

  ensureUserRoleIsLoaded(): Observable<User> {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }

    if (currentUser.role && currentUser.role.trim() !== '' && (currentUser.id || currentUser.email)) {
      return of(currentUser);
    }

    console.log('User role or ID missing, fetching user data...');
    return this.fetchUserData();
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role?.includes('Admin') || false;
  }
}