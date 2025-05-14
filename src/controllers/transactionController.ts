import { Hono } from 'hono';
import { transactionService } from '../services/transactionService';
import { TransactionType } from '../domain/transaction';

// Create transaction controller
const transactionController = new Hono();

// Transfer to external account endpoint
transactionController.post('/transfer', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validate required fields
    if (!data.userId) {
      return c.json({
        success: false,
        error: 'User ID is required',
      }, 400);
    }
    
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      return c.json({
        success: false,
        error: 'Amount must be a positive number',
      }, 400);
    }
    
    if (!data.destinationBank) {
      return c.json({
        success: false,
        error: 'Destination bank is required',
      }, 400);
    }
    
    if (!data.destinationBranch) {
      return c.json({
        success: false,
        error: 'Destination branch is required',
      }, 400);
    }
    
    if (!data.destinationAccount) {
      return c.json({
        success: false,
        error: 'Destination account is required',
      }, 400);
    }
    
    if (!data.destinationAccountHolder) {
      return c.json({
        success: false,
        error: 'Destination account holder name is required',
      }, 400);
    }
    
    if (!data.destinationDocumentNumber) {
      return c.json({
        success: false,
        error: 'Destination document number is required',
      }, 400);
    }
    
    const transaction = await transactionService.transferToExternalAccount(data);
    
    return c.json({
      success: true,
      data: transaction,
    }, 201);
  } catch (error) {
    console.error('Error transferring to external account:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 400);
  }
});

// Refund transaction endpoint
transactionController.post('/refund/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const transaction = await transactionService.refundTransaction(id);
    
    return c.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error refunding transaction:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 400);
  }
});

// Webhook endpoint for handling transaction notifications
transactionController.post('/webhook', async (c) => {
  try {
    const webhookData = await c.req.json();
    
    // Validate webhook data
    if (!webhookData.type) {
      return c.json({
        success: false,
        error: 'Webhook type is required',
      }, 400);
    }
    
    if (!webhookData.externalTransactionId) {
      return c.json({
        success: false,
        error: 'External transaction ID is required',
      }, 400);
    }
    
    if (webhookData.amount === undefined) {
      return c.json({
        success: false,
        error: 'Transaction amount is required',
      }, 400);
    }
    
    const transaction = await transactionService.processWebhookTransaction(webhookData);
    
    return c.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 400);
  }
});

// Simulate PIX deposit (for testing)
transactionController.post('/simulate/pix', async (c) => {
  try {
    const data = await c.req.json();
    
    if (!data.pixKey) {
      return c.json({
        success: false,
        error: 'PIX key is required',
      }, 400);
    }
    
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      return c.json({
        success: false,
        error: 'Amount must be a positive number',
      }, 400);
    }
    
    // Create webhook-like data
    const webhookData = {
      type: 'pix.deposit',
      externalTransactionId: `sim-${crypto.randomUUID().substring(0, 8)}`,
      amount: data.amount,
      metadata: {
        pixKey: data.pixKey
      }
    };
    
    const transaction = await transactionService.processWebhookTransaction(webhookData);
    
    return c.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error simulating PIX deposit:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 400);
  }
});

// Simulate TED deposit (for testing)
transactionController.post('/simulate/ted', async (c) => {
  try {
    const data = await c.req.json();
    
    if (!data.accountId) {
      return c.json({
        success: false,
        error: 'Account ID is required',
      }, 400);
    }
    
    if (!data.senderDocument) {
      return c.json({
        success: false,
        error: 'Sender document (CPF) is required',
      }, 400);
    }
    
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      return c.json({
        success: false,
        error: 'Amount must be a positive number',
      }, 400);
    }
    
    // Create webhook-like data
    const webhookData = {
      type: 'ted.deposit',
      externalTransactionId: `sim-${crypto.randomUUID().substring(0, 8)}`,
      amount: data.amount,
      metadata: {
        senderDocument: data.senderDocument
      }
    };
    
    const transaction = await transactionService.processWebhookTransaction(webhookData);
    
    return c.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error simulating TED deposit:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 400);
  }
});

export { transactionController }; 