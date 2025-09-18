// admin-nav.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService, User } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-admin-nav',
  templateUrl: './admin-nav.component.html',
  styleUrls: ['./admin-nav.component.css'],
  standalone: false
})
export class AdminNavComponent implements OnInit {
  currentPath = '';
  user: User | null = null;
  defaultAvatar = '/default-profile.png';
  isStudent: boolean = false;
  isSuperAdmin: boolean = false;
  isDropdownOpen = false;
  isNotificationModalOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private location: Location,
    private auth: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.auth.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(u => {
      this.user = u;
      this.isStudent = u?.role?.toLowerCase() === 'student';
      this.isSuperAdmin = u?.role?.toLowerCase() === 'mentor' || 
             u?.role === 'Admin' || 
             u?.role === 'Manager';
    });

    // Load notifications
    this.notificationService.getNotifications().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.notifications = notifications;
    });

    this.notificationService.getUnreadCount().pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => {
      this.unreadCount = count;
    });

    this.auth.refreshUserData().subscribe();
    this.updateCurrentPath();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Close dropdown if clicked outside
    if (this.isDropdownOpen && !target.closest('.profile-dropdown')) {
      this.isDropdownOpen = false;
    }
    
    // Close notification modal if clicked outside
    if (this.isNotificationModalOpen && !target.closest('.notification-modal') && !target.closest('.notification-bell')) {
      this.closeNotificationModal();
    }
  }

  updateCurrentPath() {
    this.currentPath = this.location.path();
  }

  isActive(path: string) {
    return this.currentPath === path || this.currentPath.startsWith(path + '/');
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultAvatar;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isNotificationModalOpen) {
      this.closeNotificationModal();
    }
  }

  toggleNotificationModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.isNotificationModalOpen = !this.isNotificationModalOpen;
    
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
    
    // Mark all as read when opening modal
    if (this.isNotificationModalOpen && this.unreadCount > 0) {
      this.markAllAsRead();
    }
  }

  closeNotificationModal() {
    this.isNotificationModalOpen = false;
  }

  markAsRead(notification: Notification, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => console.error('Error marking notification as read:', error)
      });
    }
  }

  markAllAsRead(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.unreadCount > 0) {
      this.notificationService.markAllAsRead().subscribe({
        next: () => {
          this.notifications.forEach(n => n.isRead = true);
          this.unreadCount = 0;
        },
        error: (error) => console.error('Error marking all notifications as read:', error)
      });
    }
  }

  navigateToRelatedItem(notification: Notification, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (notification.relatedEntityId && notification.relatedEntityType) {
      switch (notification.relatedEntityType) {
        case 'course':
          this.router.navigate(['/manage-courses']);
          break;
        case 'certificate':
          this.router.navigate(['/certificates']);
          break;
        case 'test':
          this.router.navigate(['/test', notification.relatedEntityId]);
          break;
        default:
          // Do nothing for other types
          break;
      }
    }
    this.closeNotificationModal();
    this.markAsRead(notification);
  }

  getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
      default:
        return 'fas fa-info-circle';
    }
  }
// admin-nav.component.ts - Update the logout methods
logout() {
  this.isDropdownOpen = false;
  this.closeNotificationModal();
  
  // Show confirmation modal
  const modal = document.getElementById('logout-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('logout-modal-backdrop')?.classList.remove('hidden');
  }
}

closeModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('logout-modal-backdrop')?.classList.add('hidden');
  }
}

confirmLogout() {
  this.closeModal();
  this.auth.logout().subscribe({
    next: () => {
      this.router.navigate(['/login']);
    },
    error: (err: any) => {
      console.error('Logout error:', err);
      // Even if there's an error, clear local data and redirect
      this.auth.clearUserData();
      this.router.navigate(['/login']);
    }
  });
}
}