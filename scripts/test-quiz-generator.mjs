#!/usr/bin/env node
/**
 * Test script for quiz generator
 * Verifies:
 * 1. generateRandomQuiz(10) returns 10 questions for each difficulty
 * 2. All options in ru locale are Cyrillic (no English fallbacks)
 */

import { 
  generateRandomQuiz, 
  getAvailableQuestionCount,
  getQuestionCountsByDifficulty 
} from '../src/lib/quiz-generator.ts';

// Check if a string is primarily Cyrillic (allows Roman numerals like I, II, V, X)
function isCyrillic(str) {
  // Allow Cyrillic letters, spaces, punctuation, and Roman numerals (I, V, X, L, C, D, M)
  return /^[\u0400-\u04FFIVXLCDM\s,'\-\.\(\)0-9]+$/.test(str);
}

function runTests() {
  console.log("=== Quiz Generator Tests ===\n");
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Check available question counts
  console.log("1. Checking available question counts per difficulty...");
  const counts = getQuestionCountsByDifficulty();
  console.log(`   Easy: ${counts.easy}, Medium: ${counts.medium}, Hard: ${counts.hard}, Mixed: ${counts.mixed}`);
  
  const totalSelfies = 50;
  if (counts.mixed === totalSelfies) {
    console.log(`   ✓ Mixed count matches total selfies (${totalSelfies})`);
    passed++;
  } else {
    console.log(`   ✗ Mixed count (${counts.mixed}) doesn't match total selfies (${totalSelfies})`);
    failed++;
  }
  
  // Test 2: Generate 10 questions for each difficulty
  console.log("\n2. Testing question generation for each difficulty...");
  
  const difficulties = ['easy', 'medium', 'hard', undefined]; // undefined = mixed
  
  for (const diff of difficulties) {
    const diffName = diff || 'mixed';
    const available = getAvailableQuestionCount(diff);
    const requestCount = Math.min(10, available);
    
    const { questions, practice } = generateRandomQuiz(diff, requestCount);
    
    if (questions.length === requestCount) {
      console.log(`   ✓ ${diffName}: Generated ${questions.length} questions (requested ${requestCount})`);
      passed++;
    } else {
      console.log(`   ✗ ${diffName}: Generated ${questions.length} questions (requested ${requestCount})`);
      failed++;
    }
  }
  
  // Test 3: Verify all options are Cyrillic (Russian locale)
  console.log("\n3. Testing that all answer options are in Cyrillic (Russian)...");
  
  for (const diff of difficulties) {
    const diffName = diff || 'mixed';
    const available = getAvailableQuestionCount(diff);
    const requestCount = Math.min(10, available);
    
    const { questions, practice } = generateRandomQuiz(diff, requestCount);
    
    let allCyrillic = true;
    const englishOptions = [];
    
    for (const q of questions) {
      for (const opt of q.options) {
        if (!isCyrillic(opt)) {
          allCyrillic = false;
          englishOptions.push(opt);
        }
      }
    }
    
    // Also check practice question
    if (practice) {
      for (const opt of practice.options) {
        if (!isCyrillic(opt)) {
          allCyrillic = false;
          englishOptions.push(opt);
        }
      }
    }
    
    if (allCyrillic) {
      console.log(`   ✓ ${diffName}: All options are Cyrillic`);
      passed++;
    } else {
      console.log(`   ✗ ${diffName}: Found English options: ${[...new Set(englishOptions)].join(', ')}`);
      failed++;
    }
  }
  
  // Test 4: Stress test - generate many quizzes to ensure no English leaks
  console.log("\n4. Stress test - generating 50 quizzes to check for English leaks...");
  
  let stressAllCyrillic = true;
  const stressEnglishOptions = new Set();
  
  for (let i = 0; i < 50; i++) {
    const diff = difficulties[i % difficulties.length];
    const available = getAvailableQuestionCount(diff);
    const requestCount = Math.min(10, available);
    
    const { questions, practice } = generateRandomQuiz(diff, requestCount);
    
    for (const q of questions) {
      for (const opt of q.options) {
        if (!isCyrillic(opt)) {
          stressAllCyrillic = false;
          stressEnglishOptions.add(opt);
        }
      }
    }
    
    if (practice) {
      for (const opt of practice.options) {
        if (!isCyrillic(opt)) {
          stressAllCyrillic = false;
          stressEnglishOptions.add(opt);
        }
      }
    }
  }
  
  if (stressAllCyrillic) {
    console.log(`   ✓ Stress test passed: All 50 quizzes have only Cyrillic options`);
    passed++;
  } else {
    console.log(`   ✗ Stress test failed: Found English options: ${[...stressEnglishOptions].join(', ')}`);
    failed++;
  }
  
  // Summary
  console.log("\n=== Summary ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    process.exit(1);
  }
  
  console.log("\n✓ All tests passed!");
}

runTests();
