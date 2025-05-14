import { CreateQRCodeDto, QRCode, QRCodeStatus } from '../domain/qrcode';
import { qrCodeRepository } from '../repositories/qrcodeRepository';
import { userRepository } from '../repositories/userRepository';
import { bankApiClient } from '../httpClient/bankApiClient';

class QRCodeService {
  /**
   * Generate a PIX QR code for a user
   */
  async generateQRCode(data: CreateQRCodeDto): Promise<QRCode> {
    // Validate user exists
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new Error(`User with ID ${data.userId} not found`);
    }
    
    // Validate amount is positive
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Generate QR code via bank API
    const qrCodeResponse = await bankApiClient.generatePixQRCode(data.amount);
    
    // Create QR code record in our system
    const qrCode = await qrCodeRepository.create({
      ...data,
      pixKey: qrCodeResponse.pixKey,
      encodedImage: qrCodeResponse.qrCodeImage,
      expiresAt: new Date(qrCodeResponse.expiresAt),
    });
    
    return qrCode;
  }

  /**
   * Get QR code by ID
   */
  async getQRCodeById(id: string): Promise<QRCode | null> {
    const qrCode = await qrCodeRepository.findById(id);
    
    // Clean up expired QR codes
    if (qrCode && qrCode.status === QRCodeStatus.ACTIVE && qrCode.expiresAt < new Date()) {
      return qrCodeRepository.updateStatus(id, QRCodeStatus.EXPIRED);
    }
    
    return qrCode;
  }

  /**
   * Get QR codes for a user
   */
  async getQRCodesByUserId(userId: string): Promise<QRCode[]> {
    // Get all QR codes for the user
    const qrCodes = await qrCodeRepository.findByUserId(userId);
    
    // Clean up any expired QR codes
    const now = new Date();
    for (const qrCode of qrCodes) {
      if (qrCode.status === QRCodeStatus.ACTIVE && qrCode.expiresAt < now) {
        await qrCodeRepository.updateStatus(qrCode.id, QRCodeStatus.EXPIRED);
      }
    }
    
    // Return updated list
    return qrCodeRepository.findByUserId(userId);
  }

  /**
   * Cancel a QR code
   */
  async cancelQRCode(id: string): Promise<QRCode | null> {
    const qrCode = await qrCodeRepository.findById(id);
    if (!qrCode) {
      return null;
    }
    
    // Only active QR codes can be cancelled
    if (qrCode.status !== QRCodeStatus.ACTIVE) {
      throw new Error(`QR code is already ${qrCode.status.toLowerCase()}`);
    }
    
    return qrCodeRepository.updateStatus(id, QRCodeStatus.CANCELLED);
  }

  /**
   * Clean up expired QR codes
   */
  async cleanupExpiredQRCodes(): Promise<void> {
    await qrCodeRepository.cleanupExpired();
  }
}

// Singleton instance
export const qrCodeService = new QRCodeService(); 