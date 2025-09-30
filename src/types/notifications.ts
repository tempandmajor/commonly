export interface NotificationSettings {
  email: {
    newFollowers: boolean;
    eventUpdates: boolean;
    paymentConfirmations: boolean;
    marketing: boolean;
  };
  push: {
    newFollowers: boolean;
    eventUpdates: boolean;
    paymentConfirmations: boolean;
    marketing: boolean;
  };
}

export type NotificationType = 'email' | 'push';
export type NotificationSetting =
  | 'newFollowers'
  | 'eventUpdates'
  | 'paymentConfirmations'
  | 'marketing';
