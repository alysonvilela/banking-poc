import { z } from 'zod'
import { BankingService } from '../services/banking-service'

export const TransactionWebhookSchema = z.object({
  type: z.enum(['PIX', 'TED', 'TRANSFER', 'REFUND']),
  amount: z.number(),
  qrCode: z.string().optional(),
  document: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  metadata: z.record(z.any()),
})

export class TransactionWebhookHandler {
  constructor(private readonly bankingService: BankingService) {}

  async handle(data: z.infer<typeof TransactionWebhookSchema>) {
    // Validate webhook data
    const validatedData = TransactionWebhookSchema.parse(data)

    // Process the transaction
    const transaction = await this.bankingService.handleWebhook(validatedData)

    // Here you could:
    // 1. Update transaction status in your database
    // 2. Notify users about the transaction
    // 3. Trigger any business logic based on the transaction
    // 4. Send notifications to other services

    return transaction
  }
} 