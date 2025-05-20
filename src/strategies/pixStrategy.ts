import { Transaction, TransactionStatus, TransactionType } from '../domain/transaction';
import { TransactionStrategy, transactionStrategyRegistry } from './transactionStrategy';
import { qrCodeRepository } from '../repositories/qrcodeRepository';
import { accountRepository } from '../repositories/accountRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { eventEmitter, EventType } from '../events/eventEmitter';
import { QRCodeStatus } from '../domain/qrcode';

/**
 * Strategy for handling PIX deposit transactions
 */
class PixTransactionStrategy implements TransactionStrategy {
  readonly type = 'pix';
  
  /**
   * Check if this strategy can handle the transaction
   */
  canHandle(transaction: Transaction): boolean {
    return transaction.type === TransactionType.IN;
  }
  
  /**
   * Process a PIX deposit transaction
   */
  async process(transaction: Transaction): Promise<Transaction> {
    // Find the QR code associated with this transaction
    const pixKey = transaction.metadata?.pixKey;
    if (!pixKey) {
      return this.handleFailure(transaction, 'Missing PIX key in transaction metadata');
    }
    
    const qrCode = await qrCodeRepository.findByPixKey(pixKey as string);
    if (!qrCode) {
      return this.handleFailure(transaction, 'QR code not found for PIX key');
    }
    
    // Check if QR code is valid
    if (qrCode.status !== QRCodeStatus.ACTIVE) {
      return this.handleFailure(transaction, `QR code is ${qrCode.status.toLowerCase()}`);
    }
    
    if (qrCode.expiresAt < new Date()) {
      await qrCodeRepository.updateStatus(qrCode.id, QRCodeStatus.EXPIRED);
      return this.handleFailure(transaction, 'QR code has expired');
    }
    
    // Check if amount matches
    if (qrCode.amount !== transaction.amount) {
      return this.handleFailure(transaction, 'Transaction amount does not match QR code amount');
    }
    
    // Find the account
    const account = await accountRepository.findByUserId(qrCode.userId);
    if (!account) {
      return this.handleFailure(transaction, 'Account not found for user');
    }
    
    // Update transaction with the account and user ID from the QR code
    let updatedTransaction = await transactionRepository.updateMetadata(transaction.id, {
      qrCodeId: qrCode.id,
      productId: qrCode.productId
    });
    
    if (!updatedTransaction) {
      return this.handleFailure(transaction, 'Failed to update transaction metadata');
    }
    
    // Update account balance
    await accountRepository.updateBalance(account.id, transaction.amount);
    
    // Mark QR code as used
    await qrCodeRepository.updateStatus(qrCode.id, QRCodeStatus.USED);
    
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
const pixStrategy = new PixTransactionStrategy();
transactionStrategyRegistry.register(pixStrategy);

export { pixStrategy }; 