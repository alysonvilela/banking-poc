import { Account, AccountStatus } from '../domain/account';
import { accountRepository } from '../repositories/accountRepository';
import { transactionRepository } from '../repositories/transactionRepository';

class AccountService {
  /**
   * Get account by ID
   */
  async getAccountById(id: string): Promise<Account | null> {
    return accountRepository.findById(id);
  }

  /**
   * Get account by user ID
   */
  async getAccountByUserId(userId: string): Promise<Account | null> {
    return accountRepository.findByUserId(userId);
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string): Promise<number> {
    const account = await accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }
    
    return account.balance;
  }

  /**
   * Update account status
   */
  async updateStatus(accountId: string, status: AccountStatus): Promise<Account> {
    const account = await accountRepository.updateStatus(accountId, status);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }
    
    return account;
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(accountId: string): Promise<any[]> {
    const account = await accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }
    
    const transactions = await transactionRepository.findByAccountId(accountId);
    
    return transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
      // Don't expose full metadata to the client
      relatedTo: transaction.metadata?.qrCodeId || transaction.metadata?.productId
    }));
  }
}

// Singleton instance
export const accountService = new AccountService(); 