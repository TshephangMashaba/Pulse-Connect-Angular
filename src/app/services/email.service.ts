import { Injectable } from '@angular/core';
import emailjs from 'emailjs-com';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly serviceId = 'service_xtdxqap'; // Replace with your EmailJS Service ID
  private readonly templateId = 'template_11hslpi'; // Replace with your EmailJS Template ID
  private readonly publicKey = 'cQN93sl7PKupETMi4'; // Replace with your EmailJS Public Key

  constructor() {
    // Initialize EmailJS with your public key
    emailjs.init(this.publicKey);
  }

  async sendContactEmail(contactData: any): Promise<{ success: boolean; message: string }> {
    const templateParams = {
      from_name: `${contactData.firstName} ${contactData.lastName}`,
      from_email: contactData.email,
      phone_number: contactData.phoneNumber || 'Not provided',
      subject: contactData.subject,
      message: contactData.message,
      to_email: 'pulseconnecthub@gmail.com',
      reply_to: contactData.email,
      date: new Date().toLocaleString()
    };

    try {
      const response = await emailjs.send(this.serviceId, this.templateId, templateParams);
      console.log('Email sent successfully:', response);
      return { 
        success: true, 
        message: 'Message sent successfully! We will get back to you within 24 hours.' 
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { 
        success: false, 
        message: 'Failed to send message. Please try again or email us directly at pulseconnecthub@gmail.com.' 
      };
    }
  }
}