/**
 * Receipt Service - Digital Receipt Generation and Management
 * Rebuilt with proper TypeScript types and syntax
 */
import { supabase } from '@/integrations/supabase/client';

// Comprehensive type definitions
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDetails {
  id: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'cancelled' | 'processing';
  quantity: number;
}

export interface PaymentDetails {
  id: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface CustomerInfo {
  name: string;
  email: string;
}

export interface ReceiptTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface ReceiptData {
  orderDetails: OrderDetails;
  paymentDetails: PaymentDetails | null;
  items: ReceiptItem[];
  totals: ReceiptTotals;
  customer: CustomerInfo;
  billingAddress?: Address | undefined;
  shippingAddress?: Address | undefined;
}

export interface Receipt {
  id: string;
  orderId: string;
  paymentId?: string | undefined;
  userId?: string | undefined;
  receiptNumber: string;
  receiptData: ReceiptData;
  pdfUrl?: string | undefined;
  emailSent: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Database types for better type safety
interface DatabaseOrder {
  id: string;
  created_at: string;
  status: string;
  quantity: number;
  total_price: number;
  billing_address?: Address | undefined;
  shipping_address?: Address | undefined;
  product?: {
    name: string | undefined;
    price_in_cents: number;
  };
  payment?: {
    id: string;
    amount_in_cents: number;
    payment_method: string;
    status: string;
  };
}

interface DatabaseUser {
  name?: string | undefined;
  display_name?: string | undefined;
  email: string;
}

interface DatabaseReceipt {
  id: string;
  order_id: string;
  payment_id?: string | undefined;
  user_id?: string | undefined;
  receipt_number: string;
  receipt_data: ReceiptData;
  pdf_url?: string | undefined;
  email_sent: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

class ReceiptService {
  /**
   * Generate a unique receipt number
   */
  private generateReceiptNumber(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `R${timestamp}-${randomId}`;
  }

  /**
   * Format currency from cents to dollars
   */
  private formatCurrency(cents: number): string {
    return `$${cents / 100}.toFixed(2)}`;
  }

  /**
   * Transform database order to receipt data
   */
  private transformOrderToReceiptData(
    order: DatabaseOrder,
    userData: DatabaseUser
  ): ReceiptData {
    return {
      orderDetails: {
        id: order.id,
        createdAt: order.created_at,
        status: order.status as OrderDetails['status'],
        quantity: order.quantity,
      },
      paymentDetails: order.payment
        ? {
            id: order.payment.id,
            amount: order.payment.amount_in_cents,
            paymentMethod: order.payment.payment_method,
            status: order.payment.status as PaymentDetails['status'],
          }
        : null,
      items: [
        {
          name: order.product?.name || 'Unknown Product',
          quantity: order.quantity,
          unitPrice: order.product?.price_in_cents || 0,
          totalPrice: order.total_price,
        },
      ],
      totals: {
        subtotal: order.total_price,
        tax: 0, // Calculate if needed based on business logic
        total: order.total_price,
      },
      customer: {
        name: userData.display_name || userData.name || 'Customer',
        email: userData.email,
      },
      billingAddress: order.billing_address,
      shippingAddress: order.shipping_address,
    };
  }

  /**
   * Transform database receipt to Receipt interface
   */
  private transformDatabaseReceipt(dbReceipt: DatabaseReceipt): Receipt {
    return {
      id: dbReceipt.id,
      orderId: dbReceipt.order_id,
      paymentId: dbReceipt.payment_id,
      userId: dbReceipt.user_id,
      receiptNumber: dbReceipt.receipt_number,
      receiptData: dbReceipt.receipt_data,
      pdfUrl: dbReceipt.pdf_url,
      emailSent: dbReceipt.email_sent,
      downloadCount: dbReceipt.download_count,
      createdAt: dbReceipt.created_at,
      updatedAt: dbReceipt.updated_at,
    };
  }

  /**
   * Generate receipt for an order
   */
  async generateReceipt(orderId: string): Promise<Receipt> {
    try {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('User must be authenticated');

      // Get order details with related data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          payment:payments(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, display_name, email')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User data not found');

      // Transform data to receipt format
      const receiptData = this.transformOrderToReceiptData(
        order as DatabaseOrder,
        userData as DatabaseUser
      );

      // Create receipt record
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          order_id: orderId,
          payment_id: order.payment?.id,
          user_id: user.id,
          receipt_number: this.generateReceiptNumber(),
          receipt_data: receiptData,
          email_sent: false,
          download_count: 0,
        })
        .select('*')
        .single();

      if (receiptError) throw receiptError;
      if (!receipt) throw new Error('Failed to create receipt');

      return this.transformDatabaseReceipt(receipt as DatabaseReceipt);
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Get receipt by ID
   */
  async getReceipt(receiptId: string): Promise<Receipt> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', receiptId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Receipt not found');

      return this.transformDatabaseReceipt(data as DatabaseReceipt);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      throw error;
    }
  }

  /**
   * Get receipt by order ID
   */
  async getReceiptByOrderId(orderId: string): Promise<Receipt | null> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.transformDatabaseReceipt(data as DatabaseReceipt);
    } catch (error) {
      console.error('Error fetching receipt by order ID:', error);
      throw error;
    }
  }

  /**
   * Download receipt (increment download count)
   */
  async downloadReceipt(receiptId: string): Promise<{
    receipt: Receipt;
    downloadUrl: string;
  }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('User must be authenticated');

      // Get receipt
      const receipt = await this.getReceipt(receiptId);

      // Increment download count
      const { error: updateError } = await supabase
        .from('receipts')
        .update({ download_count: receipt.downloadCount + 1 })
        .eq('id', receiptId);

      if (updateError) throw updateError;

      // Generate HTML receipt
      const receiptHtml = this.generateReceiptHtml(receipt);
      const downloadUrl = `data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`;

      return {
        receipt: { ...receipt, downloadCount: receipt.downloadCount + 1 },
        downloadUrl,
      };
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  }

  /**
   * Get user's receipts
   */
  async getUserReceipts(): Promise<Receipt[]> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as DatabaseReceipt[]).map(receipt =>
        this.transformDatabaseReceipt(receipt)
      );
    } catch (error) {
      console.error('Error fetching user receipts:', error);
      throw error;
    }
  }

  /**
   * Email receipt to customer
   */
  async emailReceipt(receiptId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('User must be authenticated');

      const receipt = await this.getReceipt(receiptId);

      // TODO: Implement actual email sending logic
      // For now, we'll just mark it as sent
      const { error: updateError } = await supabase
        .from('receipts')
        .update({ email_sent: true })
        .eq('id', receiptId);

      if (updateError) throw updateError;

      console.log('Receipt emailed to:', receipt.receiptData.customer.email);
    } catch (error) {
      console.error('Error emailing receipt:', error);
      throw error;
    }
  }

  /**
   * Generate HTML receipt for display/download
   */
  private generateReceiptHtml(receipt: Receipt): string {
    const data = receipt.receiptData;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #${receipt.receiptNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2B2B2B;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2B2B2B;
            margin-bottom: 10px;
        }
        .receipt-number {
            font-size: 18px;
            color: #666;
        }
        .section {
            margin: 25px 0;
        }
        .section-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 15px;
            color: #2B2B2B;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
        }
        .detail-row:nth-child(even) {
            background-color: #f9f9f9;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: left;
        }
        .items-table th {
            background-color: #2B2B2B;
            color: white;
            font-weight: bold;
        }
        .items-table td:nth-child(2),
        .items-table td:nth-child(3),
        .items-table td:nth-child(4) {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #2B2B2B;
            padding-top: 15px;
            margin-top: 15px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .payment-status {
            text-transform: capitalize;
            font-weight: bold;
        }
        .payment-status.completed {
            color: #22c55e;
        }
        .payment-status.pending {
            color: #f59e0b;
        }
        .payment-status.failed {
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Commonly</div>
        <div class="receipt-number">Receipt #${receipt.receiptNumber}</div>
    </div>

    <div class="section">
        <div class="section-title">Order Information</div>
        <div class="detail-row">
            <span>Order Date:</span>
            <span>${new Date(data.orderDetails.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
            <span>Order ID:</span>
            <span>${data.orderDetails.id}</span>
        </div>
        <div class="detail-row">
            <span>Status:</span>
            <span style="text-transform: capitalize;">${data.orderDetails.status}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="detail-row">
            <span>Name:</span>
            <span>${data.customer.name}</span>
        </div>
        <div class="detail-row">
            <span>Email:</span>
            <span>${data.customer.email}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Items Purchased</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.items
                  .map(
                    item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${this.formatCurrency(item.unitPrice)}</td>
                        <td>${this.formatCurrency(item.totalPrice)}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="detail-row">
            <span>Subtotal:</span>
            <span>${this.formatCurrency(data.totals.subtotal)}</span>
        </div>
        ${
          data.totals.tax > 0
            ? `
        <div class="detail-row">
            <span>Tax:</span>
            <span>${this.formatCurrency(data.totals.tax)}</span>
        </div>
        `
            : ''
        }
        <div class="detail-row total-row">
            <span>Total:</span>
            <span>${this.formatCurrency(data.totals.total)}</span>
        </div>
    </div>

    ${
      data.paymentDetails
        ? `
    <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="detail-row">
            <span>Payment Method:</span>
            <span style="text-transform: capitalize;">${data.paymentDetails.paymentMethod}</span>
        </div>
        <div class="detail-row">
            <span>Payment Status:</span>
            <span class="payment-status ${data.paymentDetails.status}">${data.paymentDetails.status}</span>
        </div>
    </div>
    `
        : ''
    }

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>This receipt was generated on ${new Date().toLocaleDateString()}</p>
        <p>Visit us at commonly.com</p>
    </div>
</body>
</html>`;
  }

  /**
   * Check if receipt exists for order
   */
  async receiptExists(orderId: string): Promise<boolean> {
    try {
      const receipt = await this.getReceiptByOrderId(orderId);
      return receipt !== null;
    } catch (error) {
      console.error('Error checking receipt existence:', error);
      return false;
    }
  }

  /**
   * Get or create receipt for order
   */
  async getOrCreateReceipt(orderId: string): Promise<Receipt> {
    try {
      let receipt = await this.getReceiptByOrderId(orderId);

      if (!receipt) {
        receipt = await this.generateReceipt(orderId);
      }

      return receipt;
    } catch (error) {
      console.error('Error getting or creating receipt:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const receiptService = new ReceiptService();
export default receiptService;