// certificate.service.ts - FIXED VERSION
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { CertificateData, CertificateGeneratorService } from './certificate-generator.service';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  certificateNumber: string;
  issueDate: Date;
  score: number;
  downloadUrl: string;
  isEmailed: boolean;
}

export interface CertificateStats {
  totalCertificates: number;
  xpPoints: number;
  badgesEarned: number;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = 'https://localhost:7142/api/certificates';

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private certificateGenerator: CertificateGeneratorService
  ) { }
  
  private getHeaders(): HttpHeaders {
    const token = this.authService.getValidToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/my-certificates`, {
      headers: this.getHeaders()
    });
  }

  getCertificateStats(): Observable<CertificateStats> {
    return this.http.get<CertificateStats>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders()
    });
  }

  // Method to open certificate in new window
  openCertificateInNewWindow(data: CertificateData): void {
    const htmlContent = this.certificateGenerator.getCertificateHTML(data);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  }

  async generateAndDownloadCertificate(certificate: Certificate): Promise<void> {
    const certificateData: CertificateData = {
      userName: certificate.userName,
      courseTitle: certificate.courseTitle,
      score: certificate.score,
      certificateNumber: certificate.certificateNumber,
      issueDate: new Date(certificate.issueDate)
    };

    try {
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
      this.openCertificateInNewWindow(certificateData);
    }
  }

  // This method is not needed since we're generating PDFs on frontend
  // But keeping it for backward compatibility
  downloadCertificate(certificateId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${certificateId}/download`, {
      headers: this.getHeaders()
    });
  }

  sendCertificateEmail(certificateId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${certificateId}/email`, {}, {
      headers: this.getHeaders()
    });
  }

  verifyCertificate(certificateNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify/${certificateNumber}`);
  }

  shareCertificate(certificateId: string, platform: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${certificateId}/share`, { platform }, {
      headers: this.getHeaders()
    });
  }
}