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
  }

  console.log('Making request to:', `${this.authService.apiUrl}/api/Account/profile`);

  this.http.put(`${this.authService.apiUrl}/api/Account/profile`, formData, {
    headers: httpHeaders
  }).subscribe({
    next: (response: any) => {
      console.log('Success response:', response);
      this.successMessage = response.Message || 'Profile updated successfully';
      this.authService.refreshUserData().subscribe();
      this.selectedFile = null;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Full error response:', err);
      console.error('Error details:', err.error);
      
      // Extract validation errors from the response
      if (err.error && err.error.errors) {
        const validationErrors = err.error.errors;
        
        // Handle different error formats
        if (Array.isArray(validationErrors)) {
          this.errorMessage = validationErrors.join(', ');
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
          this.errorMessage = errorMessages.join(', ') || 'Validation failed';
        }
      } else if (err.error?.title) {
        this.errorMessage = err.error.title;
      } else if (err.error?.message) {
        this.errorMessage = err.error.message;
      } else if (typeof err.error === 'string') {
        this.errorMessage = err.error;
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