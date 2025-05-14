export interface Account {
  id: string;
  userId: string;
  externalAccountId: string; // ID from external banking API
  balance: number;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED'
} 