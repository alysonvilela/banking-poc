export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  externalTransactionId: string; // ID from external banking API
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  PIX_DEPOSIT = 'PIX_DEPOSIT',
  TED_DEPOSIT = 'TED_DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  REFUND = 'REFUND'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export type TransferDto = {
  userId: string;
  amount: number;
  destinationBank: string;
  destinationBranch: string;
  destinationAccount: string;
  destinationAccountHolder: string;
  destinationDocumentNumber: string;
  description?: string;
}; 