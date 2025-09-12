import { Component, OnInit } from '@angular/core';
import { AuthService, DEFAULT_AVATAR, User } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

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

    const formData = new FormData();
    formData.append('FirstName', this.profile.firstName);
    formData.append('LastName', this.profile.lastName);
    formData.append('PhoneNumber', this.profile.phoneNumber);
    formData.append('DateOfBirth', this.profile.dateOfBirth);
    formData.append('Address', this.profile.address);
    formData.append('Race', this.profile.race);
    formData.append('Gender', this.profile.gender);
    if (this.selectedFile) {
      formData.append('ProfilePicture', this.selectedFile);
    }

    this.http.put(`${this.authService.apiUrl}/api/Account/profile`, formData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        this.successMessage = 'Profile updated successfully';
        this.authService.refreshUserData().subscribe();
        this.selectedFile = null;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.errors?.join(', ') || 'Failed to update profile';
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
        this.errorMessage = err.error?.errors?.join(', ') || 'Failed to change password';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profile.profilePicture = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}