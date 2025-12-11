import EmailService from "../../utils/email";
import {
  INotificationChannel,
  NotificationContent,
} from "./NotificationChannel.interface";

export class EmailNotificationChannel implements INotificationChannel {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async send(recipient: string, content: NotificationContent): Promise<void> {
    await this.emailService.sendEmail(
      recipient,
      content.subject || "Notificação",
      content.message,
      content.html
    );
  }

  isEnabled(user: any): boolean {
    return !!user.mail;
  }
}
