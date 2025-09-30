#!/usr/bin/env node

/**
 * LiveKit Test Script
 * 
 * This script helps test the LiveKit integration by:
 * 1. Checking environment variables
 * 2. Generating a test token
 * 3. Attempting to connect to a LiveKit room
 */

const { AccessToken } = require('livekit-server-sdk');
const { Room, RoomEvent } = require('livekit-client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('Using default .env file');
  dotenv.config();
}

// Check for required environment variables
const livekitUrl = process.env.VITE_LIVEKIT_URL;
const apiKey = process.env.VITE_LIVEKIT_API_KEY;
const apiSecret = process.env.VITE_LIVEKIT_API_SECRET;

if (!livekitUrl || !apiKey || !apiSecret) {
  console.error('❌ Missing required environment variables:');
  if (!livekitUrl) console.error('  - VITE_LIVEKIT_URL');
  if (!apiKey) console.error('  - VITE_LIVEKIT_API_KEY');
  if (!apiSecret) console.error('  - VITE_LIVEKIT_API_SECRET');
  console.error('\nPlease add these to your .env file and try again.');
  process.exit(1);
}

// Generate a test token
function generateToken() {
  console.log('Generating test token...');
  
  const roomName = 'test-room';
  const participantName = 'test-user';
  const participantIdentity = `user-${Date.now()}`;
  
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
  });
  
  token.addGrant({
    roomJoin: true,
    roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  
  return {
    token: token.toJwt(),
    roomName,
    participantName,
    participantIdentity
  };
}

// Test connection to LiveKit
async function testConnection() {
  const { token, roomName, participantIdentity } = generateToken();
  
  console.log(`\n🔑 Generated token for participant: ${participantIdentity}`);
  console.log(`🏠 Room name: ${roomName}`);
  
  console.log('\n📡 Attempting to connect to LiveKit...');
  
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });
  
  room.on(RoomEvent.Connected, () => {
    console.log('✅ Successfully connected to LiveKit room!');
    console.log(`👥 Participants in room: ${room.participants.size}`);
    
    // Disconnect after successful connection
    room.disconnect();
    console.log('🔌 Disconnected from room');
    process.exit(0);
  });
  
  room.on(RoomEvent.Disconnected, (error) => {
    if (error) {
      console.error('❌ Disconnected with error:', error);
      process.exit(1);
    }
  });
  
  room.on(RoomEvent.ConnectionStateChanged, (state) => {
    console.log(`🔄 Connection state changed: ${state}`);
  });
  
  try {
    await room.connect(livekitUrl, token);
    console.log('🔄 Connection initiated...');
    
    // Set a timeout in case we never get a connected event
    setTimeout(() => {
      console.error('❌ Connection timeout after 10 seconds');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('❌ Failed to connect:', error);
    process.exit(1);
  }
}

// Run the test
console.log('🚀 LiveKit Integration Test');
console.log('=======================');
console.log(`LiveKit URL: ${livekitUrl}`);
console.log(`API Key: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
console.log(`API Secret: ${apiSecret.substring(0, 3)}...${apiSecret.substring(apiSecret.length - 3)}`);
console.log('=======================\n');

testConnection();
