// certificates.component.ts - SIMPLIFIED VERSION (NO MODAL)
import { Component, OnInit } from '@angular/core';
import { CertificateService, Certificate, CertificateStats } from '../services/certificate.service';
import { CertificateGeneratorService } from '../services/certificate-generator.service';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css'],
  standalone: false
})
export class CertificatesComponent implements OnInit {
  certificates: Certificate[] = [];
  stats: CertificateStats = {
    totalCertificates: 0,
    xpPoints: 1250,
    badgesEarned: 2
  };
  isLoading = true;
  errorMessage = '';
  sortBy = 'mostRecent';

  constructor(
    private certificateService: CertificateService,
    private certificateGenerator: CertificateGeneratorService
  ) { }

  ngOnInit() {
    this.loadCertificates();
    this.loadStats();
  }

  loadCertificates() {
    this.isLoading = true;
    this.certificateService.getMyCertificates().subscribe({
      next: (data) => {
        this.certificates = data;
        this.sortCertificates();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        this.errorMessage = 'Failed to load certificates';
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.certificateService.getCertificateStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        // Use default stats if API fails
      }
    });
  }

  // Download certificate directly
  downloadCertificate(certificate: Certificate): void {
    this.certificateService.generateAndDownloadCertificate(certificate);
  }

  // Remove previewCertificate method entirely
  // Remove closeModal method entirely

  sortCertificates() {
    switch (this.sortBy) {
      case 'courseName':
        this.certificates.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
      case 'completionDate':
        this.certificates.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
        break;
      case 'mostRecent':
      default:
        this.certificates.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
        break;
    }
  }

  onSortChange(event: any) {
    this.sortBy = event.target.value;
    this.sortCertificates();
  }

  shareCertificate(certificate: Certificate) {
    if (navigator.share) {
      navigator.share({
        title: `My ${certificate.courseTitle} Certificate`,
        text: `I completed the ${certificate.courseTitle} course on Pulse Connect with a score of ${certificate.score}%!`,
        url: certificate.downloadUrl
      }).catch((error) => {
        console.error('Error sharing:', error);
        this.copyToClipboard(certificate);
      });
    } else {
      this.copyToClipboard(certificate);
    }
  }

  private copyToClipboard(certificate: Certificate) {
    const text = `Check out my certificate for ${certificate.courseTitle}: ${certificate.downloadUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Certificate link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link to share:', certificate.downloadUrl);
    });
  }

  sendCertificateEmail(certificate: Certificate) {
    this.certificateService.sendCertificateEmail(certificate.id).subscribe({
      next: () => {
        alert('Certificate email sent successfully!');
        certificate.isEmailed = true;
      },
      error: (error) => {
        console.error('Error sending email:', error);
        alert('Failed to send certificate email. Please try again.');
      }
    });
  }

  getCertificateColor(index: number): string {
    const colors = ['green', 'blue', 'purple'];
    return colors[index % colors.length];
  }

  getGradientClass(color: string): string {
    switch (color) {
      case 'green': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'blue': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'purple': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default: return 'bg-gradient-to-r from-green-500 to-green-600';
    }
  }

  getBorderClass(color: string): string {
    switch (color) {
      case 'green': return 'border-green-600 text-green-600';
      case 'blue': return 'border-blue-600 text-blue-600';
      case 'purple': return 'border-purple-600 text-purple-600';
      default: return 'border-green-600 text-green-600';
    }
  }

  getButtonClass(color: string): string {
    switch (color) {
      case 'green': return 'bg-green-600 hover:bg-green-700';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'purple': return 'bg-purple-600 hover:bg-purple-700';
      default: return 'bg-green-600 hover:bg-green-700';
    }
  }
}