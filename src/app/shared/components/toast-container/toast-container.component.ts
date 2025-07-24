import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationService } from '../../../services/notification.service';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container top-right">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [ngClass]="{
          'toast-success': toast.type === 'success',
          'toast-error': toast.type === 'error',
          'toast-info': toast.type === 'info',
          'toast-warning': toast.type === 'warning'
        }"
      >
        {{ toast.message }}
        <button class="toast-close" (click)="removeToast(toast)">&times;</button>
      </div>
    </div>
  `,
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Notification[] = [];
  private notificationSubscription!: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.getNotificationObservable().subscribe(notification => {
      this.toasts.push(notification);
      // Eliminar el toast automáticamente después de su duración o la predeterminada
      timer(notification.duration || 3000).subscribe(() => this.removeToast(notification));
    });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  removeToast(toastToRemove: Notification): void {
    this.toasts = this.toasts.filter(toast => toast !== toastToRemove);
  }
}