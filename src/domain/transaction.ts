export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  externalTransactionId: string; // ID from external banking API
  transferId: string | null;
  transactionRefundId: string | null;

  type: TransactionType;
  paymentMethod: TransactionPaymentMethod;
  status: TransactionStatus;

  amount: number;

  metadata?: Record<string, any>;
  description?: string;

  createdAt: Date;
  failedAt: Date | null;
  updatedAt: Date | null;
}



export enum TransactionType {
  IN = "IN",
  OUT = "OUT",
}

export enum TransactionPaymentMethod {
  PIX = "PIX",
  TED = "TED",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
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