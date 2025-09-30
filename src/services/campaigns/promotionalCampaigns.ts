import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for promotional campaigns
export interface PromotionalCampaign {
  id: string;
  name: string;
  description?: string | undefined;
  campaign_type: 'signup' | 'milestone' | 'referral' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  trigger_event: string;
  target_audience: Record<string, any>;
  max_recipients?: number | undefined;
  current_recipients: number;
  credit_amount: number;
  credit_currency: string;
  credit_description?: string | undefined;
  credit_message?: string | undefined;
  usage_restrictions: Record<string, any>;
  expires_at?: string | undefined;
  starts_at: string;
  ends_at?: string | undefined;
  created_by?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  user_id: string;
  event_type: 'credit_issued' | 'credit_used' | 'credit_expired';
  credit_amount?: number | undefined;
  used_for?: string | undefined;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CampaignEligibility {
  id: string;
  campaign_id: string;
  user_id: string;
  is_eligible: boolean;
  eligibility_checked_at: string;
  disqualification_reason?: string | undefined;
  credit_issued: boolean;
  credit_issued_at?: string | undefined;
  credit_amount?: number | undefined;
  created_at: string;
  updated_at: string;
}

export interface CampaignDashboard {
  id: string;
  name: string;
  status: string;
  credit_amount: number;
  max_recipients?: number | undefined;
  current_recipients: number;
  remaining_slots: number;
  starts_at: string;
  ends_at?: string | undefined;
  total_eligible_users: number;
  credits_issued: number;
  total_credits_issued: number;
  created_at: string;
}

// Service class for managing promotional campaigns
export class PromotionalCampaignService {
  /**
   * Get all promotional campaigns (admin only)
   */
  static async getAllCampaigns(): Promise<PromotionalCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
      return [];
    }
  }

  /**
   * Get campaign dashboard data
   */
  static async getCampaignDashboard(): Promise<CampaignDashboard[]> {
    try {
      const { data, error } = await supabase.from('campaign_dashboard').select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign dashboard:', error);
      toast.error('Failed to fetch campaign dashboard');
      return [];
    }
  }

  /**
   * Create a new promotional campaign
   */
  static async createCampaign(
    campaign: Partial<PromotionalCampaign>
  ): Promise<PromotionalCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      toast.success('Campaign created successfully');
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      return null;
    }
  }

  /**
   * Update an existing campaign
   */
  static async updateCampaign(id: string, updates: Partial<PromotionalCampaign>): Promise<boolean> {
    try {
      const { error } = await supabase.from('promotional_campaigns').update(updates).eq('id', id);

      if (error) throw error;
      toast.success('Campaign updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
      return false;
    }
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('promotional_campaigns').delete().eq('id', id);

      if (error) throw error;
      toast.success('Campaign deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
      return false;
    }
  }

  /**
   * Check if user is eligible for campaigns and process them
   */
  static async processUserSignupCampaigns(userId: string): Promise<void> {
    try {
      // Get all active signup campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from('promotional_campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('trigger_event', 'user_signup')
        .gte('ends_at', new Date().toISOString())
        .lte('starts_at', new Date().toISOString());

      if (campaignError) throw campaignError;

      for (const campaign of campaigns || []) {
        await this.checkAndProcessCampaignEligibility(campaign, userId);
      }
    } catch (error) {
      console.error('Error processing signup campaigns:', error);
    }
  }

  /**
   * Check campaign eligibility and process if eligible
   */
  static async checkAndProcessCampaignEligibility(
    campaign: PromotionalCampaign,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user is already processed for this campaign
      const { data: existingEligibility } = await supabase
        .from('campaign_eligibility')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('user_id', userId)
        .single();

      if (existingEligibility) {
        return false; // Already processed
      }

      // Check if campaign has reached max recipients
      if (campaign.max_recipients && campaign.current_recipients >= campaign.max_recipients) {
        await this.recordIneligibility(
          campaign.id,
          userId,
          'Campaign has reached maximum recipients'
        );
        return false;
      }

      // Check target audience criteria
      const isEligible = await this.checkTargetAudienceEligibility(campaign, userId);

      if (isEligible) {
        // Issue credit and record eligibility
        const success = await this.issueCampaignCredit(campaign, userId);

        if (success) {
          // Update campaign recipient count
          await supabase
            .from('promotional_campaigns')
            .update({
              current_recipients: campaign.current_recipients + 1,
            })
            .eq('id', campaign.id);

          return true;
        }
      } else {
        await this.recordIneligibility(
          campaign.id,
          userId,
          'Does not meet target audience criteria'
        );
      }

      return false;
    } catch (error) {
      console.error('Error checking campaign eligibility:', error);
      return false;
    }
  }

  /**
   * Check if user meets target audience criteria
   */
  static async checkTargetAudienceEligibility(
    campaign: PromotionalCampaign,
    userId: string
  ): Promise<boolean> {
    try {
      const targetAudience = campaign.target_audience;

      // Check user number criteria (for "first X users" campaigns)
      if (targetAudience.user_number?.max) {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', new Date().toISOString());

        if (count && count > targetAudience.user_number.max) {
          return false;
        }
      }

      // Add more criteria as needed (location, user type, etc.)

      return true;
    } catch (error) {
      console.error('Error checking target audience eligibility:', error);
      return false;
    }
  }

  /**
   * Issue campaign credit to user
   */
  static async issueCampaignCredit(
    campaign: PromotionalCampaign,
    userId: string
  ): Promise<boolean> {
    try {
      // Record eligibility and credit issuance
      const { error: eligibilityError } = await supabase.from('campaign_eligibility').insert({
        campaign_id: campaign.id,
        user_id: userId,
        is_eligible: true,
        credit_issued: true,
        credit_issued_at: new Date().toISOString(),
        credit_amount: campaign.credit_amount,
      });

      if (eligibilityError) throw eligibilityError;

      // Add credit to user's promotion_credits table
      const { error: creditError } = await supabase.from('promotion_credits').insert({
        user_id: userId,
        amount: campaign.credit_amount,
        remaining_amount: campaign.credit_amount,
        reason: campaign.credit_description || campaign.name,
        status: 'active',
        expires_at: campaign.expires_at,
        campaign_id: campaign.id,
        usage_restrictions: campaign.usage_restrictions,
        created_by: 'system',
      });

      if (creditError) throw creditError;

      // Record analytics
      await this.recordCampaignAnalytics(
        campaign.id,
        userId,
        'credit_issued',
        campaign.credit_amount
      );

      // Show user message if campaign has one
      if (campaign.credit_message) {
        toast.success(campaign.credit_message, {
          duration: 8000, // Longer duration for important message
        });
      }

      return true;
    } catch (error) {
      console.error('Error issuing campaign credit:', error);
      return false;
    }
  }

  /**
   * Record user ineligibility
   */
  static async recordIneligibility(
    campaignId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      await supabase.from('campaign_eligibility').insert({
        campaign_id: campaignId,
        user_id: userId,
        is_eligible: false,
        disqualification_reason: reason,
        credit_issued: false,
      });
    } catch (error) {
      console.error('Error recording ineligibility:', error);
    }
  }

  /**
   * Record campaign analytics
   */
  static async recordCampaignAnalytics(
    campaignId: string,
    userId: string,
    eventType: 'credit_issued' | 'credit_used' | 'credit_expired',
    creditAmount?: number,
    usedFor?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('campaign_analytics').insert({
        campaign_id: campaignId,
        user_id: userId,
        event_type: eventType,
        credit_amount: creditAmount,
        used_for: usedFor,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error recording campaign analytics:', error);
    }
  }

  /**
   * Get campaign analytics for admin dashboard
   */
  static async getCampaignAnalytics(campaignId?: string): Promise<CampaignAnalytics[]> {
    try {
      let query = supabase
        .from('campaign_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return [];
    }
  }

  /**
   * Validate credit usage against campaign restrictions
   */
  static async validateCreditUsage(campaignId: string, usageCategory: string): Promise<boolean> {
    try {
      const { data: campaign } = await supabase
        .from('promotional_campaigns')
        .select('usage_restrictions')
        .eq('id', campaignId)
        .single();

      if (!campaign) return false;

      const restrictions = campaign.usage_restrictions;

      // Check excluded categories
      if (restrictions.excluded_categories?.includes(usageCategory)) {
        return false;
      }

      // Check allowed categories (if specified)
      if (
        restrictions.allowed_categories &&
        !restrictions.allowed_categories.includes(usageCategory)
      ) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating credit usage:', error);
      return false;
    }
  }
}

export default PromotionalCampaignService;
