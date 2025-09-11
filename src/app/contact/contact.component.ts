import { Component, OnInit } from '@angular/core';
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

    this.http.post(`${this.authService.apiUrl}/api/Contact/submit`, this.contact, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage = 'Your message has been sent successfully!';
        this.contact = { firstName: '', lastName: '', email: '', phoneNumber: '', subject: '', message: '' };
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.errors?.join(', ') || 'Failed to send message. Please try again.';
        this.isLoading = false;
      }
    });
  }
}