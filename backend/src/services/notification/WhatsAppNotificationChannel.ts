import { sendWhatsAppMessage } from "../../utils/wppconfig";
import {
  INotificationChannel,
  NotificationContent,
} from "./NotificationChannel.interface";

export class WhatsAppNotificationChannel implements INotificationChannel {
  async send(recipient: string, content: NotificationContent): Promise<void> {
    await sendWhatsAppMessage(recipient, content.message);
  }

  isEnabled(user: any): boolean {
    return user.aut_wpp === 1 && !!user.telefone;
  }
}
