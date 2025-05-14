import { QRCode, QRCodeStatus, CreateQRCodeDto } from '../domain/qrcode';
import { generateId } from '../utils/id';

class QRCodeRepository {
  private qrCodes: Map<string, QRCode> = new Map();
  private qrCodesByUserId: Map<string, string[]> = new Map();
  private qrCodesByPixKey: Map<string, string> = new Map();

  async create(data: CreateQRCodeDto & { pixKey: string, encodedImage: string, expiresAt: Date }): Promise<QRCode> {
    const id = generateId();
    const now = new Date();
    
    const qrCode: QRCode = {
      id,
      userId: data.userId,
      productId: data.productId,
      amount: data.amount,
      pixKey: data.pixKey,
      encodedImage: data.encodedImage,
      expiresAt: data.expiresAt,
      status: QRCodeStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    
    this.qrCodes.set(id, qrCode);
    
    // Track QR codes by user ID
    const userQRCodes = this.qrCodesByUserId.get(data.userId) || [];
    userQRCodes.push(id);
    this.qrCodesByUserId.set(data.userId, userQRCodes);
    
    // Track QR code by PIX key
    this.qrCodesByPixKey.set(data.pixKey, id);
    
    return qrCode;
  }

  async findById(id: string): Promise<QRCode | null> {
    return this.qrCodes.get(id) || null;
  }

  async findByPixKey(pixKey: string): Promise<QRCode | null> {
    const qrCodeId = this.qrCodesByPixKey.get(pixKey);
    if (!qrCodeId) return null;
    return this.qrCodes.get(qrCodeId) || null;
  }

  async findByUserId(userId: string): Promise<QRCode[]> {
    const qrCodeIds = this.qrCodesByUserId.get(userId) || [];
    return qrCodeIds
      .map(id => this.qrCodes.get(id))
      .filter((qrCode): qrCode is QRCode => qrCode !== undefined);
  }

  async updateStatus(id: string, status: QRCodeStatus): Promise<QRCode | null> {
    const qrCode = this.qrCodes.get(id);
    if (!qrCode) return null;
    
    const updatedQRCode: QRCode = {
      ...qrCode,
      status,
      updatedAt: new Date(),
    };
    
    this.qrCodes.set(id, updatedQRCode);
    
    return updatedQRCode;
  }

  async list(): Promise<QRCode[]> {
    return Array.from(this.qrCodes.values());
  }

  // Helper method to clean up expired QR codes
  async cleanupExpired(): Promise<void> {
    const now = new Date();
    for (const [id, qrCode] of this.qrCodes.entries()) {
      if (qrCode.expiresAt < now && qrCode.status === QRCodeStatus.ACTIVE) {
        await this.updateStatus(id, QRCodeStatus.EXPIRED);
      }
    }
  }
}

// Singleton instance
export const qrCodeRepository = new QRCodeRepository(); 