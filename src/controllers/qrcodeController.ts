import { Hono } from 'hono';
import { qrCodeService } from '../services/qrcodeService';

// Create QR code controller
const qrCodeController = new Hono();

// Generate QR code endpoint
qrCodeController.post('/', async (c) => {
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
    
    const qrCode = await qrCodeService.generateQRCode(data);
    
    return c.json({
      success: true,
      data: qrCode,
    }, 201);
  } catch (error) {
    console.error('Error generating QR code:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get QR code by ID endpoint
qrCodeController.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const qrCode = await qrCodeService.getQRCodeById(id);
    
    if (!qrCode) {
      return c.json({
        success: false,
        error: `QR code with ID ${id} not found`,
      }, 404);
    }
    
    return c.json({
      success: true,
      data: qrCode,
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get QR codes by user ID endpoint
qrCodeController.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const qrCodes = await qrCodeService.getQRCodesByUserId(userId);
    
    return c.json({
      success: true,
      data: qrCodes,
    });
  } catch (error) {
    console.error('Error getting QR codes by user ID:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Cancel QR code endpoint
qrCodeController.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const qrCode = await qrCodeService.cancelQRCode(id);
    
    if (!qrCode) {
      return c.json({
        success: false,
        error: `QR code with ID ${id} not found`,
      }, 404);
    }
    
    return c.json({
      success: true,
      data: qrCode,
    });
  } catch (error) {
    console.error('Error cancelling QR code:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

export { qrCodeController }; 