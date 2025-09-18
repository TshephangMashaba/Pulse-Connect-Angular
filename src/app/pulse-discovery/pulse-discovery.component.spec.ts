/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PulseDiscoveryComponent } from './pulse-discovery.component';

describe('PulseDiscoveryComponent', () => {
  let component: PulseDiscoveryComponent;
  let fixture: ComponentFixture<PulseDiscoveryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PulseDiscoveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PulseDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
