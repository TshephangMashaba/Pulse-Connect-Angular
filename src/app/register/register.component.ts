import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Custom validator for password confirmation
export function confirmPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: [''],
      dateOfBirth: ['', Validators.required],
      address: ['', Validators.required],
      race: ['', Validators.required],
      gender: ['', Validators.required]
    }, { validators: confirmPasswordValidator() });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Include confirmPassword in the data sent to the backend
      const formData = {
        ...this.registerForm.value,
        // Ensure DateOfBirth is in correct format (ISO string)
        dateOfBirth: this.formatDate(this.registerForm.get('dateOfBirth')?.value)
      };

      console.log('Sending data:', formData);

      this.http.post('https://localhost:7142/api/Account/register', formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          // Show success message and redirect to login
          alert('Registration successful! Please login to continue.');
          this.router.navigate(['/login']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  private formatDate(date: any): string {
    if (!date) return '';
    
    // If it's already a Date object
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    // If it's a string, convert to Date first
    const dateObj = new Date(date);
    return dateObj.toISOString();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Registration error:', error);
    
    if (error.status === 400) {
      // Handle 400 Bad Request errors
      if (error.error && typeof error.error === 'string') {
        // Simple string error message
        this.errorMessage = error.error;
      } else if (error.error && error.error.errors) {
        // Handle array of errors
        if (Array.isArray(error.error.errors)) {
          this.errorMessage = error.error.errors.join(', ');
        } else if (typeof error.error.errors === 'object') {
          // Handle object with error properties (ASP.NET ModelState)
          const errorMessages: string[] = [];
          for (const key in error.error.errors) {
            if (error.error.errors.hasOwnProperty(key)) {
              const messages = error.error.errors[key];
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else {
                errorMessages.push(messages);
              }
            }
          }
          this.errorMessage = errorMessages.join(', ');
        }
      } else if (error.error && error.error.errorMessage) {
        // Handle error message property
        this.errorMessage = error.error.errorMessage;
      } else {
        this.errorMessage = 'Registration failed. Please check your information and try again.';
      }
    } else if (error.status === 0) {
      // Network error
      this.errorMessage = 'Unable to connect to the server. Please check your connection.';
    } else {
      // Other server errors
      this.errorMessage = 'An unexpected error occurred. Please try again later.';
    }
  }

  // Helper method to check if a field has errors
  hasError(controlName: string, errorType: string): boolean {
    const control = this.registerForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  // Check if passwords match
  passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return password === confirmPassword;
  }
}