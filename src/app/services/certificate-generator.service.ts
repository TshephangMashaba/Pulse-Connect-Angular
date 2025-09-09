// certificate-generator.service.ts - FINAL VERSION WITH TIGHT SPACING
import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface CertificateData {
  userName: string;
  courseTitle: string;
  score: number;
  certificateNumber: string;
  issueDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateGeneratorService {
  
  // Logo paths - using actual file paths
  private readonly LOGO_PATHS = {
    pulseConnect: '/2.png',
    sponsor1: '/UNESCO.png',
    sponsor2: '/ngo-sa.svg', 
    sponsor3: '/university-of-pretoria.jpg'
  };

  constructor() { }

  // Method for preview only (not used for PDF generation)
  getCertificateHTML(data: CertificateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Simplified styles for preview only */
          body { font-family: Arial, sans-serif; background: #f0f0f0; margin: 20px; }
          .certificate { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
          .title { font-size: 24px; font-weight: bold; color: #2c5282; margin-bottom: 10px; }
          .recipient { font-size: 20px; color: #2d3748; margin: 15px 0; padding: 10px; background: #f7fafc; border-radius: 5px; }
          .course-title { font-size: 18px; color: #4a5568; margin: 10px 0; }
          .details { background: #edf2f7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1 class="title">Certificate of Excellence</h1>
          <p>This certifies that</p>
          <div class="recipient">${this.escapeHtml(data.userName)}</div>
          <p>has successfully completed</p>
          <h2 class="course-title">${this.escapeHtml(data.courseTitle)}</h2>
          <div class="details">
            <p>Score: ${data.score}%</p>
            <p>Certificate: ${data.certificateNumber}</p>
            <p>Date: ${data.issueDate.toLocaleDateString()}</p>
          </div>
          <p><small>This is a preview. Download PDF for official certificate.</small></p>
        </div>
      </body>
      </html>
    `;
  }

  async generateCertificatePDF(data: CertificateData): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create PDF-specific HTML (completely separate from preview)
        const pdfHtml = this.generatePDFHtml(data);
        
        // Create a temporary container for PDF generation only
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '297mm';
        tempContainer.style.height = '210mm';
        tempContainer.style.overflow = 'hidden';
        tempContainer.style.background = '#ffffff';
        
        tempContainer.innerHTML = pdfHtml;
        document.body.appendChild(tempContainer);

        // Wait for images to load
        await this.waitForImages(tempContainer);

        // Generate canvas with exact PDF dimensions
        const canvas = await html2canvas(tempContainer, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false,
          width: 1123, // 297mm in pixels (297 * 3.78)
          height: 794, // 210mm in pixels (210 * 3.78)
          windowWidth: 1123,
          windowHeight: 794
        });

        document.body.removeChild(tempContainer);

        // Create PDF with exact dimensions
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Add image to fill entire PDF page
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
        
        // Generate PDF blob
        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      } catch (error) {
        console.error('Error generating PDF:', error);
        reject(error);
      }
    });
  }

  // Private method for PDF generation only (completely separate from preview)
  private generatePDFHtml(data: CertificateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Montserrat', sans-serif;
            background: #ffffff;
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .certificate {
            background: white;
            padding: 12mm 20mm 15mm 20mm;
            text-align: center;
            position: relative;
            width: 297mm;
            height: 210mm;
            box-sizing: border-box;
          }
          
          .gold-border {
            position: absolute;
            top: 5mm;
            left: 5mm;
            right: 5mm;
            bottom: 5mm;
            border: 2mm solid #fbbf24;
            border-radius: 10px;
            pointer-events: none;
            z-index: 1;
          }
          
          .header {
            margin-bottom: 6mm;
            position: relative;
            z-index: 2;
          }
          
          .logo-container {
            margin-bottom: 2mm;
          }
          
          .main-logo-img {
            width: 45mm;
            height: 45mm;
            margin: 0 auto;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            color: #1f2937;
            margin-bottom: 1mm;
            font-weight: 900;
            letter-spacing: 1px;
          }
          
          .subtitle {
            font-size: 13px;
            color: #6b7280;
            font-weight: 400;
            letter-spacing: 0.5px;
            margin-bottom: 5mm;
          }
          
          .recipient {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            color: #374151;
            margin: 4mm 0;
            font-weight: 700;
            padding: 10px;
            background: linear-gradient(135deg, #f8fafc, #e9ecef);
            border-radius: 8px;
            display: inline-block;
            border: 1px solid #e5e7eb;
          }
          
          .course-info {
            margin: 4mm 0;
          }
          
          .course-text {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 3px;
            font-weight: 300;
          }
          
          .course-title {
            font-size: 20px;
            color: #10b981;
            font-weight: 700;
            margin-bottom: 5mm;
            padding: 0;
            background: none;
            display: inline-block;
          }
          
          .details {
            background: linear-gradient(135deg, #ffffff, #f9fafb);
            padding: 10px;
            border-radius: 8px;
            margin: 5mm 0;
            text-align: center;
            border-left: 3px solid #10b981;
          }
          
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-top: 6px;
          }
          
          .detail-item {
            text-align: center;
            padding: 8px;
            background: linear-gradient(135deg, #f8fafc, #e9ecef);
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 10px;
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .detail-value {
            font-weight: 700;
            color: #1f2937;
            font-size: 11px;
          }
          
          .score-value {
            color: #10b981;
            font-size: 12px;
          }
          
          .sponsors-section {
            margin-top: 6mm;
            padding-top: 10px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
          }
          
          .sponsors-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 6px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .sponsor-logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin: 8px 0;
          }
          
          .sponsor-logo-img {
            width: 30px;
            height: 30px;
            border-radius: 5px;
            object-fit: contain;
            border: 1px solid #e5e7eb;
            padding: 2px;
            background: white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          }
          
          .footer {
            margin-top: 5mm;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            align-items: end;
          }
          
          .verification {
            text-align: left;
          }
          
          .verification-text {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 3px;
            font-weight: 500;
          }
          
          .verification-link {
            font-size: 10px;
            color: #3b82f6;
            font-weight: 600;
            text-decoration: none;
          }
          
          .issue-date {
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="gold-border"></div>
          
          <div class="header">
            <div class="logo-container">
              <img src="${this.LOGO_PATHS.pulseConnect}" alt="Pulse Connect" class="main-logo-img">
            </div>
            <h1 class="title">Certificate of Excellence</h1>
            <p class="subtitle">This certifies that</p>
          </div>
          
          <div class="recipient">${this.escapeHtml(data.userName)}</div>
          
          <div class="course-info">
            <p class="course-text">has successfully completed the course</p>
            <h2 class="course-title">${this.escapeHtml(data.courseTitle)}</h2>
          </div>
          
          <div class="details">
            <h3 class="detail-label">ACHIEVEMENT DETAILS</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Score Achieved</div>
                <div class="detail-value score-value">${data.score}% Excellence</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Certificate Number</div>
                <div class="detail-value">${data.certificateNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date of Issue</div>
                <div class="detail-value">${data.issueDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
          
          <!-- Sponsors Section -->
          <div class="sponsors-section">
            <div class="sponsors-label">Proudly Supported By</div>
            <div class="sponsor-logos">
              <img src="${this.LOGO_PATHS.sponsor1}" alt="UNESCO" class="sponsor-logo-img">
              <img src="${this.LOGO_PATHS.sponsor2}" alt="NGO SA" class="sponsor-logo-img">
              <img src="${this.LOGO_PATHS.sponsor3}" alt="University of Pretoria" class="sponsor-logo-img">
            </div>
          </div>
          
          <div class="footer">
            <div class="verification">
              <p class="verification-text">Verify this certificate online:</p>
              <a href="https://pulseconnect.org/verify/${data.certificateNumber}" 
                 class="verification-link">
                 pulseconnect.org/verify/${data.certificateNumber}
              </a>
            </div>
            
            <div class="issue-date">
              Issued on ${data.issueDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private waitForImages(container: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const images = container.getElementsByTagName('img');
      let loadedCount = 0;
      const totalImages = images.length;

      if (totalImages === 0) {
        resolve();
        return;
      }

      const imageLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };

      for (let i = 0; i < totalImages; i++) {
        const img = images[i];
        if (img.complete) {
          imageLoaded();
        } else {
          img.onload = imageLoaded;
          img.onerror = imageLoaded;
        }
      }

      setTimeout(resolve, 3000);
    });
  }

  downloadCertificatePDF(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}