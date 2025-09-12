// certificates.component.ts
import { Component, OnInit } from '@angular/core';
import { CertificateService, Certificate, CertificateStats, Badge, AchievementData } from '../services/certificate.service';
import { CertificateData, CertificateGeneratorService } from '../services/certificate-generator.service';

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
    xpPoints: 0,
    badgesEarned: 0,
    totalBadges: 0
  };
  achievements: AchievementData = {
    badges: [],
    earnedBadges: [],
    pendingBadges: [],
    totalBadges: 0,
    earnedCount: 0
  };
  isLoading = true;
  errorMessage = '';
  sortBy = 'mostRecent';
  activeBadgeTab: 'all' | 'earned' | 'pending' = 'all';
   isGenerating = false;
  constructor(
    private certificateService: CertificateService,
    private certificateGenerator: CertificateGeneratorService
  ) { }

  ngOnInit() {
    this.loadCertificates();
    this.loadStats();
    this.loadAchievements();
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
        this.stats = {
          totalCertificates: this.certificates.length,
          xpPoints: this.certificates.length * 250,
          badgesEarned: 0,
          totalBadges: 0
        };
      }
    });
  }

  loadAchievements() {
    this.certificateService.getAchievements().subscribe({
      next: (data) => {
        this.achievements = data;
        this.stats.badgesEarned = data.earnedCount;
        this.stats.totalBadges = data.totalBadges;
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
        this.loadDefaultBadges();
      }
    });
  }

  private loadDefaultBadges() {
    const defaultBadges: Badge[] = [
      {
        id: '1',
        name: 'Health Champion',
        description: 'Complete 3 courses',
        icon: '🏆',
        earned: this.certificates.length >= 3,
        progress: Math.min(this.certificates.length, 3),
        target: 3,
        category: 'completion'
      },
      {
        id: '2',
        name: 'Quick Learner',
        description: 'Finish a course in 1 day',
        icon: '⚡',
        earned: false,
        progress: 0,
        target: 1,
        category: 'speed'
      },
      {
        id: '3',
        name: 'Community Helper',
        description: '5 forum posts',
        icon: '💬',
        earned: false,
        progress: 0,
        target: 5,
        category: 'community'
      },
      {
        id: '4',
        name: 'Quiz Master',
        description: 'Score 100% on a quiz',
        icon: '🎯',
        earned: this.certificates.some(c => c.score === 100),
        progress: this.certificates.some(c => c.score === 100) ? 1 : 0,
        target: 1,
        category: 'performance'
      },
      {
        id: '5',
        name: 'Knowledge Seeker',
        description: 'Complete 5 courses',
        icon: '📚',
        earned: this.certificates.length >= 5,
        progress: Math.min(this.certificates.length, 5),
        target: 5,
        category: 'completion'
      },
      {
        id: '6',
        name: 'Health Advocate',
        description: 'Share 3 certificates',
        icon: '📤',
        earned: false,
        progress: 0,
        target: 3,
        category: 'sharing'
      },
      {
        id: '7',
        name: 'Certified Pro',
        description: 'Earn 10 certificates',
        icon: '⭐',
        earned: this.certificates.length >= 10,
        progress: Math.min(this.certificates.length, 10),
        target: 10,
        category: 'mastery'
      },
      {
        id: '8',
        name: 'Perfect Score',
        description: 'Get 100% on 3 different courses',
        icon: '💯',
        earned: this.certificates.filter(c => c.score === 100).length >= 3,
        progress: Math.min(this.certificates.filter(c => c.score === 100).length, 3),
        target: 3,
        category: 'excellence'
      }
    ];

    this.achievements = {
      badges: defaultBadges,
      earnedBadges: defaultBadges.filter(b => b.earned),
      pendingBadges: defaultBadges.filter(b => !b.earned),
      totalBadges: defaultBadges.length,
      earnedCount: defaultBadges.filter(b => b.earned).length
    };

    this.stats.badgesEarned = this.achievements.earnedCount;
    this.stats.totalBadges = this.achievements.totalBadges;
  }

  async downloadCertificate(certificate: Certificate): Promise<void> {
    this.isGenerating = true; // Show loader
    try {
      const certificateData: CertificateData = {
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        score: certificate.score,
        certificateNumber: certificate.certificateNumber,
        issueDate: new Date(certificate.issueDate)
      };

      console.log('Generating certificate PDF...');
      const pdfBlob = await this.certificateGenerator.generateCertificatePDF(certificateData);
      console.log('PDF generated successfully, downloading...');
      this.certificateGenerator.downloadCertificatePDF(
        pdfBlob, 
        `Certificate_${certificate.certificateNumber}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF certificate:', error);
      console.log('Falling back to HTML preview...');
      this.certificateService.openCertificateInNewWindow({
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        score: certificate.score,
        certificateNumber: certificate.certificateNumber,
        issueDate: new Date(certificate.issueDate)
      });
    } finally {
      this.isGenerating = false; // Hide loader
    }
  }

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
 async shareCertificate(certificate: Certificate): Promise<void> {
    this.isGenerating = true; // Show loader
    try {
      // Generate PDF (same as before)
      const certificateData: CertificateData = {
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        score: certificate.score,
        certificateNumber: certificate.certificateNumber,
        issueDate: new Date(certificate.issueDate)
      };

      const pdfBlob = await this.certificateGenerator.generateCertificatePDF(certificateData);
      
      // Share logic (same as before)
      const file = new File([pdfBlob], `Certificate_${certificate.certificateNumber}.pdf`, {
        type: 'application/pdf'
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My ${certificate.courseTitle} Certificate`,
          text: `I completed the ${certificate.courseTitle} course on Pulse Connect with a score of ${certificate.score}%!`,
          files: [file]
        });
        
        // ✅ NOW CALL BACKEND TO RECORD THE SHARE
        await this.recordShareInBackend(certificate.id, 'native_share');
        
      } else {
        this.certificateGenerator.downloadCertificatePDF(pdfBlob, `Certificate_${certificate.certificateNumber}.pdf`);
        
      
        await this.recordShareInBackend(certificate.id, 'download');
        
        alert('PDF downloaded! You can now share the file.');
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
      this.downloadCertificate(certificate);
    } finally {
      this.isGenerating = false; // Hide loader
    }
  }

// New method to record share in backend
private async recordShareInBackend(certificateId: string, platform: string): Promise<void> {
  try {
    await this.certificateService.recordShare(certificateId, platform).toPromise();
    // Refresh achievements to update the sharing badge
    this.loadAchievements();
  } catch (error) {
    console.error('Failed to record share in backend:', error);
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
    const colors = ['green', 'blue', 'purple', 'yellow', 'indigo', 'pink'];
    return colors[index % colors.length];
  }

  getGradientClass(color: string): string {
    switch (color) {
      case 'green': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'blue': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'purple': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'yellow': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'indigo': return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      case 'pink': return 'bg-gradient-to-r from-pink-500 to-pink-600';
      default: return 'bg-gradient-to-r from-green-500 to-green-600';
    }
  }

  getBorderClass(color: string): string {
    switch (color) {
      case 'green': return 'border-green-600 text-green-600';
      case 'blue': return 'border-blue-600 text-blue-600';
      case 'purple': return 'border-purple-600 text-purple-600';
      case 'yellow': return 'border-yellow-600 text-yellow-600';
      case 'indigo': return 'border-indigo-600 text-indigo-600';
      case 'pink': return 'border-pink-600 text-pink-600';
      default: return 'border-green-600 text-green-600';
    }
  }

  getButtonClass(color: string): string {
    switch (color) {
      case 'green': return 'bg-green-600 hover:bg-green-700';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'purple': return 'bg-purple-600 hover:bg-purple-700';
      case 'yellow': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'indigo': return 'bg-indigo-600 hover:bg-indigo-700';
      case 'pink': return 'bg-pink-600 hover:bg-pink-700';
      default: return 'bg-green-600 hover:bg-green-700';
    }
  }

  getBadgesToShow(): Badge[] {
    switch (this.activeBadgeTab) {
      case 'earned':
        return this.achievements.earnedBadges;
      case 'pending':
        return this.achievements.pendingBadges;
      default:
        return this.achievements.badges;
    }
  }

  setActiveBadgeTab(tab: 'all' | 'earned' | 'pending') {
    this.activeBadgeTab = tab;
  }

  getProgressPercentage(badge: Badge): number {
    return (badge.progress / badge.target) * 100;
  }

  getBadgeCategoryClass(category: string): string {
    switch (category) {
      case 'completion': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'speed': return 'bg-yellow-100 text-yellow-800';
      case 'community': return 'bg-purple-100 text-purple-800';
      case 'sharing': return 'bg-pink-100 text-pink-800';
      case 'mastery': return 'bg-indigo-100 text-indigo-800';
      case 'excellence': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getBadgeIconClass(category: string): string {
    switch (category) {
      case 'completion': return 'bg-blue-500 text-white';
      case 'performance': return 'bg-green-500 text-white';
      case 'speed': return 'bg-yellow-500 text-white';
      case 'community': return 'bg-purple-500 text-white';
      case 'sharing': return 'bg-pink-500 text-white';
      case 'mastery': return 'bg-indigo-500 text-white';
      case 'excellence': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }
}