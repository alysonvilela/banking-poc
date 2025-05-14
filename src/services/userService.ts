import { CreateUserDto, User } from '../domain/user';
import { userRepository } from '../repositories/userRepository';
import { accountRepository } from '../repositories/accountRepository';
import { bankApiClient } from '../httpClient/bankApiClient';

class UserService {
  /**
   * Create a new user with an associated child account
   */
  async createUser(userData: CreateUserDto): Promise<{ user: User, accountId: string }> {
    // Validate input
    if (!userData.name || !userData.cpf || !userData.email) {
      throw new Error('Name, CPF, and email are required');
    }
    
    // Check if user with this CPF already exists
    const existingUser = await userRepository.findByCpf(userData.cpf);
    if (existingUser) {
      throw new Error(`User with CPF ${userData.cpf} already exists`);
    }
    
    // Create user in our system
    const user = await userRepository.create(userData);
    
    try {
      // Create child account in external banking API
      const externalAccount = await bankApiClient.createChildAccount(
        user.name,
        user.cpf
      );
      
      // Create account in our system linked to the external account
      const account = await accountRepository.create(user.id, externalAccount.accountId);
      
      return {
        user,
        accountId: account.id
      };
    } catch (error) {
      // If account creation fails, delete the user
      await userRepository.delete(user.id);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  /**
   * Get user by CPF
   */
  async getUserByCpf(cpf: string): Promise<User | null> {
    return userRepository.findByCpf(cpf);
  }
}

// Singleton instance
export const userService = new UserService(); 