import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { EmailService } from '../services/email.service';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
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

  constructor(private emailService: EmailService) {}

  async submitContactForm(form: NgForm) {
    if (this.isLoading || form.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = await this.emailService.sendContactEmail(this.contact);
      
      if (result.success) {
        this.successMessage = result.message;
        this.resetForm();
        form.resetForm(); // This clears form validation states
      } else {
        this.errorMessage = result.message;
      }
    } catch (error) {
      console.error('Contact form error:', error);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
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
  }

  clearError() {
    this.errorMessage = '';
  }

  clearSuccess() {
    this.successMessage = '';
  }
}