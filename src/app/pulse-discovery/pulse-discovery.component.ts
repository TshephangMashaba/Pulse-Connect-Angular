// pulse-discovery.component.ts
import { Component, OnInit, ViewChild, ElementRef, Sanitizer, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-pulse-discovery',
  templateUrl: './pulse-discovery.component.html',
  styleUrls: ['./pulse-discovery.component.css'],
  standalone: false
})
export class PulseDiscoveryComponent implements OnInit {
  @ViewChild('dataIframe') dataIframe!: ElementRef;
  
  showIframe = false;
  iframeLoaded = false;
  searchQuery = '';
  iframeSrc: any;
  
  floatingIcons = [
    { icon: 'fa-heart', left: 10, delay: 0, color: '#ff6b6b', size: 24, startPosition: 20 },
    { icon: 'fa-stethoscope', left: 25, delay: 0.5, color: '#4ecdc4', size: 28, startPosition: 30 },
    { icon: 'fa-brain', left: 40, delay: 1, color: '#45b7d1', size: 26, startPosition: 25 },
    { icon: 'fa-laptop-medical', left: 60, delay: 1.5, color: '#f9c74f', size: 30, startPosition: 35 },
    { icon: 'fa-book-medical', left: 75, delay: 2, color: '#90be6d', size: 22, startPosition: 15 },
    { icon: 'fa-hospital', left: 90, delay: 2.5, color: '#577590', size: 32, startPosition: 28 }
  ];

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    // Set the initial iframe source
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl('https://data.ahri.org/index.php/');
  }

  onIframeLoad() {
    this.iframeLoaded = true;
    
    // Try to apply custom styles to the iframe content
    setTimeout(() => {
      try {
        const iframeDoc = this.dataIframe.nativeElement.contentDocument || 
                          this.dataIframe.nativeElement.contentWindow.document;
        
        // Add custom styles to the iframe
        const style = iframeDoc.createElement('style');
        style.textContent = `
          /* Custom styles for the iframe content */
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .wp-page-body.container.default-wrapper.page-home.home {
            padding-top: 0;
          }
          
          .breadcrumb.wb-breadcrumb {
            display: none;
          }
          
          .body-content-wrap.theme-nada-2 {
            background: transparent;
          }
          
          .ui-tabs.wb-tab-heading {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
            margin-bottom: 20px;
          }
          
          .wb-tab-heading h1 {
            color: #1a2a6c;
            margin-bottom: 10px;
          }
          
          .sub-text {
            color: #666;
            margin-bottom: 20px;
            font-size: 1.1rem;
          }
          
          .card.card-sm {
            border-radius: 50px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border: none;
          }
          
          .form-control.form-control-md.form-control-borderless {
            padding: 12px 20px;
            border: none;
          }
          
          .btn.btn-md.btn-primary {
            background: linear-gradient(45deg, #1a2a6c, #4a6fc1);
            border: none;
            padding: 12px 25px;
            border-radius: 0;
          }
          
          .wb-survey-rows .survey-row {
            padding: 15px 0;
            border-bottom: 1px solid #eee;
          }
          
          .wb-survey-rows .survey-row:last-child {
            border-bottom: none;
          }
          
          .wb-survey-rows h5 a {
            color: #1a2a6c;
            text-decoration: none;
            font-weight: 600;
          }
          
          .wb-survey-rows h5 a:hover {
            color: #b21f1f;
          }
          
          .survey-stats {
            color: #666;
            font-size: 0.9rem;
          }
          
          .wb-box-sidebar {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
            margin-bottom: 20px;
          }
          
          .wb-box-sidebar h3 {
            color: #1a2a6c;
            font-size: 2.2rem;
            margin: 10px 0;
          }
          
          .btn.btn-primary {
            background: linear-gradient(45deg, #1a2a6c, #4a6fc1);
            border: none;
            padding: 10px 20px;
            border-radius: 50px;
            margin-top: 10px;
          }
          
          .citation-row {
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          
          .citation-row:last-child {
            border-bottom: none;
          }
          
          .sub-title a {
            color: #1a2a6c;
            text-decoration: none;
            font-weight: 600;
          }
          
          .sub-title a:hover {
            color: #b21f1f;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .ui-tabs.wb-tab-heading {
              padding: 15px;
            }
            
            .wb-box-sidebar {
              padding: 15px;
            }
          }
        `;
        
        iframeDoc.head.appendChild(style);
      } catch (e) {
        console.log('Cannot style iframe content due to cross-origin restrictions');
      }
    }, 1000);
  }

  onCustomSearch(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      // Update the iframe source with the search query
      const searchUrl = `https://data.ahri.org/index.php/catalog?sort_by=rank&sort_order=desc&sk=${encodeURIComponent(this.searchQuery)}`;
      this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(searchUrl);
      this.iframeLoaded = false;
    }
  }
}