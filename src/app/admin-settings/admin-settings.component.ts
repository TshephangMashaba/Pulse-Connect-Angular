import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService, DEFAULT_AVATAR, User } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertService } from '../services/alert.service';

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  race: string;
  gender: string;
  profilePicture?: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css'],
  standalone: false
})
export class AdminSettingsComponent implements OnInit {
  profile: Profile = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    race: '',
    gender: ''
  };
  password: PasswordChange = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };
  defaultAvatar = DEFAULT_AVATAR;
  isLoading = false;
  selectedFile: File | null = null;

  constructor(
    private authService: AuthService, 
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.authService.refreshUserData().subscribe({
      next: (user: User) => {
        this.profile = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          address: user.address || '',
          race: user.race || '',
          gender: user.gender || '',
          profilePicture: user.profilePhoto
        };
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.alertService.error('Failed to load profile. Please try again.', 'Profile Error');
      }
    });
  }

  async updateProfile() {
    if (this.isLoading) return;
    this.isLoading = true;

    console.log('=== ADMIN PROFILE SUBMISSION DEBUG ===');
    console.log('Profile data:', this.profile);
    console.log('Selected file:', this.selectedFile);

    const formData = new FormData();
    
    // Ensure we're adding non-empty values
    if (this.profile.firstName && this.profile.firstName.trim()) {
      formData.append('FirstName', this.profile.firstName.trim());
      console.log('Added FirstName:', this.profile.firstName.trim());
    }
    if (this.profile.lastName && this.profile.lastName.trim()) {
      formData.append('LastName', this.profile.lastName.trim());
      console.log('Added LastName:', this.profile.lastName.trim());
    }
    
    // Only append optional fields if they have values
    if (this.profile.phoneNumber && this.profile.phoneNumber.trim()) {
      formData.append('PhoneNumber', this.profile.phoneNumber.trim());
      console.log('Added PhoneNumber:', this.profile.phoneNumber.trim());
    }
    if (this.profile.dateOfBirth) {
      formData.append('DateOfBirth', this.profile.dateOfBirth);
      console.log('Added DateOfBirth:', this.profile.dateOfBirth);
    }
    if (this.profile.address && this.profile.address.trim()) {
      formData.append('Address', this.profile.address.trim());
      console.log('Added Address:', this.profile.address.trim());
    }
    if (this.profile.race && this.profile.race.trim()) {
      formData.append('Race', this.profile.race.trim());
      console.log('Added Race:', this.profile.race.trim());
    }
    if (this.profile.gender && this.profile.gender.trim()) {
      formData.append('Gender', this.profile.gender.trim());
      console.log('Added Gender:', this.profile.gender.trim());
    }
    
    if (this.selectedFile) {
      formData.append('ProfilePicture', this.selectedFile, this.selectedFile.name);
      console.log('Added ProfilePicture:', this.selectedFile.name, 'Size:', this.selectedFile.size);
    } else {
      console.log('No profile picture selected');
    }

    console.log('Final FormData entries:');
    for (let [key, value] of (formData as any).entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    // Create HttpHeaders object properly - don't use plain object
    const token = this.authService.getValidToken();
    let httpHeaders = new HttpHeaders();
    
    if (token) {
      httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
      console.log('Added Authorization header with token:', token.substring(0, 20) + '...');
    } else {
      console.error('No valid token found!');
      this.isLoading = false;
      await this.alertService.error('Authentication error. Please log in again.', 'Session Expired');
      return;
    }

    console.log('Making request to:', `${this.authService.apiUrl}/api/Account/profile`);

    this.http.put(`${this.authService.apiUrl}/api/Account/profile`, formData, {
      headers: httpHeaders
    }).subscribe({
      next: (response: any) => {
        console.log('Success response:', response);
        
        // Update the profile picture URL if provided
        if (response.ProfilePictureUrl) {
          this.profile.profilePicture = response.ProfilePictureUrl;
        }
        
        // Refresh user data
        this.authService.refreshUserData().subscribe();
        this.selectedFile = null;
        this.isLoading = false;
        
        this.alertService.success(
          response.Message || 'Profile updated successfully', 
          'Profile Updated'
        );
      },
      error: (err) => {
        console.error('Full error response:', err);
        console.error('Error details:', err.error);
        
        let errorMessage = 'Failed to update profile. Please try again.';
        
        // Extract validation errors from the response
        if (err.error && err.error.errors) {
          const validationErrors = err.error.errors;
          
          // Handle different error formats
          if (Array.isArray(validationErrors)) {
            errorMessage = validationErrors.join(', ');
          } else if (typeof validationErrors === 'object') {
            const errorMessages: string[] = [];
            for (const key in validationErrors) {
              if (validationErrors.hasOwnProperty(key)) {
                const messages = validationErrors[key];
                if (Array.isArray(messages)) {
                  errorMessages.push(...messages);
                } else {
                  errorMessages.push(messages);
                }
              }
            }
            errorMessage = errorMessages.join(', ') || 'Validation failed';
          }
        } else if (err.error?.title) {
          errorMessage = err.error.title;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        }
        
        this.isLoading = false;
        this.alertService.error(errorMessage, 'Update Failed');
      }
    });
  }

  async changePassword() {
    if (this.isLoading) return;
    this.isLoading = true;

    if (this.password.newPassword !== this.password.confirmNewPassword) {
      this.isLoading = false;
      await this.alertService.error('New password and confirmation do not match', 'Password Mismatch');
      return;
    }

    // Optional: Add password strength validation
    if (this.password.newPassword.length < 6) {
      this.isLoading = false;
      await this.alertService.error('Password must be at least 6 characters long', 'Weak Password');
      return;
    }

    this.authService.changePassword({
      currentPassword: this.password.currentPassword,
      newPassword: this.password.newPassword,
      confirmNewPassword: this.password.confirmNewPassword
    }).subscribe({
      next: async () => {
        this.password = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
        this.isLoading = false;
        
        await this.alertService.success('Password changed successfully', 'Password Updated');
      },
      error: (err) => {
        console.error('Full error response:', err);
        console.error('Error details:', err.error);
        
        let errorMessage = 'Failed to change password. Please try again.';
        
        // Handle different error response formats
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMessage = err.error.errors.join(', ');
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.isLoading = false;
        this.alertService.error(errorMessage, 'Password Change Failed');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        this.alertService.error(
          'Invalid file type. Only JPG, PNG, GIF, WEBP, and JFIF are allowed.', 
          'Invalid File Type'
        );
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (5MB)
      if (this.selectedFile.size > 5 * 1024 * 1024) {
        this.alertService.error(
          'File size too large. Maximum size is 5MB.', 
          'File Too Large'
        );
        this.selectedFile = null;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.profile.profilePicture = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Optional: Add confirmation for profile update
  async confirmProfileUpdate() {
    const confirmed = await this.alertService.confirm(
      'Are you sure you want to update your profile information?',
      'Confirm Profile Update'
    );
    
    if (confirmed) {
      this.updateProfile();
    }
  }

  // Optional: Add confirmation for password change
  async confirmPasswordChange() {
    const confirmed = await this.alertService.confirm(
      'Are you sure you want to change your password?',
      'Confirm Password Change'
    );
    
    if (confirmed) {
      this.changePassword();
    }
  }
}