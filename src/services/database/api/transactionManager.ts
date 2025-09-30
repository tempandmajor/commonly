/**
 * Database Service - Transaction Manager
 *
 * This file provides transaction management capabilities for database operations.
 * It allows grouping multiple database operations into atomic transactions.
 */

import { toast } from 'sonner';
import { databaseClient } from './databaseClient';
import {
  TransactionManager as ITransactionManager,
  DatabaseError,
  DatabaseErrorType,
  TransactionMode,
  QueryOperation,
} from '../core/types';

/**
 * Transaction Manager
 *
 * Handles database transactions for grouping operations into atomic units
 */
export class TransactionManager implements ITransactionManager {
  private transactionId: string | null = null;
  private debug: boolean;
  private savepoints: string[] = [];
  private savePointCounter: number = 0;

  /**
   * Create a new transaction manager
   */
  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug || false;
  }

  /**
   * Begin a new transaction
   */
  async begin(mode: TransactionMode = TransactionMode.READ_WRITE): Promise<void> {
    try {
      if (this.transactionId) {
        if (this.debug) {
        }

        await this.createSavepoint();
        return;
      }

      // Start a transaction with the specified mode
      const { data, error } = await databaseClient.query<{ transaction_id: string }>(
        `BEGIN ${mode}; SELECT gen_random_uuid() as transaction_id;`
      );

      if (error) {
        throw error;
      }

      this.transactionId = data[0]?.transaction_id || null;

      if (this.debug) {
      }
    } catch (error) {
      const dbError = this.createError('Failed to begin transaction', error, 'BEGIN', []);

      if (this.debug) {
      }

      toast.error(`Transaction error: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Commit the current transaction
   */
  async commit(): Promise<void> {
    try {
      if (!this.transactionId) {
        throw new DatabaseError(
          'No transaction in progress to commit',
          DatabaseErrorType.QUERY_ERROR,
          undefined,
          'COMMIT',
          [],
          undefined,
          QueryOperation.RPC
        );
      }

      // If we have savepoints, commit the latest savepoint
      if (this.savepoints.length > 0) {
        await this.releaseSavepoint();
        return;
      }

      // Commit the main transaction
      const { error } = await databaseClient.query('COMMIT');

      if (error) {
        throw error;
      }

      if (this.debug) {
      }

      this.transactionId = null;
      this.savepoints = [];
      this.savePointCounter = 0;
    } catch (error) {
      const dbError = this.createError('Failed to commit transaction', error, 'COMMIT', []);

      if (this.debug) {
      }

      toast.error(`Transaction error: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Rollback the current transaction
   */
  async rollback(): Promise<void> {
    try {
      if (!this.transactionId) {
        throw new DatabaseError(
          'No transaction in progress to rollback',
          DatabaseErrorType.QUERY_ERROR,
          undefined,
          'ROLLBACK',
          [],
          undefined,
          QueryOperation.RPC
        );
      }

      // If we have savepoints, rollback to the latest savepoint
      if (this.savepoints.length > 0) {
        await this.rollbackToSavepoint();
        return;
      }

      // Rollback the main transaction
      const { error } = await databaseClient.query('ROLLBACK');

      if (error) {
        throw error;
      }

      if (this.debug) {
      }

      this.transactionId = null;
      this.savepoints = [];
      this.savePointCounter = 0;
    } catch (error) {
      const dbError = this.createError('Failed to rollback transaction', error, 'ROLLBACK', []);

      if (this.debug) {
      }

      toast.error(`Transaction error: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Execute a query within the current transaction
   */
  async query<T = any>(query: string, params: unknown[] = []): Promise<T[]> {
    try {
      if (!this.transactionId) {
        throw new DatabaseError(
          'No transaction in progress',
          DatabaseErrorType.QUERY_ERROR,
          undefined,
          query,
          params,
          undefined,
          QueryOperation.RPC
        );
      }

      if (this.debug) {
      }

      const { data, error } = await databaseClient.query<T>(query, params);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      const dbError = this.createError('Transaction query failed', error, query, params);

      if (this.debug) {
      }

      toast.error(`Transaction error: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Create a savepoint within the current transaction
   */
  private async createSavepoint(): Promise<void> {
    try {
      if (!this.transactionId) {
        throw new DatabaseError(
          'No transaction in progress to create a savepoint',
          DatabaseErrorType.QUERY_ERROR,
          undefined,
          'SAVEPOINT',
          [],
          undefined,
          QueryOperation.RPC
        );
      }

      // Generate a unique savepoint name
      const savepointName = `sp_${this.transactionId.substring(0, 8)}_${this.savePointCounter++}`;

      // Create the savepoint
      const { error } = await databaseClient.query(`SAVEPOINT ${savepointName}`);

      if (error) {
        throw error;
      }

      this.savepoints.push(savepointName);

      if (this.debug) {
      }
    } catch (error) {
      const dbError = this.createError('Failed to create savepoint', error, 'SAVEPOINT', []);

      if (this.debug) {
      }

      throw dbError;
    }
  }

  /**
   * Release (commit) the latest savepoint
   */
  private async releaseSavepoint(): Promise<void> {
    try {
      if (!this.transactionId || this.savepoints.length === 0) {
        throw new DatabaseError(
          'No savepoint to release',
          DatabaseErrorType.QUERY_ERROR,
          undefined,
          'RELEASE SAVEPOINT',
          [],
          undefined,
          QueryOperation.RPC
        );
      }

      // Get the latest savepoint name
      const savepointName = this.savepoints.pop();

      // Release the savepoint
      const { error } = await databaseClient.query(`RELEASE SAVEPOINT ${savepointName}`);

      if (error) {
        throw error;
      }

      if (this.debug) {
      }
    } catch (error) {
      const dbError = this.createError(
        'Failed to release savepoint',
        error,
        'RELEASE SAVEPOINT',
        []
      );

      if (this.debug) {
      }

      throw dbError;
    }
  }

  /**
   * Rollback to the latest savepoint
   */
  private async rollbackToSavepoint(): Promise<void> {
    try {
      if (!this.transactionId || this.savepoints.length === 0) {
        throw new DatabaseError(
          'No savepoint to rollback to',
          DatabaseErrorType.QUERY_ERROR,
          undefined,
          'ROLLBACK TO SAVEPOINT',
          [],
          undefined,
          QueryOperation.RPC
        );
      }

      // Get the latest savepoint name
      const savepointName = this.savepoints.pop();

      // Rollback to the savepoint
      const { error } = await databaseClient.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);

      if (error) {
        throw error;
      }

      if (this.debug) {
      }
    } catch (error) {
      const dbError = this.createError(
        'Failed to rollback to savepoint',
        error,
        'ROLLBACK TO SAVEPOINT',
        []
      );

      if (this.debug) {
      }

      throw dbError;
    }
  }

  /**
   * Create a DatabaseError from an error
   */
  private createError(
    message: string,
    error: unknown,
    query: string,
    params: unknown[]
  ): DatabaseError {
    let errorType = DatabaseErrorType.UNKNOWN_ERROR;

    // Map error code to error type
    if (error instanceof DatabaseError) {
      return error;
    } else if (error?.code) {
      switch (error.code) {
        case '40001':
          errorType = DatabaseErrorType.CONSTRAINT_ERROR;
          message = 'Transaction could not be serialized due to concurrent update';
          break;
        case '40P01':
          errorType = DatabaseErrorType.TIMEOUT_ERROR;
          message = 'Transaction deadlock detected';
          break;
        case '25P02':
          errorType = DatabaseErrorType.QUERY_ERROR;
          message = 'Transaction is aborted, commands ignored until end of transaction block';
          break;
      }
    }

    return new DatabaseError(
      message,
      errorType,
      error,
      query,
      params,
      undefined,
      QueryOperation.RPC
    );
  }
}

/**
 * Create a transaction manager
 */
export function createTransaction(options: { debug?: boolean } = {}): TransactionManager {
  return new TransactionManager(options);
}

// Export a singleton transaction manager
export const transactionManager = createTransaction();
