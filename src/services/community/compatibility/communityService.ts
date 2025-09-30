/**
 * Backward compatibility layer for community service
 *
 * This file provides backward compatibility with the old communityService.ts
 * implementation that used ContentTest table as a placeholder.
 *
 * @deprecated Use the new modular community service API instead
 */
import * as CommunityAPI from '../api/core';
import * as SubscriptionAPI from '../subscription/api';

/**
 * @deprecated Use CommunityAPI.getCommunity instead
 */
export const getCommunity = CommunityAPI.getCommunity;

/**
 * @deprecated Use CommunityAPI.getCommunityWithMemberStatus instead
 */
export const getCommunityWithMemberStatus = CommunityAPI.getCommunityWithMemberStatus;

/**
 * @deprecated Use CommunityAPI.searchCommunities instead
 */
export const searchCommunities = CommunityAPI.searchCommunities;

/**
 * @deprecated Use CommunityAPI.getUserCommunities instead
 */
export const getUserCommunities = CommunityAPI.getUserCommunities;

/**
 * @deprecated Use CommunityAPI.getUserMemberships instead
 */
export const getUserMemberships = CommunityAPI.getUserMemberships;

/**
 * @deprecated Use CommunityAPI.createCommunity instead
 */
export const createCommunity = CommunityAPI.createCommunity;

/**
 * @deprecated Use CommunityAPI.updateCommunity instead
 */
export const updateCommunity = CommunityAPI.updateCommunity;

/**
 * @deprecated Use CommunityAPI.deleteCommunity instead
 */
export const deleteCommunity = CommunityAPI.deleteCommunity;

/**
 * @deprecated Use CommunityAPI.joinCommunity instead
 */
export const joinCommunity = CommunityAPI.joinCommunity;

/**
 * @deprecated Use CommunityAPI.leaveCommunity instead
 */
export const leaveCommunity = CommunityAPI.leaveCommunity;

/**
 * @deprecated Use CommunityAPI.getCommunityMembers instead
 */
export const getCommunityMembers = CommunityAPI.getCommunityMembers;

/**
 * @deprecated Use CommunityAPI.updateMemberRole instead
 */
export const updateMemberRole = CommunityAPI.updateMemberRole;

/**
 * @deprecated Use CommunityAPI.getFeaturedCommunities instead
 */
export const getFeaturedCommunities = CommunityAPI.getFeaturedCommunities;

/**
 * @deprecated Use SubscriptionAPI.getCommunitySubscriptionSettings instead
 */
export const getCommunitySubscriptionSettings = SubscriptionAPI.getCommunitySubscriptionSettings;

/**
 * @deprecated Use SubscriptionAPI.updateCommunitySubscriptionSettings instead
 */
export const updateCommunitySubscriptionSettings =
  SubscriptionAPI.updateCommunitySubscriptionSettings;

/**
 * @deprecated Use SubscriptionAPI.getCommunitySubscribers instead
 */
export const getCommunitySubscribers = SubscriptionAPI.getCommunitySubscribers;

/**
 * @deprecated Use SubscriptionAPI.subscribeToCommunity instead
 */
export const subscribeToCommunity = SubscriptionAPI.subscribeToCommunity;

/**
 * @deprecated Use SubscriptionAPI.unsubscribeFromCommunity instead
 */
export const unsubscribeFromCommunity = SubscriptionAPI.unsubscribeFromCommunity;

/**
 * @deprecated Use SubscriptionAPI.createCommunityEvent instead
 */
export const createCommunityEvent = SubscriptionAPI.createCommunityEvent;

/**
 * @deprecated Use SubscriptionAPI.getCommunityEvents instead
 */
export const getCommunityEvents = SubscriptionAPI.getCommunityEvents;
