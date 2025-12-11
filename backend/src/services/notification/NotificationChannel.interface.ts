export interface INotificationChannel {
  send(recipient: string, content: NotificationContent): Promise<void>;
  isEnabled(user: any): boolean;
}

export interface NotificationContent {
  subject?: string;
  message: string;
  html?: string;
}
