import { Hono } from 'hono'
import { z } from 'zod'
import { BankingService } from './core/banking-core/services/banking-service'
import { TransactionWebhookHandler } from './core/banking-core/webhooks/transaction-webhook'

const app = new Hono()

// Initialize services
const bankingService = new BankingService({
  apiKey: process.env.FITBANK_API_KEY || '',
  baseUrl: process.env.FITBANK_API_URL || '',
})

const webhookHandler = new TransactionWebhookHandler(bankingService)

// Routes
app.post('/webhook/transaction', async (c) => {
  const data = await c.req.json()
  const transaction = await webhookHandler.handle(data)
  return c.json(transaction)
})

app.post('/accounts', async (c) => {
  const data = await c.req.json()
  const account = await bankingService.createUserAccount(data)
  return c.json(account)
})

app.post('/qrcodes', async (c) => {
  const data = await c.req.json()
  const qrCode = await bankingService.createQRCode(
    data.userId,
    data.productId,
    data.amount,
    data.description
  )
  return c.json(qrCode)
})

app.post('/transfers', async (c) => {
  const data = await c.req.json()
  const transfer = await bankingService.transfer(data.userId, data)
  return c.json(transfer)
})

app.post('/refunds', async (c) => {
  const data = await c.req.json()
  const refund = await bankingService.refund(data.userId, data)
  return c.json(refund)
})

app.get('/transactions/:userId', async (c) => {
  const userId = c.req.param('userId')
  const transactions = bankingService.getTransactions(userId)
  return c.json(transactions)
})

app.get('/qrcodes/:userId', async (c) => {
  const userId = c.req.param('userId')
  const qrCodes = bankingService.getQRCodes(userId)
  return c.json(qrCodes)
})

export default app
