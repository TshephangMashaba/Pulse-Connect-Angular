/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CertificateGeneratorService } from './certificate-generator.service';

describe('Service: CertificateGenerator', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CertificateGeneratorService]
    });
  });

  it('should ...', inject([CertificateGeneratorService], (service: CertificateGeneratorService) => {
    expect(service).toBeTruthy();
  }));
});
