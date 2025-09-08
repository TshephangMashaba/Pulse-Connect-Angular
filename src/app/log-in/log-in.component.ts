import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css'],
  standalone: false,
})
export class LogInComponent {
  userObj = {
    email: '',
    password: '',
  };
  
  submitted = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

onLogin(loginForm: any) {
  this.submitted = true;
  this.errorMessage = '';
  
  // Stop if form is invalid
  if (loginForm.invalid) {
    return;
  }

  this.isLoading = true;
  const { email, password } = this.userObj;
  
  this.authService.login({ email, password }).subscribe({
    next: (response) => {
      this.isLoading = false;
      console.log('Login successful:', response);
      
 
      this.router.navigate(['/my-dashboard']);
    },
    error: (err) => {
      this.isLoading = false;
      console.error('Login failed', err);
      
      // Handle different error scenarios
      if (err.status === 0) {
        this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.status === 401) {
        this.errorMessage = 'Invalid email or password.';
      } else if (err.status === 500) {
        this.errorMessage = 'Server error. Please try again later.';
      } else {
        this.errorMessage = 'An unexpected error occurred. Please try again.';
      }
    }
  });
}
}