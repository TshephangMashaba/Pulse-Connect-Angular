import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  standalone: false
})
export class HomePageComponent implements OnInit {

images = [
    '/rural-area picture.jpg',
    '/Rural Field.jpg',
    '/Wheat-Picture.jpg'
  ];

  currentIndex = 0;
  previousIndex: number | null = null;
  transitionTimer: any;
  transitionDelay = 8000; 
  transitionDuration = 4000;   

  constructor() {}

  ngOnInit(): void {
    this.startImageTransition();
  }


  startImageTransition() {
    this.transitionTimer = setInterval(() => {
      this.previousIndex = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % this.images.length;

      // Clear previousIndex after fade-out is done
      setTimeout(() => {
        this.previousIndex = null;
      }, this.transitionDuration);
    }, this.transitionDelay);
  }

  ngOnDestroy(): void {
    if (this.transitionTimer) {
      clearInterval(this.transitionTimer);
    }
  }
}


