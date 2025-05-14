import { z } from 'zod'

export interface FitBankConfig {
  apiKey: string
  baseUrl: string
}

export const CreateChildAccountSchema = z.object({
  name: z.string(),
  document: z.string(),
  email: z.string(),
})

export const CreateQRCodeSchema = z.object({
  amount: z.number(),
  description: z.string(),
  expiresIn: z.number(), // seconds
})

export const TransferSchema = z.object({
  amount: z.number(),
  document: z.string(),
  bankCode: z.string(),
  agency: z.string(),
  account: z.string(),
  description: z.string(),
})

export const RefundSchema = z.object({
  transactionId: z.string(),
  amount: z.number(),
  description: z.string(),
})

export const ChildAccountResponseSchema = z.object({
  id: z.string(),
  accountNumber: z.string(),
  agency: z.string(),
})

export const QRCodeResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  expiresAt: z.string(),
})

export const TransferResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
})

export const RefundResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
})

export class FitBankClient {
  private readonly config: FitBankConfig

  constructor(config: FitBankConfig) {
    this.config = config
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`FitBank API error: ${response.statusText}`)
    }

    return response.json()
  }

  async createChildAccount(data: z.infer<typeof CreateChildAccountSchema>): Promise<z.infer<typeof ChildAccountResponseSchema>> {
    return this.request('/accounts/child', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createQRCode(data: z.infer<typeof CreateQRCodeSchema>): Promise<z.infer<typeof QRCodeResponseSchema>> {
    return this.request('/pix/qrcode', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async transfer(data: z.infer<typeof TransferSchema>): Promise<z.infer<typeof TransferResponseSchema>> {
    return this.request('/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async refund(data: z.infer<typeof RefundSchema>): Promise<z.infer<typeof RefundResponseSchema>> {
    return this.request('/refunds', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}



