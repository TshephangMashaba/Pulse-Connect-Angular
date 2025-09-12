import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service'; // Import the alert service

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

  constructor(
    private authService: AuthService, 
    private router: Router,
    private alertService: AlertService // Inject the alert service
  ) {}

  onLogin(loginForm: any) {
    this.submitted = true;
    
    // Stop if form is invalid
    if (loginForm.invalid) {
      this.alertService.error('Please fill in all required fields.');
      return;
    }

    this.isLoading = true;
    const { email, password } = this.userObj;
    
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Login successful:', response);
        
        this.alertService.success('Login successful! Welcome back.')
          .then(() => {
            this.router.navigate(['/my-dashboard']);
          });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login failed', err);
        
        // Handle different error scenarios
        let errorMessage = 'An unexpected error occurred. Please try again.';
        
        if (err.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (err.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        // Show alert with error message
        this.alertService.error(errorMessage);
      }
    });
  }
}