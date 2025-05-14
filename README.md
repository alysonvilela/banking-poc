# Banking Core POC

A proof-of-concept for a banking proxy service that integrates with an external banking API.

## Architecture

This POC follows a clean architecture approach:

- **Controllers**: API endpoints for handling HTTP requests
- **Services**: Business logic layer
- **Repositories**: Data access layer (in-memory for the POC)
- **Domain Models**: Entities and data transfer objects
- **HTTP Client**: For communicating with the external banking API

## Technologies

- TypeScript
- Hono.js (lightweight web framework)
- Bun (JavaScript runtime)

## Getting Started

### Prerequisites

- Bun or Node.js (16+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd banking-core-poc

# Install dependencies
bun install
```

### Running the Application

```bash
# Development mode
bun run dev

# Build
bun run build

# Production mode
bun run start
```

## API Documentation

The API documentation is available at `/api/docs` endpoint when the server is running.

## BDD Scenarios

### 1. Creating a User

```gherkin
Feature: User Creation
  As a banking service
  I want to create users with associated accounts
  So that users can perform banking operations

  Scenario: Successfully create a user
    Given the banking service is available
    When I send a POST request to "/api/users" with:
      | name         | John Doe             |
      | cpf          | 12345678901          |
      | email        | john.doe@example.com |
      | phoneNumber  | 5511999999999        |
    Then I should receive a 201 status code
    And the response should contain a user with the provided data
    And the response should contain an account ID

  Scenario: Try to create a user with an existing CPF
    Given the banking service is available
    And a user with CPF "12345678901" already exists
    When I send a POST request to "/api/users" with:
      | name         | Jane Doe             |
      | cpf          | 12345678901          |
      | email        | jane.doe@example.com |
      | phoneNumber  | 5511888888888        |
    Then I should receive a 400 status code
    And the response should contain an error message about the existing CPF
```

### 2. Generating a QR Code for Deposit

```gherkin
Feature: QR Code Generation
  As a user of the banking service
  I want to generate PIX QR codes
  So that I can receive payments

  Scenario: Successfully generate a QR code
    Given I am a registered user with ID "user-123"
    When I send a POST request to "/api/qrcodes" with:
      | userId  | user-123 |
      | amount  | 100.00   |
    Then I should receive a 201 status code
    And the response should contain a QR code with the specified amount
    And the QR code should have a PIX key
    And the QR code should have an encoded image
    And the QR code should have an expiration date

  Scenario: Try to generate a QR code with zero amount
    Given I am a registered user with ID "user-123"
    When I send a POST request to "/api/qrcodes" with:
      | userId  | user-123 |
      | amount  | 0        |
    Then I should receive a 400 status code
    And the response should contain an error message about the amount
```

### 3. Receiving a PIX Deposit

```gherkin
Feature: PIX Deposit
  As a user of the banking service
  I want to receive PIX deposits through QR codes
  So that I can increase my account balance

  Scenario: Successfully receive a PIX deposit
    Given I am a registered user with ID "user-123"
    And I have an active QR code with PIX key "pix-abc123" and amount 100.00
    When a PIX deposit webhook is received with:
      | type                  | pix.deposit      |
      | externalTransactionId | ext-tx-123       |
      | amount                | 100.00           |
      | metadata.pixKey       | pix-abc123       |
    Then the system should process the transaction
    And my account balance should increase by 100.00
    And the QR code should be marked as used
    And a transaction should be created with status "COMPLETED"

  Scenario: Receive a PIX deposit with an expired QR code
    Given I am a registered user with ID "user-123"
    And I have an expired QR code with PIX key "pix-expired" and amount 100.00
    When a PIX deposit webhook is received with:
      | type                  | pix.deposit      |
      | externalTransactionId | ext-tx-456       |
      | amount                | 100.00           |
      | metadata.pixKey       | pix-expired      |
    Then the system should process the transaction
    And the transaction should be marked as "FAILED"
    And my account balance should remain unchanged
```

### 4. Transferring Money to an External Account

```gherkin
Feature: External Transfer
  As a user of the banking service
  I want to transfer money to external accounts
  So that I can pay others

  Scenario: Successfully transfer money to an external account
    Given I am a registered user with ID "user-123"
    And my account balance is 500.00
    When I send a POST request to "/api/transactions/transfer" with:
      | userId                    | user-123        |
      | amount                    | 200.00          |
      | destinationBank           | 001             |
      | destinationBranch         | 0001            |
      | destinationAccount        | 123456          |
      | destinationAccountHolder  | Jane Doe        |
      | destinationDocumentNumber | 98765432101     |
      | description               | Payment for services |
    Then I should receive a 201 status code
    And my account balance should decrease by 200.00
    And a transaction should be created with status "COMPLETED"
    And the transaction amount should be -200.00

  Scenario: Try to transfer more than the available balance
    Given I am a registered user with ID "user-123"
    And my account balance is 100.00
    When I send a POST request to "/api/transactions/transfer" with:
      | userId                    | user-123        |
      | amount                    | 200.00          |
      | destinationBank           | 001             |
      | destinationBranch         | 0001            |
      | destinationAccount        | 123456          |
      | destinationAccountHolder  | Jane Doe        |
      | destinationDocumentNumber | 98765432101     |
    Then I should receive a 400 status code
    And the response should contain an error message about insufficient balance
    And my account balance should remain unchanged
```

### 5. Refunding a Transaction

```gherkin
Feature: Transaction Refund
  As a banking service administrator
  I want to refund transactions
  So that users can get their money back when necessary

  Scenario: Successfully refund a transaction
    Given there is a completed transaction with ID "tx-123" and amount 100.00
    And the transaction belongs to user with ID "user-123"
    When I send a POST request to "/api/transactions/refund/tx-123"
    Then I should receive a 200 status code
    And the original transaction should be marked as "REFUNDED"
    And a new transaction should be created with status "COMPLETED"
    And the new transaction amount should be -100.00
    And the user's account balance should be updated accordingly

  Scenario: Try to refund an already refunded transaction
    Given there is a refunded transaction with ID "tx-456"
    When I send a POST request to "/api/transactions/refund/tx-456"
    Then I should receive a 400 status code
    And the response should contain an error message about the transaction already being refunded
```

## Additional Features

- **Transaction Strategies**: The system uses the Strategy pattern to handle different types of transactions
- **Event Emitter**: For handling transaction events and webhooks
- **Error Handling**: Custom error handling for different types of errors
- **In-Memory Storage**: Maps/Arrays for storing data in this POC (can be replaced with real databases)
