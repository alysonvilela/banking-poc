import { Transaction, TransactionStatus, TransactionType } from '../domain/transaction';
import { TransactionStrategy, transactionStrategyRegistry } from './transactionStrategy';
import { userRepository } from '../repositories/userRepository';
import { accountRepository } from '../repositories/accountRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { eventEmitter, EventType } from '../events/eventEmitter';

/**
 * Strategy for handling TED deposit transactions
 */
class TedTransactionStrategy implements TransactionStrategy {
  readonly type = 'ted';
  
  /**
   * Check if this strategy can handle the transaction
   */
  canHandle(transaction: Transaction): boolean {
    return transaction.type === TransactionType.IN;
  }
  
  /**
   * Process a TED deposit transaction
   */
  async process(transaction: Transaction): Promise<Transaction> {
    // For TED deposits, we identify the user by the sender's CPF/document in the metadata
    const senderDocument = transaction.metadata?.senderDocument;
    if (!senderDocument) {
      return this.handleFailure(transaction, 'Missing sender document in transaction metadata');
    }
    
    // Find the user by CPF/document
    const user = await userRepository.findByCpf(senderDocument as string);
    if (!user) {
      return this.handleFailure(transaction, 'User not found for sender document');
    }
    
    // Find the account
    const account = await accountRepository.findByUserId(user.id);
    if (!account) {
      return this.handleFailure(transaction, 'Account not found for user');
    }
    
    // Update transaction with the user ID and account ID
    let updatedTransaction = await transactionRepository.updateMetadata(transaction.id, {
      userId: user.id,
      accountId: account.id
    });
    
    if (!updatedTransaction) {
      return this.handleFailure(transaction, 'Failed to update transaction metadata');
    }
    
    // Update account balance
    await accountRepository.updateBalance(account.id, transaction.amount);
    
    // Mark transaction as completed
    updatedTransaction = await transactionRepository.updateStatus(transaction.id, TransactionStatus.COMPLETED);
    
    if (!updatedTransaction) {
      // This should not happen, but handle it just in case
      console.error('Failed to update transaction status');
      return transaction;
    }
    
    // Emit event for completed transaction
    eventEmitter.emit(EventType.TRANSACTION_COMPLETED, {
      transaction: updatedTransaction,
      timestamp: new Date()
    });
    
    return updatedTransaction;
  }
  
  /**
   * Helper method to handle transaction failures
   */
  private async handleFailure(transaction: Transaction, reason: string): Promise<Transaction> {
    const updatedTransaction = await transactionRepository.updateStatus(transaction.id, TransactionStatus.FAILED);
    
    if (!updatedTransaction) {
      // This should not happen, but handle it just in case
      console.error('Failed to update transaction status');
      return {
        ...transaction,
        status: TransactionStatus.FAILED,
        metadata: {
          ...transaction.metadata,
          failureReason: reason
        }
      };
    }
    
    // Update metadata with failure reason
    const finalTransaction = await transactionRepository.updateMetadata(updatedTransaction.id, {
      failureReason: reason
    });
    
    // Emit event for failed transaction
    eventEmitter.emit(EventType.TRANSACTION_FAILED, {
      transaction: finalTransaction || updatedTransaction,
      timestamp: new Date()
    });
    
    return finalTransaction || updatedTransaction;
  }
}

// Create and register the strategy
const tedStrategy = new TedTransactionStrategy();
transactionStrategyRegistry.register(tedStrategy);

export { tedStrategy }; 