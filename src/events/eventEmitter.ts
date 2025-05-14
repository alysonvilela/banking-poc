import { EventEmitter } from 'events';
import { Transaction } from '../domain/transaction';

// Define event types
export enum EventType {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_FAILED = 'transaction.failed',
  TRANSACTION_REFUNDED = 'transaction.refunded',
}

// Define event data types
export interface TransactionEvent {
  transaction: Transaction;
  timestamp: Date;
}

// Create a typed event emitter
class TypedEventEmitter extends EventEmitter {
  // Transaction events
  emit(event: EventType.TRANSACTION_CREATED, data: TransactionEvent): boolean;
  emit(event: EventType.TRANSACTION_COMPLETED, data: TransactionEvent): boolean;
  emit(event: EventType.TRANSACTION_FAILED, data: TransactionEvent): boolean;
  emit(event: EventType.TRANSACTION_REFUNDED, data: TransactionEvent): boolean;
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: EventType.TRANSACTION_CREATED, listener: (data: TransactionEvent) => void): this;
  on(event: EventType.TRANSACTION_COMPLETED, listener: (data: TransactionEvent) => void): this;
  on(event: EventType.TRANSACTION_FAILED, listener: (data: TransactionEvent) => void): this;
  on(event: EventType.TRANSACTION_REFUNDED, listener: (data: TransactionEvent) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  once(event: EventType.TRANSACTION_CREATED, listener: (data: TransactionEvent) => void): this;
  once(event: EventType.TRANSACTION_COMPLETED, listener: (data: TransactionEvent) => void): this;
  once(event: EventType.TRANSACTION_FAILED, listener: (data: TransactionEvent) => void): this;
  once(event: EventType.TRANSACTION_REFUNDED, listener: (data: TransactionEvent) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.once(event, listener);
  }

  off(event: EventType.TRANSACTION_CREATED, listener: (data: TransactionEvent) => void): this;
  off(event: EventType.TRANSACTION_COMPLETED, listener: (data: TransactionEvent) => void): this;
  off(event: EventType.TRANSACTION_FAILED, listener: (data: TransactionEvent) => void): this;
  off(event: EventType.TRANSACTION_REFUNDED, listener: (data: TransactionEvent) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }
}

// Create and export a singleton instance
export const eventEmitter = new TypedEventEmitter(); 