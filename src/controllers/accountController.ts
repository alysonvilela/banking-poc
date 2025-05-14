import { Hono } from 'hono';
import { accountService } from '../services/accountService';

// Create account controller
const accountController = new Hono();

// Get account by ID endpoint
accountController.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const account = await accountService.getAccountById(id);
    
    if (!account) {
      return c.json({
        success: false,
        error: `Account with ID ${id} not found`,
      }, 404);
    }
    
    return c.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Error getting account:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get account by user ID endpoint
accountController.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const account = await accountService.getAccountByUserId(userId);
    
    if (!account) {
      return c.json({
        success: false,
        error: `Account for user ${userId} not found`,
      }, 404);
    }
    
    return c.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Error getting account by user ID:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get account balance endpoint
accountController.get('/:id/balance', async (c) => {
  try {
    const id = c.req.param('id');
    const balance = await accountService.getBalance(id);
    
    return c.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    console.error('Error getting account balance:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get transaction history endpoint
accountController.get('/:id/transactions', async (c) => {
  try {
    const id = c.req.param('id');
    const transactions = await accountService.getTransactionHistory(id);
    
    return c.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

export { accountController }; 