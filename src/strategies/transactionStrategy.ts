import { Transaction } from '../domain/transaction';

/**
 * Base transaction strategy interface
 * Defines how different types of transactions are processed
 */
export interface TransactionStrategy {
  /**
   * Unique identifier for the strategy
   */
  readonly type: string;
  
  /**
   * Process a transaction according to this strategy
   * @param transaction The transaction to process
   * @returns The processed transaction
   */
  process(transaction: Transaction): Promise<Transaction>;
  
  /**
   * Check if this strategy can handle the given transaction
   * @param transaction The transaction to check
   * @returns True if this strategy can handle the transaction
   */
  canHandle(transaction: Transaction): boolean;
}

/**
 * Registry for transaction strategies
 */
class TransactionStrategyRegistry {
  private strategies: Map<string, TransactionStrategy> = new Map();
  
  /**
   * Register a new strategy
   * @param strategy The strategy to register
   */
  register(strategy: TransactionStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }
  
  /**
   * Get a strategy that can handle the given transaction
   * @param transaction The transaction to handle
   * @returns The appropriate strategy or undefined if none found
   */
  getStrategy(transaction: Transaction): TransactionStrategy | undefined {
    for (const strategy of this.strategies.values()) {
      if (strategy.canHandle(transaction)) {
        return strategy;
      }
    }
    return undefined;
  }
  
  /**
   * Get a strategy by its type
   * @param type The strategy type
   * @returns The strategy or undefined if not found
   */
  getStrategyByType(type: string): TransactionStrategy | undefined {
    return this.strategies.get(type);
  }
}

// Create and export a singleton registry
export const transactionStrategyRegistry = new TransactionStrategyRegistry(); 