import { Transaction, TransactionStatus, TransactionType, TransferDto } from '../domain/transaction';
import { transactionRepository } from '../repositories/transactionRepository';
import { accountRepository } from '../repositories/accountRepository';
import { bankApiClient } from '../httpClient/bankApiClient';
import { transactionStrategyRegistry } from '../strategies/transactionStrategy';
import { eventEmitter, EventType } from '../events/eventEmitter';
import { TransactionPaymentMethod } from '../domain/transaction';

class TransactionService {
  /**
   * Process a webhook transaction notification
   */
  async processWebhookTransaction(webhookData: any): Promise<Transaction> {
    // Validate webhook data
    if (!webhookData.type || !webhookData.externalTransactionId || webhookData.amount === undefined) {
      throw new Error('Invalid webhook data: missing type, externalTransactionId, or amount');
    }
    
    // Check if this transaction was already processed
    const existingTransaction = await transactionRepository.findByExternalId(webhookData.externalTransactionId);
    if (existingTransaction) {
      return existingTransaction; // Transaction already processed
    }
    
    // Create transaction record
    const transaction = await transactionRepository.create({
      userId: webhookData.userId || '', // May be empty initially for some transaction types
      accountId: webhookData.accountId || '', // May be empty initially for some transaction types
      externalTransactionId: webhookData.externalTransactionId,
      type: this.mapWebhookTypeToTransactionType(webhookData.type),
      amount: webhookData.amount,
      status: TransactionStatus.PENDING,
      metadata: webhookData.metadata || {},
      description: webhookData.description,
      transferId: null,
      transactionRefundId: null,
      paymentMethod: webhookData.paymentMethod || TransactionPaymentMethod.PIX,
      failedAt: null,
    });
    
    // Emit transaction created event
    eventEmitter.emit(EventType.TRANSACTION_CREATED, {
      transaction,
      timestamp: new Date()
    });
    
    // Process the transaction based on its type
    const strategy = transactionStrategyRegistry.getStrategy(transaction);
    if (!strategy) {
      const updatedTransaction = await transactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.FAILED
      );
      
      throw new Error(`No strategy found for transaction type: ${transaction.type}`);
    }
    
    // Process transaction with the appropriate strategy
    const processedTransaction = await strategy.process(transaction);
    
    return processedTransaction;
  }

  /**
   * Transfer money from a user's account to an external account
   */
  async transferToExternalAccount(transferData: TransferDto): Promise<Transaction> {
    // Get user's account
    const account = await accountRepository.findByUserId(transferData.userId);
    if (!account) {
      throw new Error(`Account not found for user ${transferData.userId}`);
    }
    
    // Check if account has sufficient balance
    if (account.balance < transferData.amount) {
      throw new Error('Insufficient balance for transfer');
    }
    
    // Create pending transaction in our system
    const transaction = await transactionRepository.create({
      userId: transferData.userId,
      accountId: account.id,
      externalTransactionId: '', // Will be updated after bank API call
      type: TransactionType.OUT,
      amount: transferData.amount,
      status: TransactionStatus.PENDING,
      metadata: {},
      description: transferData.description,
      transferId: null,
      transactionRefundId: null,
      paymentMethod: TransactionPaymentMethod.PIX,
      failedAt: null,
    });
    
    try {
      // Call bank API to make the transfer
      const result = await bankApiClient.transferToExternalAccount(
        account.externalAccountId,
        transferData.amount,
        transferData.destinationBank,
        transferData.destinationBranch,
        transferData.destinationAccount,
        transferData.destinationAccountHolder,
        transferData.destinationDocumentNumber,
        transferData.description
      );
      
      // Update transaction with external ID
      let updatedTransaction = await transactionRepository.updateMetadata(transaction.id, {
        externalTransactionId: result.transactionId
      });
      
      if (!updatedTransaction) {
        throw new Error('Failed to update transaction with external ID');
      }
      
      // Update account balance
      await accountRepository.updateBalance(account.id, -transferData.amount);
      
      // Mark transaction as completed
      updatedTransaction = await transactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.COMPLETED
      );
      
      // Emit completed event
      eventEmitter.emit(EventType.TRANSACTION_COMPLETED, {
        transaction: updatedTransaction || transaction,
        timestamp: new Date()
      });
      
      return updatedTransaction || transaction;
      
    } catch (error) {
      // Mark transaction as failed
      const failedTransaction = await transactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.FAILED
      );
      
      // Add error details to metadata
      const updatedTransaction = await transactionRepository.updateMetadata(
        transaction.id,
        { failureReason: (error as Error).message }
      );
      
      // Emit failed event
      eventEmitter.emit(EventType.TRANSACTION_FAILED, {
        transaction: updatedTransaction || failedTransaction || transaction,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(transactionId: string): Promise<Transaction> {
    // Get the original transaction
    const originalTransaction = await transactionRepository.findById(transactionId);
    if (!originalTransaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }
    
    // Check if transaction can be refunded
    if (originalTransaction.status !== TransactionStatus.COMPLETED) {
      throw new Error(`Transaction with ID ${transactionId} cannot be refunded (status: ${originalTransaction.status})`);
    }
    
    if (originalTransaction.type === TransactionType.OUT) {
      throw new Error('Cannot refund a withdrawal transaction');
    }
    
    // Check if transaction was already refunded
    const existingRefund = await transactionRepository.findByUserId(originalTransaction.userId);
    const alreadyRefunded = existingRefund.some(tx => 
      tx.type === TransactionType.OUT && 
      tx.metadata?.originalTransactionId === originalTransaction.id &&
      tx.status !== TransactionStatus.FAILED
    );
    
    if (alreadyRefunded) {
      throw new Error(`Transaction with ID ${transactionId} was already refunded`);
    }
    
    // Get user's account
    const account = await accountRepository.findById(originalTransaction.accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    
    // Create refund transaction
    const refundTransaction = await transactionRepository.create({
      userId: originalTransaction.userId,
      accountId: originalTransaction.accountId,
      externalTransactionId: '', // Will be updated after bank API call
      type: TransactionType.OUT,
      amount: -originalTransaction.amount, // Inverse of the original amount
      status: TransactionStatus.PENDING,
      metadata: {
        originalTransactionId: originalTransaction.id
      },
      description: `Refund for transaction ${originalTransaction.id}`,
      transferId: null,
      transactionRefundId: null,
      paymentMethod: TransactionPaymentMethod.PIX,
      failedAt: null,
    });
    
    try {
      // Call bank API to make the refund
      const result = await bankApiClient.refundTransaction(originalTransaction.externalTransactionId);
      
      // Update refund transaction with external ID
      let updatedTransaction = await transactionRepository.updateMetadata(refundTransaction.id, {
        externalTransactionId: result.transactionId
      });
      
      if (!updatedTransaction) {
        throw new Error('Failed to update refund transaction with external ID');
      }
      
      // Update account balance
      await accountRepository.updateBalance(account.id, -originalTransaction.amount);
      
      // Mark original transaction as refunded
      await transactionRepository.updateStatus(originalTransaction.id, TransactionStatus.REFUNDED);
      
      // Mark refund transaction as completed
      updatedTransaction = await transactionRepository.updateStatus(
        refundTransaction.id,
        TransactionStatus.COMPLETED
      );
      
      // Emit completed event
      eventEmitter.emit(EventType.TRANSACTION_COMPLETED, {
        transaction: updatedTransaction || refundTransaction,
        timestamp: new Date()
      });
      
      return updatedTransaction || refundTransaction;
      
    } catch (error) {
      // Mark refund transaction as failed
      const failedTransaction = await transactionRepository.updateStatus(
        refundTransaction.id,
        TransactionStatus.FAILED
      );
      
      // Add error details to metadata
      const updatedTransaction = await transactionRepository.updateMetadata(
        refundTransaction.id,
        { failureReason: (error as Error).message }
      );
      
      // Emit failed event
      eventEmitter.emit(EventType.TRANSACTION_FAILED, {
        transaction: updatedTransaction || failedTransaction || refundTransaction,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Map webhook notification type to our internal transaction type
   */
  private mapWebhookTypeToTransactionType(webhookType: string): TransactionType {
    const typeMap: Record<string, TransactionType> = {
      'pix.deposit': TransactionType.IN,
      'ted.deposit': TransactionType.IN,
      'transfer.outgoing': TransactionType.OUT,
      'refund': TransactionType.OUT,
    };
    
    return typeMap[webhookType] || TransactionType.IN;
  }
}

// Singleton instance
export const transactionService = new TransactionService(); 