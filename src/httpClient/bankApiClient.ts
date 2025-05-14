import ky from 'ky';

interface BankApiConfig {
  apiKey: string;
  baseUrl: string;
}

interface CreateChildAccountResponse {
  accountId: string;
  status: string;
}

interface GeneratePixQRCodeResponse {
  pixKey: string;
  qrCodeImage: string; // Base64 encoded
  expiresAt: string; // ISO date string
}

interface PixDepositResponse {
  transactionId: string;
  status: string;
  amount: number;
}

interface TedDepositResponse {
  transactionId: string;
  status: string;
  amount: number;
  senderDocument: string;
}

interface TransferResponse {
  transactionId: string;
  status: string;
}

interface RefundResponse {
  transactionId: string;
  originalTransactionId: string;
  status: string;
}

class BankApiClient {
  private client: typeof ky;
  
  constructor(config: BankApiConfig) {
    this.client = ky.create({
      prefixUrl: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
      retry: 3,
    });
  }

  /**
   * Creates a child account linked to the parent account
   */
  async createChildAccount(name: string, document: string): Promise<CreateChildAccountResponse> {
    try {
      const response = await this.client.post('accounts/child', {
        json: {
          name,
          document,
        },
      }).json<CreateChildAccountResponse>();
      
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Generates a PIX QR code for receiving payments
   */
  async generatePixQRCode(amount: number): Promise<GeneratePixQRCodeResponse> {
    try {
      const response = await this.client.post('pix/qrcode', {
        json: {
          amount,
        },
      }).json<GeneratePixQRCodeResponse>();
      
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Simulates a PIX deposit using a QR code
   * Note: In a real implementation, this would be triggered by an external payment
   */
  async simulatePixDeposit(pixKey: string, amount: number): Promise<PixDepositResponse> {
    try {
      const response = await this.client.post('pix/deposit/simulate', {
        json: {
          pixKey,
          amount,
        },
      }).json<PixDepositResponse>();
      
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Simulates a TED deposit
   * Note: In a real implementation, this would be triggered by an external bank transfer
   */
  async simulateTedDeposit(accountId: string, amount: number, senderDocument: string): Promise<TedDepositResponse> {
    try {
      const response = await this.client.post('ted/deposit/simulate', {
        json: {
          accountId,
          amount,
          senderDocument,
        },
      }).json<TedDepositResponse>();
      
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Transfers money to an external account
   */
  async transferToExternalAccount(
    fromAccountId: string,
    amount: number,
    bankCode: string,
    branchCode: string,
    accountNumber: string,
    accountHolderName: string,
    accountHolderDocument: string,
    description?: string,
  ): Promise<TransferResponse> {
    try {
      const response = await this.client.post('transfers/external', {
        json: {
          fromAccountId,
          amount,
          bankCode,
          branchCode,
          accountNumber,
          accountHolderName,
          accountHolderDocument,
          description,
        },
      }).json<TransferResponse>();
      
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Refunds a previous transaction
   */
  async refundTransaction(transactionId: string): Promise<RefundResponse> {
    try {
      const response = await this.client.post(`transactions/${transactionId}/refund`, {
        json: {},
      }).json<RefundResponse>();
      
      return response;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Helper method to handle API errors
   */
  private handleApiError(error: any): void {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
      });
      
      // Log more details if available
      try {
        error.response.json().then((data: any) => {
          console.error('API Error Details:', data);
        });
      } catch (e) {
        // Ignore JSON parsing errors
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
  }
}

/**
 * Create a mock bank API client for the POC that simulates responses
 * In a real implementation, this would connect to an actual API
 */
export function createMockBankApiClient(): BankApiClient {
  const mockClient = new BankApiClient({
    apiKey: 'mock-api-key',
    baseUrl: 'https://mock-bank-api.example.com',
  });
  
  // Override methods with mock implementations
  const mockPrototype = Object.getPrototypeOf(mockClient);
  
  // Mock createChildAccount
  mockPrototype.createChildAccount = async (name: string, document: string): Promise<CreateChildAccountResponse> => {
    return {
      accountId: `acc-${crypto.randomUUID().substring(0, 8)}`,
      status: 'active',
    };
  };
  
  // Mock generatePixQRCode
  mockPrototype.generatePixQRCode = async (amount: number): Promise<GeneratePixQRCodeResponse> => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    return {
      pixKey: `pix-${crypto.randomUUID().substring(0, 8)}`,
      qrCodeImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // Base64 encoded dummy image
      expiresAt: expiresAt.toISOString(),
    };
  };
  
  // Mock simulatePixDeposit
  mockPrototype.simulatePixDeposit = async (pixKey: string, amount: number): Promise<PixDepositResponse> => {
    return {
      transactionId: `tx-${crypto.randomUUID().substring(0, 8)}`,
      status: 'completed',
      amount,
    };
  };
  
  // Mock simulateTedDeposit
  mockPrototype.simulateTedDeposit = async (accountId: string, amount: number, senderDocument: string): Promise<TedDepositResponse> => {
    return {
      transactionId: `tx-${crypto.randomUUID().substring(0, 8)}`,
      status: 'completed',
      amount,
      senderDocument,
    };
  };
  
  // Mock transferToExternalAccount
  mockPrototype.transferToExternalAccount = async (
    fromAccountId: string,
    amount: number,
    bankCode: string,
    branchCode: string,
    accountNumber: string,
    accountHolderName: string,
    accountHolderDocument: string,
    description?: string,
  ): Promise<TransferResponse> => {
    return {
      transactionId: `tx-${crypto.randomUUID().substring(0, 8)}`,
      status: 'completed',
    };
  };
  
  // Mock refundTransaction
  mockPrototype.refundTransaction = async (transactionId: string): Promise<RefundResponse> => {
    return {
      transactionId: `tx-${crypto.randomUUID().substring(0, 8)}`,
      originalTransactionId: transactionId,
      status: 'completed',
    };
  };
  
  return mockClient;
}

// Create and export the singleton instance
export const bankApiClient = createMockBankApiClient(); 