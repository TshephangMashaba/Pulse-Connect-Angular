import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css'],
  standalone: false
})
export class CommunityComponent implements OnInit {
  activeTab = 'discussions';

  constructor() { }

  ngOnInit(): void {
    this.initializeTabFunctionality();
    this.initializeModalFunctionality();
  }

  private initializeTabFunctionality(): void {
    const tabs = document.querySelectorAll('[data-tab]');
    
    tabs.forEach((tab: Element) => {
      tab.addEventListener('click', (event: Event) => {
        const clickedTab = event.target as HTMLElement;
        const tabId = clickedTab.getAttribute('data-tab');
        
        if (tabId) {
          this.switchTab(tabId);
        }
      });
    });
  }

  private switchTab(tabId: string): void {
    // Update active tab
    this.activeTab = tabId;

    // Update UI
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach((tab: Element) => {
      const htmlTab = tab as HTMLElement;
      htmlTab.classList.remove('active-tab', 'text-gray-900', 'border-green-500');
      htmlTab.classList.add('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');
      
      if (htmlTab.getAttribute('data-tab') === tabId) {
        htmlTab.classList.add('active-tab', 'text-gray-900', 'border-green-500');
        htmlTab.classList.remove('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');
      }
    });

    // Hide all content tabs
    document.querySelectorAll('[id$="-tab"]').forEach((content: Element) => {
      content.classList.add('hidden');
    });

    // Show selected content tab
    const activeContent = document.getElementById(`${tabId}-tab`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  }

  private initializeModalFunctionality(): void {
    const newPostBtn = document.getElementById('newPostBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelPostBtn = document.getElementById('cancelPostBtn');
    const modal = document.getElementById('newPostModal');

    if (newPostBtn) {
      newPostBtn.addEventListener('click', () => {
        this.toggleModal(true);
      });
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.toggleModal(false);
      });
    }

    if (cancelPostBtn) {
      cancelPostBtn.addEventListener('click', () => {
        this.toggleModal(false);
      });
    }

    if (modal) {
      modal.addEventListener('click', (event: MouseEvent) => {
        if (event.target === modal) {
          this.toggleModal(false);
        }
      });
    }
  }

  private toggleModal(show: boolean): void {
    const modal = document.getElementById('newPostModal');
    if (modal) {
      if (show) {
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }
  }

  // Alternative approach using Angular's template references and methods
  switchTabAngular(tabId: string): void {
    this.activeTab = tabId;
    // The rest would be handled via Angular's template bindings
  }

  showModal = false;

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const modal = document.getElementById('newPostModal');
    if (modal && event.target === modal) {
      this.closeModal();
    }
  }
}