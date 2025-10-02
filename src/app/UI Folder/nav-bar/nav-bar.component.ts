import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
  standalone: false
})
export class NavBarComponent implements OnInit {
  isMobileMenuOpen = false;
  currentRoute: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set initial active route
    this.currentRoute = this.router.url;
    
    // Listen for route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  // Check if a route is active
  isActive(route: string): boolean {
    return this.currentRoute === route || 
           this.currentRoute.startsWith(route + '/') ||
           (route === '/home' && this.currentRoute === '/');
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    if (!target.closest('.md\\:hidden') && !target.closest('[aria-expanded]') && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  // Close menu when pressing Escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}