import { Component, HostListener, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-user-nav',
  templateUrl: './user-nav.component.html',
  styleUrls: ['./user-nav.component.css'],
  standalone: false
})
export class UserNavComponent implements OnInit {

  currentPath = '';
  user: User | null = null;
  defaultAvatar = '/default-profile.png';
  isStudent: boolean = false;
  isSuperAdmin: boolean = false;
  totalNotificationCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private location: Location,
    private auth: AuthService,
    private router: Router,

  ) {

  }
  


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

    this.auth.refreshUserData().subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:popstate')
  onPopState() {
    this.currentPath = this.location.path();
  }

  isActive(path: string) {
    return this.currentPath === path || this.currentPath.startsWith(path + '/');
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultAvatar;
  }

  logout() {
    // Use the Flowbite modal via CDN
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
        this.auth.clearUserData();
        this.router.navigate(['/login']);
      }
    });
  }
}