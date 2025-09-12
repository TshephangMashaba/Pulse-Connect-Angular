// alert.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertQueueItem {
  options: AlertOptions;
  callback: (confirmed: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertQueue: AlertQueueItem[] = [];
  private alertSubject = new Subject<{options: AlertOptions, callback: (confirmed: boolean) => void}>();
  
  alert$ = this.alertSubject.asObservable();
  
  showAlert(options: AlertOptions): Promise<boolean> {
    return new Promise((resolve) => {
      // Add to queue
      this.alertQueue.push({
        options,
        callback: resolve
      });
      
      // If this is the only alert in queue, show it immediately
      if (this.alertQueue.length === 1) {
        this.showNextAlert();
      }
    });
  }
  
  private showNextAlert() {
    if (this.alertQueue.length > 0) {
      const nextAlert = this.alertQueue[0];
      this.alertSubject.next(nextAlert);
    }
  }
  
  alertClosed(confirmed: boolean) {
    // Remove the current alert from queue
    if (this.alertQueue.length > 0) {
      const currentAlert = this.alertQueue.shift();
      if (currentAlert) {
        currentAlert.callback(confirmed);
      }
      
      // Show next alert if any
      this.showNextAlert();
    }
  }
  
  // Convenience methods
  success(message: string, title: string = 'Success'): Promise<boolean> {
    return this.showAlert({ title, message, type: 'success' });
  }
  
  error(message: string, title: string = 'Error'): Promise<boolean> {
    return this.showAlert({ title, message, type: 'error' });
  }
  
  info(message: string, title: string = 'Information'): Promise<boolean> {
    return this.showAlert({ title, message, type: 'info' });
  }
  
  warning(message: string, title: string = 'Warning'): Promise<boolean> {
    return this.showAlert({ title, message, type: 'warning' });
  }
  
  confirm(message: string, title: string = 'Confirm'): Promise<boolean> {
    return this.showAlert({ 
      title, 
      message, 
      type: 'info', 
      showCancel: true,
      confirmText: 'Yes',
      cancelText: 'No'
    });
  }
}