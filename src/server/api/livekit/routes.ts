/**
 * LiveKit API Routes
 *
 * Express routes for LiveKit-related functionality.
 */

import express from 'express';
import { generateLiveKitToken, TokenRequest } from './tokenService';

const router = express.Router();

/**
 * POST /api/events/live/token
 * Generate a LiveKit token for joining a live event
 */
router.post('/events/live/token', async (req, res) => {
  try {
    const tokenRequest: TokenRequest = req.body;

    // Validate required fields
    if (!tokenRequest.eventId || !tokenRequest.userId || !tokenRequest.userName) {
      return res.status(400).json({
        error: 'Missing required fields: eventId, userId, and userName are required',
      });
    }

    // TODO: Add authorization check to verify user has permission to join this event
    // This would typically check against your database

    // Generate token
    const tokenResponse = generateLiveKitToken(tokenRequest);

    // Return token and room information
    res.json(tokenResponse);
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : String(error) as string,
    });
  }
});

/**
 * GET /api/events/live/:eventId
 * Get details about a live event
 */
router.get('/events/live/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // TODO: Fetch event details from your database
    // This is a placeholder implementation
    const eventDetails = {
      id: eventId,
      title: 'Sample Live Event',
      description: 'This is a sample live event',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      hostId: 'host-123',
      hostName: 'Event Host',
      participantCount: 0,
      status: 'scheduled',
    };

    res.json(eventDetails);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({
      error: 'Failed to fetch event details',
      details: error instanceof Error ? error.message : String(error) as string,
    });
  }
});

/**
 * GET /api/events/live/upcoming
 * List upcoming live events
 */
router.get('/events/live/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // TODO: Fetch upcoming events from your database
    // This is a placeholder implementation
    const upcomingEvents = Array.from({ length: limit }).map((_, index) => ({
      id: `event-${index + 1}`,
      title: `Upcoming Event ${index + 1}`,
      description: `This is upcoming event ${index + 1}`,
      startTime: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
      endTime: new Date(Date.now() + (index + 1) * 86400000 + 3600000).toISOString(),
      hostId: 'host-123',
      hostName: 'Event Host',
      participantCount: 0,
      status: 'scheduled',
    }));

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      error: 'Failed to fetch upcoming events',
      details: error instanceof Error ? error.message : String(error) as string,
    });
  }
});

export default router;
