/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TtsService } from './tts.service';

describe('Service: Tts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TtsService]
    });
  });

  it('should ...', inject([TtsService], (service: TtsService) => {
    expect(service).toBeTruthy();
  }));
});
