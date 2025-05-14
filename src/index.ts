import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import { userController } from './controllers/userController'
import { accountController } from './controllers/accountController'
import { qrCodeController } from './controllers/qrcodeController'
import { transactionController } from './controllers/transactionController'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'Banking Core POC API' }))

// Register controllers
app.route('/api/users', userController)
app.route('/api/accounts', accountController)
app.route('/api/qrcodes', qrCodeController)
app.route('/api/transactions', transactionController)

// Documentation route
app.get('/api/docs', (c) => {
  return c.json({
    name: 'Banking Core POC API',
    version: '1.0.0',
    description: 'A proof of concept banking proxy service',
    endpoints: [
      {
        path: '/api/users',
        methods: ['POST'],
        description: 'Create a new user with associated account'
      },
      {
        path: '/api/users/:id',
        methods: ['GET'],
        description: 'Get user by ID'
      },
      {
        path: '/api/users/cpf/:cpf',
        methods: ['GET'],
        description: 'Get user by CPF'
      },
      {
        path: '/api/accounts/:id',
        methods: ['GET'],
        description: 'Get account by ID'
      },
      {
        path: '/api/accounts/user/:userId',
        methods: ['GET'],
        description: 'Get account by user ID'
      },
      {
        path: '/api/accounts/:id/balance',
        methods: ['GET'],
        description: 'Get account balance'
      },
      {
        path: '/api/accounts/:id/transactions',
        methods: ['GET'],
        description: 'Get transaction history for an account'
      },
      {
        path: '/api/qrcodes',
        methods: ['POST'],
        description: 'Generate a PIX QR code'
      },
      {
        path: '/api/qrcodes/:id',
        methods: ['GET', 'DELETE'],
        description: 'Get or cancel a QR code'
      },
      {
        path: '/api/qrcodes/user/:userId',
        methods: ['GET'],
        description: 'Get QR codes for a user'
      },
      {
        path: '/api/transactions/transfer',
        methods: ['POST'],
        description: 'Transfer money to an external account'
      },
      {
        path: '/api/transactions/refund/:id',
        methods: ['POST'],
        description: 'Refund a transaction'
      },
      {
        path: '/api/transactions/webhook',
        methods: ['POST'],
        description: 'Webhook endpoint for transaction notifications'
      },
      {
        path: '/api/transactions/simulate/pix',
        methods: ['POST'],
        description: 'Simulate a PIX deposit (for testing)'
      },
      {
        path: '/api/transactions/simulate/ted',
        methods: ['POST'],
        description: 'Simulate a TED deposit (for testing)'
      }
    ]
  })
})

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err)
  return c.json({
    success: false,
    error: err.message || 'Internal server error',
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
  }, 404)
})

export default app
