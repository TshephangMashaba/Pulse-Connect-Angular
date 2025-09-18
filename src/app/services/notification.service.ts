// services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'api/userdashboard'; // Use relative path
  private notifications = new BehaviorSubject<Notification[]>([]);
  private unreadCount = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    this.loadNotifications();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount.asObservable();
  }

  loadNotifications(): void {
    this.http.get<Notification[]>(`${this.apiUrl}/notifications`).subscribe({
      next: (notifications) => {
        this.notifications.next(notifications);
        this.updateUnreadCount(notifications);
      },
      error: (error) => console.error('Error loading notifications:', error)
    });
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/mark-as-read/${notificationId}`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/mark-all-read`, {});
  }

  getUnreadCountFromServer(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notifications/unread-count`);
  }

  refreshNotifications(): void {
    this.loadNotifications();
    this.getUnreadCountFromServer().subscribe({
      next: (count) => this.unreadCount.next(count),
      error: (error) => console.error('Error refreshing unread count:', error)
    });
  }

  private updateUnreadCount(notifications: Notification[]): void {
    const count = notifications.filter(n => !n.isRead).length;
    this.unreadCount.next(count);
  }
}