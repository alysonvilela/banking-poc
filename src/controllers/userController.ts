import { Hono } from 'hono';
import { userService } from '../services/userService';

// Create user controller
const userController = new Hono();

// Create user endpoint
userController.post('/', async (c) => {
  try {
    const userData = await c.req.json();
    
    // Validate user data
    if (!userData.name) {
      return c.json({
        success: false,
        error: 'Name is required',
      }, 400);
    }
    
    if (!userData.cpf || !/^\d{11}$/.test(userData.cpf)) {
      return c.json({
        success: false,
        error: 'CPF must be 11 digits',
      }, 400);
    }
    
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return c.json({
        success: false,
        error: 'Invalid email address',
      }, 400);
    }
    
    const result = await userService.createUser(userData);
    
    return c.json({
      success: true,
      data: {
        user: result.user,
        accountId: result.accountId,
      },
    }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 400);
  }
});

// Get user by ID endpoint
userController.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = await userService.getUserById(id);
    
    if (!user) {
      return c.json({
        success: false,
        error: `User with ID ${id} not found`,
      }, 404);
    }
    
    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

// Get user by CPF endpoint
userController.get('/cpf/:cpf', async (c) => {
  try {
    const cpf = c.req.param('cpf');
    const user = await userService.getUserByCpf(cpf);
    
    if (!user) {
      return c.json({
        success: false,
        error: `User with CPF ${cpf} not found`,
      }, 404);
    }
    
    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user by CPF:', error);
    
    return c.json({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
});

export { userController }; 