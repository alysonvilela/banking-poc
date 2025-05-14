export interface QRCode {
  id: string;
  userId: string;
  productId?: string; // Optional product association
  amount: number;
  pixKey: string;
  encodedImage: string; // Base64 encoded QR code image
  expiresAt: Date;
  status: QRCodeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum QRCodeStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export type CreateQRCodeDto = {
  userId: string;
  productId?: string;
  amount: number;
}; 