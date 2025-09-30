/**
 * Database Service - RLS Policies
 *
 * This file provides utilities for managing Row Level Security (RLS) policies in Supabase.
 */

import { toast } from 'sonner';
import { databaseClient } from './databaseClient';
import {
  DatabaseError,
  DatabaseErrorType,
  QueryOperation,
  RlsPolicy,
  RlsPolicyType,
  TableDefinition,
} from '../core/types';

/**
 * RLS Policy Manager
 *
 * Handles operations related to Row Level Security policies
 */
export class RlsPolicyManager {
  private debug: boolean;

  /**
   * Create a new RLS policy manager
   */
  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug || false;
  }

  /**
   * List all RLS policies for a table
   */
  async listPolicies(table: string, schema: string = 'public'): Promise<RlsPolicy[]> {
    try {
      if (this.debug) {
      }

      const { data, error } = await databaseClient.query<RlsPolicy>(
        `
        SELECT
          p.policyname as name,
          c.relname as table,
          n.nspname as schema,
          (CASE
            WHEN p.cmd = 'r' THEN 'SELECT'
            WHEN p.cmd = 'a' THEN 'INSERT'
            WHEN p.cmd = 'w' THEN 'UPDATE'
            WHEN p.cmd = 'd' THEN 'DELETE'
            WHEN p.cmd = '*' THEN 'ALL'
          END) as action,
          p.qual as definition,
          p.with_check as check,
          array_to_string(ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(p.roles)), ', ') as roles
        FROM
          pg_policy p
          JOIN pg_class c ON p.polrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE
          c.relname = $1 AND n.nspname = $2
        ORDER BY
          p.policyname
      `,
        [table, schema]
      );

      if (error) {
        throw new DatabaseError(
          `Failed to list RLS policies for ${schema}.${table}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          'List RLS policies',
          { table, schema },
          table,
          QueryOperation.SELECT
        );
      }

      return data;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'List RLS policies',
              { table, schema },
              table,
              QueryOperation.SELECT
            );

      if (this.debug) {
      }

      toast.error(`Failed to list RLS policies: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Check if RLS is enabled for a table
   */
  async isRlsEnabled(table: string, schema: string = 'public'): Promise<boolean> {
    try {
      if (this.debug) {
      }

      const { data, error } = await databaseClient.query<{ relrowsecurity: boolean }>(
        `
        SELECT c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = $1 AND n.nspname = $2
      `,
        [table, schema]
      );

      if (error) {
        throw new DatabaseError(
          `Failed to check RLS status for ${schema}.${table}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          'Check RLS status',
          { table, schema },
          table,
          QueryOperation.SELECT
        );
      }

      return data.length > 0 ? data[0].relrowsecurity : false;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Check RLS status',
              { table, schema },
              table,
              QueryOperation.SELECT
            );

      if (this.debug) {
      }

      toast.error(`Failed to check RLS status: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Enable RLS on a table
   */
  async enableRls(table: string, schema: string = 'public'): Promise<boolean> {
    try {
      if (this.debug) {
      }

      // Check if RLS is already enabled
      const isEnabled = await this.isRlsEnabled(table, schema);

      if (isEnabled) {
        if (this.debug) {
        }

        return true;
      }

      // Enable RLS
      const { error } = await databaseClient.query(`
        ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY
      `);

      if (error) {
        throw new DatabaseError(
          `Failed to enable RLS for ${schema}.${table}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          'Enable RLS',
          { table, schema },
          table,
          QueryOperation.UPDATE
        );
      }

      toast.success(`RLS enabled for ${schema}.${table}`);
      return true;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Enable RLS',
              { table, schema },
              table,
              QueryOperation.UPDATE
            );

      if (this.debug) {
      }

      toast.error(`Failed to enable RLS: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Disable RLS on a table
   */
  async disableRls(table: string, schema: string = 'public'): Promise<boolean> {
    try {
      if (this.debug) {
      }

      // Check if RLS is already disabled
      const isEnabled = await this.isRlsEnabled(table, schema);

      if (!isEnabled) {
        if (this.debug) {
        }

        return true;
      }

      // Disable RLS
      const { error } = await databaseClient.query(`
        ALTER TABLE ${schema}.${table} DISABLE ROW LEVEL SECURITY
      `);

      if (error) {
        throw new DatabaseError(
          `Failed to disable RLS for ${schema}.${table}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          'Disable RLS',
          { table, schema },
          table,
          QueryOperation.UPDATE
        );
      }

      toast.success(`RLS disabled for ${schema}.${table}`);
      return true;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Disable RLS',
              { table, schema },
              table,
              QueryOperation.UPDATE
            );

      if (this.debug) {
      }

      toast.error(`Failed to disable RLS: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Create an RLS policy
   */
  async createPolicy(policy: {
    name: string;
    table: string;
    schema?: string;
    action: RlsPolicyType;
    using?: string;
    check?: string;
    roles?: string[];
  }): Promise<boolean> {
    const { name, table, schema = 'public', action, using, check, roles } = policy;

    try {
      if (this.debug) {
      }

      // Construct the policy creation SQL
      let sql = `CREATE POLICY ${name} ON ${schema}.${table} `;

      if (action !== RlsPolicyType.ALL) {
        sql += `FOR ${action} `;
      }

      if (roles && roles.length > 0) {
        sql += `TO ${roles!.join(', ')} `;
      }

      if (using) {
        sql += `USING (${using}) `;
      }

      if (check) {
        sql += `WITH CHECK (${check})`;
      }

      // Create the policy
      const { error } = await databaseClient.query(sql);

      if (error) {
        throw new DatabaseError(
          `Failed to create RLS policy ${name} for ${schema}.${table}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          'Create RLS policy',
          policy,
          table,
          QueryOperation.INSERT
        );
      }

      toast.success(`RLS policy ${name} created for ${schema}.${table}`);
      return true;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Create RLS policy',
              policy,
              table,
              QueryOperation.INSERT
            );

      if (this.debug) {
      }

      toast.error(`Failed to create RLS policy: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Drop an RLS policy
   */
  async dropPolicy(name: string, table: string, schema: string = 'public'): Promise<boolean> {
    try {
      if (this.debug) {
      }

      // Drop the policy
      const { error } = await databaseClient.query(`
        DROP POLICY IF EXISTS ${name} ON ${schema}.${table}
      `);

      if (error) {
        throw new DatabaseError(
          `Failed to drop RLS policy ${name} from ${schema}.${table}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          'Drop RLS policy',
          { name, table, schema },
          table,
          QueryOperation.DELETE
        );
      }

      toast.success(`RLS policy ${name} dropped from ${schema}.${table}`);
      return true;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Drop RLS policy',
              { name, table, schema },
              table,
              QueryOperation.DELETE
            );

      if (this.debug) {
      }

      toast.error(`Failed to drop RLS policy: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Get table definition including RLS policies
   */
  async getTableDefinition(
    table: string,
    schema: string = 'public'
  ): Promise<TableDefinition | null> {
    try {
      if (this.debug) {
      }

      // Get table columns
      const { data: columns, error: columnsError } = await databaseClient.query(
        `
        SELECT
          a.attname as name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
          (SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid) FROM pg_catalog.pg_attrdef d
            WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef) as defaultvalue,
          a.attnotnull as isnotnull,
          (a.attnum = ANY(i.indkey)) as isprimarykey,
          (SELECT COUNT(*) FROM pg_catalog.pg_constraint WHERE conrelid = a.attrelid AND contype = 'u' AND a.attnum = ANY(conkey)) > 0 as isunique,
          col_description(a.attrelid, a.attnum) as comment
        FROM
          pg_catalog.pg_attribute a
          JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
          JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
          LEFT JOIN pg_catalog.pg_index i ON c.oid = i.indrelid AND i.indisprimary
        WHERE
          n.nspname = $1
          AND c.relname = $2
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY
          a.attnum
      `,
        [schema, table]
      );

      if (columnsError) {
        throw new DatabaseError(
          `Failed to get columns for ${schema}.${table}: ${columnsError.message}`,
          DatabaseErrorType.QUERY_ERROR,
          columnsError,
          'Get table columns',
          { table, schema },
          table,
          QueryOperation.SELECT
        );
      }

      // Get primary key
      const { data: pkData, error: pkError } = await databaseClient.query(
        `
        SELECT
          a.attname as column_name
        FROM
          pg_catalog.pg_attribute a
          JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
          JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
          JOIN pg_catalog.pg_index i ON c.oid = i.indrelid
          JOIN pg_catalog.pg_class ic ON i.indexrelid = ic.oid
        WHERE
          n.nspname = $1
          AND c.relname = $2
          AND i.indisprimary
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.attnum = ANY(i.indkey)
        ORDER BY
          a.attnum
      `,
        [schema, table]
      );

      if (pkError) {
        throw new DatabaseError(
          `Failed to get primary key for ${schema}.${table}: ${pkError.message}`,
          DatabaseErrorType.QUERY_ERROR,
          pkError,
          'Get table primary key',
          { table, schema },
          table,
          QueryOperation.SELECT
        );
      }

      // Get RLS status and policies
      const isRlsEnabled = await this.isRlsEnabled(table, schema);
      const policies = isRlsEnabled ? await this.listPolicies(table, schema) : [];

      // Format columns
      const formattedColumns = columns.map(col => ({
        name: col.name,
        type: col.type,
        defaultValue: col.defaultvalue,
        isNullable: !col.isnotnull,
        isPrimaryKey: col.isprimarykey,
        isUnique: col.isunique,
        comment: col.comment,
      }));

      // Get primary key column names
      const primaryKey = pkData.map(pk => pk.column_name);

      return {
        name: table,
        schema,
        columns: formattedColumns,
        primaryKey,
        hasRLS: isRlsEnabled,
        policies,
        foreignKeys: [], // Would require additional queries to fetch
        indexes: [], // Would require additional queries to fetch
      };
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Get table definition',
              { table, schema },
              table,
              QueryOperation.SELECT
            );

      if (this.debug) {
      }

      toast.error(`Failed to get table definition: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Apply standard RLS policies for a table (common pattern)
   *
   * This creates a set of standard policies for common access patterns:
   * - Users can read records they own
   * - Users can create records they own
   * - Users can update records they own
   * - Users can delete records they own
   */
  async applyStandardPolicies(
    table: string,
    schema: string = 'public',
    options: {
      ownerColumn?: string;
      readPolicy?: string;
      createPolicy?: string;
      updatePolicy?: string;
      deletePolicy?: string;
      publicRead?: boolean;
      adminRole?: string;
    } = {}
  ): Promise<boolean> {
    const {
      ownerColumn = 'user_id',
      readPolicy = `auth.uid() = ${ownerColumn}`,
      createPolicy = `auth.uid() = ${ownerColumn}`,
      updatePolicy = `auth.uid() = ${ownerColumn}`,
      deletePolicy = `auth.uid() = ${ownerColumn}`,
      publicRead = false,
      adminRole = null,
    } = options;

    try {
      // Enable RLS on the table
      await this.enableRls(table, schema);

      // Create the read policy
      await this.createPolicy({
        name: `${table}_select_policy`,
        table,
        schema,
        action: RlsPolicyType.SELECT,
        using: publicRead ? 'true' : readPolicy,
      });

      // Create the insert policy
      await this.createPolicy({
        name: `${table}_insert_policy`,
        table,
        schema,
        action: RlsPolicyType.INSERT,
        using: createPolicy,
        check: createPolicy,
      });

      // Create the update policy
      await this.createPolicy({
        name: `${table}_update_policy`,
        table,
        schema,
        action: RlsPolicyType.UPDATE,
        using: updatePolicy,
        check: updatePolicy,
      });

      // Create the delete policy
      await this.createPolicy({
        name: `${table}_delete_policy`,
        table,
        schema,
        action: RlsPolicyType.DELETE,
        using: deletePolicy,
      });

      // If admin role is provided, create admin policies
      if (adminRole) {
        await this.createPolicy({
          name: `${table}_admin_policy`,
          table,
          schema,
          action: RlsPolicyType.ALL,
          using: `auth.role() = '${adminRole}'`,
          check: `auth.role() = '${adminRole}'`,
        });
      }

      toast.success(`Standard RLS policies applied to ${schema}.${table}`);
      return true;
    } catch (error) {
      const dbError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              error instanceof Error ? error.message : 'Unknown error occurred',
              DatabaseErrorType.UNKNOWN_ERROR,
              error instanceof Error ? error : undefined,
              'Apply standard policies',
              { table, schema, options },
              table,
              QueryOperation.INSERT
            );

      if (this.debug) {
      }

      toast.error(`Failed to apply standard RLS policies: ${dbError.message}`);
      throw dbError;
    }
  }
}

// Export singleton RLS policy manager
export const rlsPolicyManager = new RlsPolicyManager();
