import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: false
})
export class ContactComponent {
  contact: ContactForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  };
  isLoading = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private authService: AuthService) {}

  submitContactForm() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Use the correct API URL from AuthService
    const apiUrl = `${this.authService.apiUrl}/api/Contact/submit`;
    
    console.log('Sending contact form to:', apiUrl);
    
    // Don't include auth headers for contact form since it's [AllowAnonymous]
    this.http.post<ContactResponse>(apiUrl, this.contact).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.resetForm();
        } else {
          this.errorMessage = response.message || 'Failed to send message. Please try again.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Contact form error:', err);
        
        // Handle different error scenarios
        if (err.error && err.error.errors) {
          this.errorMessage = err.error.errors.join(', ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          this.errorMessage = 'Failed to send message. Please try again.';
        }
        
        this.isLoading = false;
      }
    });
  }

  private resetForm() {
    this.contact = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      subject: '',
      message: ''
    };
    
    // Reset the form validation state
    if (typeof document !== 'undefined') {
      const form = document.querySelector('form');
      if (form) {
        form.reset();
      }
    }
  }

  // Helper method to clear messages
  clearError() {
    this.errorMessage = '';
  }

  clearSuccess() {
    this.successMessage = '';
  }
}