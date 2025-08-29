import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  standalone: false
})
export class HomePageComponent implements OnInit {
  icons = [
    'fa-heart', 'fa-hospital', 'fa-stethoscope', 'fa-user-md', 'fa-ambulance',
    'fa-pills', 'fa-syringe', 'fa-heartbeat', 'fa-plus-square', 'fa-medkit',
    'fa-clipboard', 'fa-brain', 'fa-lungs', 'fa-teeth', 'fa-band-aid'
  ];
  
  colors = [
    '#ffffff', '#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784',
    '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32'
  ];
  
  floatingIcons: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.generateFloatingIcons();
  }

  generateFloatingIcons(): void {
    for (let i = 0; i < 25; i++) {
      this.floatingIcons.push({
        icon: this.icons[Math.floor(Math.random() * this.icons.length)],
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 15,
        size: 20 + Math.random() * 20,
        startPosition: 100 + (Math.random() * 20) // Start below the viewport
      });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrolled = window.pageYOffset;
    const waves = document.querySelectorAll('.wave');
    
    waves.forEach((wave: any, index: number) => {
      const speed = 0.2 * (index + 1);
      wave.style.transform = `translateX(${scrolled * speed}px) rotate(${scrolled * 0.02}deg)`;
    });
  }
}