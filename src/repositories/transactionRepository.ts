import { Transaction, TransactionStatus, TransactionType } from '../domain/transaction';
import { generateId } from '../utils/id';

class TransactionRepository {
  private transactions: Map<string, Transaction> = new Map();
  private transactionsByUserId: Map<string, string[]> = new Map();
  private transactionsByAccountId: Map<string, string[]> = new Map();
  private transactionsByExternalId: Map<string, string> = new Map();

  async create(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const id = generateId();
    const now = new Date();
    
    const transaction: Transaction = {
      id,
      ...transactionData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.transactions.set(id, transaction);
    
    // Track transactions by user ID
    const userTransactions = this.transactionsByUserId.get(transaction.userId) || [];
    userTransactions.push(id);
    this.transactionsByUserId.set(transaction.userId, userTransactions);
    
    // Track transactions by account ID
    const accountTransactions = this.transactionsByAccountId.get(transaction.accountId) || [];
    accountTransactions.push(id);
    this.transactionsByAccountId.set(transaction.accountId, accountTransactions);
    
    // Track transaction by external ID
    if (transaction.externalTransactionId) {
      this.transactionsByExternalId.set(transaction.externalTransactionId, id);
    }
    
    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  async findByExternalId(externalId: string): Promise<Transaction | null> {
    const transactionId = this.transactionsByExternalId.get(externalId);
    if (!transactionId) return null;
    return this.transactions.get(transactionId) || null;
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const transactionIds = this.transactionsByUserId.get(userId) || [];
    return transactionIds
      .map(id => this.transactions.get(id))
      .filter((transaction): transaction is Transaction => transaction !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const transactionIds = this.transactionsByAccountId.get(accountId) || [];
    return transactionIds
      .map(id => this.transactions.get(id))
      .filter((transaction): transaction is Transaction => transaction !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;
    
    const updatedTransaction: Transaction = {
      ...transaction,
      status,
      updatedAt: new Date(),
    };
    
    this.transactions.set(id, updatedTransaction);
    
    return updatedTransaction;
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<Transaction | null> {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;
    
    const updatedTransaction: Transaction = {
      ...transaction,
      metadata: { ...transaction.metadata, ...metadata },
      updatedAt: new Date(),
    };
    
    this.transactions.set(id, updatedTransaction);
    
    return updatedTransaction;
  }
}

// Singleton instance
export const transactionRepository = new TransactionRepository(); 