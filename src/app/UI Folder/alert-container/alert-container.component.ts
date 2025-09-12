// alert-container.component.ts
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertOptions, AlertService } from '../../services/alert.service';


@Component({
  selector: 'app-alert-container',
  templateUrl: './alert-container.component.html',
  styleUrls: ['./alert-container.component.css'],
  standalone: false
})
export class AlertContainerComponent implements OnDestroy {
  isVisible = false;
  alertOptions: AlertOptions = {
    title: '',
    message: '',
    type: 'info'
  };
  
  private subscription: Subscription;
  
  constructor(private alertService: AlertService) {
    this.subscription = this.alertService.alert$.subscribe(({options, callback}) => {
      this.alertOptions = options;
      this.isVisible = true;
    });
  }
  
  onConfirm() {
    this.isVisible = false;
    this.alertService.alertClosed(true);
  }
  
  onCancel() {
    this.isVisible = false;
    this.alertService.alertClosed(false);
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}