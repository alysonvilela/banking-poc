import { Account, AccountStatus } from '../domain/account';
import { generateId } from '../utils/id';

class AccountRepository {
  private accounts: Map<string, Account> = new Map();
  private accountsByUserId: Map<string, string[]> = new Map(); // Map user ID to account IDs

  async create(userId: string, externalAccountId: string): Promise<Account> {
    const id = generateId();
    const now = new Date();
    
    const account: Account = {
      id,
      userId,
      externalAccountId,
      balance: 0,
      status: AccountStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    
    this.accounts.set(id, account);
    
    // Track user's accounts
    const userAccounts = this.accountsByUserId.get(userId) || [];
    userAccounts.push(id);
    this.accountsByUserId.set(userId, userAccounts);
    
    return account;
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Account | null> {
    const accountIds = this.accountsByUserId.get(userId) || [];
    if (accountIds.length === 0) return null;
    
    // For this POC, assume each user has only one account
    // and return the first one
    const accountId = accountIds[0];
    return this.accounts.get(accountId) || null;
  }

  async updateBalance(id: string, amount: number): Promise<Account | null> {
    const account = this.accounts.get(id);
    if (!account) return null;
    
    const updatedAccount: Account = {
      ...account,
      balance: account.balance + amount,
      updatedAt: new Date(),
    };
    
    this.accounts.set(id, updatedAccount);
    
    return updatedAccount;
  }

  async updateStatus(id: string, status: AccountStatus): Promise<Account | null> {
    const account = this.accounts.get(id);
    if (!account) return null;
    
    const updatedAccount: Account = {
      ...account,
      status,
      updatedAt: new Date(),
    };
    
    this.accounts.set(id, updatedAccount);
    
    return updatedAccount;
  }

  async list(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }
}

// Singleton instance
export const accountRepository = new AccountRepository(); 