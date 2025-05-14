import { z } from 'zod'
import { FitBankClient, CreateChildAccountSchema, CreateQRCodeSchema, TransferSchema, RefundSchema } from '../http-clients/fit-bank'

export interface User {
  id: string
  name: string
  document: string
  email: string
}

export interface Product {
  id: string
  name: string
  description: string
}

export interface Transaction {
  id: string
  userId: string
  productId?: string
  amount: number
  type: 'PIX' | 'TED' | 'TRANSFER' | 'REFUND'
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface QRCode {
  id: string
  userId: string
  productId?: string
  code: string
  amount: number
  expiresAt: Date
  createdAt: Date
}

export class BankingService {
  private readonly fitBank: FitBankClient
  private transactions: Transaction[] = []
  private qrCodes: QRCode[] = []

  constructor(fitBankConfig: { apiKey: string; baseUrl: string }) {
    this.fitBank = new FitBankClient(fitBankConfig)
  }

  async createUserAccount(user: User) {
    const childAccount = await this.fitBank.createChildAccount({
      name: user.name,
      document: user.document,
      email: user.email,
    })

    // Store user account info internally
    return childAccount
  }

  async createQRCode(userId: string, productId: string | undefined, amount: number, description: string) {
    const qrCodeResponse = await this.fitBank.createQRCode({
      amount,
      description,
      expiresIn: 3600, // 1 hour
    })

    const newQRCode: QRCode = {
      id: crypto.randomUUID(),
      userId,
      productId,
      code: qrCodeResponse.code,
      amount,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    }

    this.qrCodes.push(newQRCode)
    return newQRCode
  }

  async handleWebhook(data: {
    type: 'PIX' | 'TED' | 'TRANSFER' | 'REFUND'
    amount: number
    qrCode?: string
    document?: string
  }) {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId: '', // Will be determined based on payment method
      amount: data.amount,
      type: data.type,
      status: 'PENDING',
      metadata: data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Identify user based on payment method
    if (data.type === 'PIX' && data.qrCode) {
      const qrCode = this.qrCodes.find(qr => qr.code === data.qrCode)
      if (qrCode) {
        transaction.userId = qrCode.userId
        transaction.productId = qrCode.productId
      }
    } else if (data.type === 'TED' && data.document) {
      // Find user by CPF from TED data
      // This would need to be implemented based on your user storage
    }

    this.transactions.push(transaction)
    return transaction
  }

  async transfer(userId: string, data: z.infer<typeof TransferSchema>) {
    const transferResponse = await this.fitBank.transfer(data)
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      amount: data.amount,
      type: 'TRANSFER',
      status: 'PENDING',
      metadata: { transferId: transferResponse.id },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.transactions.push(transaction)
    return transaction
  }

  async refund(userId: string, data: z.infer<typeof RefundSchema>) {
    const refundResponse = await this.fitBank.refund(data)
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      amount: data.amount,
      type: 'REFUND',
      status: 'PENDING',
      metadata: { refundId: refundResponse.id },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.transactions.push(transaction)
    return transaction
  }

  getTransactions(userId: string) {
    return this.transactions.filter(t => t.userId === userId)
  }

  getQRCodes(userId: string) {
    return this.qrCodes.filter(qr => qr.userId === userId)
  }
} 