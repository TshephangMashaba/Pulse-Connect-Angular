import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService, DEFAULT_AVATAR, User } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css'],
  standalone: false
})
export class ProfileSettingsComponent implements OnInit {
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
  errorMessage: string = '';
  successMessage: string = '';
  selectedFile: File | null = null;

  constructor(private authService: AuthService, private http: HttpClient) {}

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
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }
 updateProfile() {
  if (this.isLoading) return;
  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  console.log('=== FORM SUBMISSION DEBUG ===');
  console.log('Profile data:', this.profile);
  console.log('Selected file:', this.selectedFile);

  const formData = new FormData();
  
  // Add all fields including empty ones for optional fields
  formData.append('FirstName', this.profile.firstName.trim());
  formData.append('LastName', this.profile.lastName.trim());
  
  // Append optional fields only if they have values
  if (this.profile.phoneNumber && this.profile.phoneNumber.trim()) {
    formData.append('PhoneNumber', this.profile.phoneNumber.trim());
  }
  
  if (this.profile.dateOfBirth) {
    formData.append('DateOfBirth', this.profile.dateOfBirth);
  }
  
  if (this.profile.address && this.profile.address.trim()) {
    formData.append('Address', this.profile.address.trim());
  }
  
  if (this.profile.race && this.profile.race.trim()) {
    formData.append('Race', this.profile.race.trim());
  }
  
  if (this.profile.gender && this.profile.gender.trim()) {
    formData.append('Gender', this.profile.gender.trim());
  }
  
  if (this.selectedFile) {
    formData.append('ProfilePicture', this.selectedFile, this.selectedFile.name);
  }

  const token = this.authService.getValidToken();
  let httpHeaders = new HttpHeaders();
  
  if (token) {
    httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
  }

  this.http.put(`${this.authService.apiUrl}/api/Account/profile`, formData, {
    headers: httpHeaders
  }).subscribe({
    next: (response: any) => {
      console.log('Success response:', response);
      this.successMessage = response.Message || 'Profile updated successfully';
      
      // Update the profile picture URL if provided
      if (response.ProfilePictureUrl) {
        this.profile.profilePicture = response.ProfilePictureUrl;
      }
      
      // Refresh user data
      this.authService.refreshUserData().subscribe();
      this.selectedFile = null;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Full error response:', err);
      console.error('Error details:', err.error);
      
      if (err.error && err.error.errors) {
        if (Array.isArray(err.error.errors)) {
          this.errorMessage = err.error.errors.join(', ');
        } else if (typeof err.error.errors === 'object') {
          const errorMessages: string[] = [];
          for (const key in err.error.errors) {
            if (err.error.errors.hasOwnProperty(key)) {
              const messages = err.error.errors[key];
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else {
                errorMessages.push(messages);
              }
            }
          }
          this.errorMessage = errorMessages.join(', ');
        }
      } else if (err.error?.message) {
        this.errorMessage = err.error.message;
      } else {
        this.errorMessage = 'Failed to update profile. Please try again.';
      }
      
      this.isLoading = false;
    }
  });
}

  changePassword() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password.newPassword !== this.password.confirmNewPassword) {
      this.errorMessage = 'New password and confirmation do not match';
      this.isLoading = false;
      return;
    }

    this.authService.changePassword({
      currentPassword: this.password.currentPassword,
      newPassword: this.password.newPassword,
      confirmNewPassword: this.password.confirmNewPassword
    }).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully';
        this.password = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
        this.isLoading = false;
      },
error: (err) => {
  console.error('Full error response:', err);
  console.error('Error details:', err.error);
  
  // Handle different error response formats
  if (err.error?.errors && Array.isArray(err.error.errors)) {
    this.errorMessage = err.error.errors.join(', ');
  } else if (err.error?.message) {
    this.errorMessage = err.error.message;
  } else if (typeof err.error === 'string') {
    this.errorMessage = err.error;
  } else if (err.message) {
    this.errorMessage = err.message;
  } else {
    this.errorMessage = 'Failed to update profile. Please try again.';
  }
  this.isLoading = false;
}
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        this.errorMessage = 'Invalid file type. Only JPG, PNG, and GIF are allowed.';
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (5MB)
      if (this.selectedFile.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size too large. Maximum size is 5MB.';
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
}