#!/usr/bin/env node

/**
 * Test CTFd-Style Dynamic Scoring System
 * 
 * This script tests the dynamic scoring calculations
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Challenge = require('../models/Challenge');

async function testDynamicScoring() {
  try {
    console.log('==============================================');
    console.log('  CTFd-Style Dynamic Scoring Test');
    console.log('==============================================\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected\n');

    // Find a challenge to test (or use first available)
    const challenge = await Challenge.findOne({});
    
    if (!challenge) {
      console.log('❌ No challenges found in database');
      console.log('Create some challenges first!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Testing with challenge: "${challenge.title}"`);
    console.log(`Static points: ${challenge.points}`);
    console.log(`Dynamic scoring enabled: ${challenge.dynamicScoring?.enabled || false}\n`);

    if (!challenge.dynamicScoring?.enabled) {
      console.log('⚠️  Dynamic scoring is not enabled for this challenge');
      console.log('Run: node scripts/enableDynamicScoring.js\n');
      
      // Test with hypothetical values
      console.log('=== Simulation (if enabled) ===');
      const initial = challenge.points;
      const minimum = Math.floor(initial * 0.25);
      const decay = 50;
      
      testDecayCurve(initial, minimum, decay);
    } else {
      console.log('=== Current Configuration ===');
      console.log(`Initial value: ${challenge.dynamicScoring.initial} pts`);
      console.log(`Minimum value: ${challenge.dynamicScoring.minimum} pts`);
      console.log(`Decay rate: ${challenge.dynamicScoring.decay} solves\n`);
      
      console.log('=== Current State ===');
      const currentSolves = challenge.solvedBy?.length || 0;
      const currentValue = challenge.getCurrentValue();
      console.log(`Current solves: ${currentSolves}`);
      console.log(`Current value: ${currentValue} pts\n`);
      
      testDecayCurve(
        challenge.dynamicScoring.initial,
        challenge.dynamicScoring.minimum,
        challenge.dynamicScoring.decay
      );
    }

    await mongoose.connection.close();
    console.log('\n✓ Test complete\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

function testDecayCurve(initial, minimum, decay) {
  console.log('=== Decay Curve Simulation ===');
  console.log('Solves | Value  | % of Initial');
  console.log('-------|--------|-------------');
  
  const testPoints = [0, 1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
  
  for (const solves of testPoints) {
    let value;
    if (solves === 0) {
      value = initial;
    } else if (solves >= decay) {
      value = minimum;
    } else {
      value = Math.floor(
        ((minimum - initial) / Math.pow(decay, 2)) * Math.pow(solves, 2) + initial
      );
      value = Math.max(minimum, Math.min(initial, value));
    }
    
    const percentage = ((value / initial) * 100).toFixed(1);
    console.log(`${solves.toString().padStart(6)} | ${value.toString().padStart(6)} | ${percentage}%`);
  }
  
  console.log('\n💡 Key Points:');
  console.log(`   - First solve: ${initial} pts (100%)`);
  console.log(`   - At ${decay} solves: ${minimum} pts (25%)`);
  console.log(`   - Values decay logarithmically (CTFd-style)`);
}

// Run the test
testDynamicScoring();
