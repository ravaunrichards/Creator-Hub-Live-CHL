import assert from 'node:assert/strict';
import { GIFTER_LEVELS, resolveGifterLevel, thresholdForLevel, validateGifterCatalog } from '../src/gifter-progression.js';

assert.equal(validateGifterCatalog(), true);
assert.equal(GIFTER_LEVELS.length, 50);
assert.equal(resolveGifterLevel(0).level, 0);
assert.equal(resolveGifterLevel(thresholdForLevel(1) - 1).level, 0);
assert.equal(resolveGifterLevel(thresholdForLevel(1)).level, 1);
assert.equal(resolveGifterLevel(thresholdForLevel(25)).level, 25);
assert.equal(resolveGifterLevel(99_999_999).level, 49);
assert.equal(resolveGifterLevel(100_000_000).level, 50);
assert.equal(resolveGifterLevel(100_000_000).badgeStyle, 'cosmic');
assert.throws(() => thresholdForLevel(0), RangeError);
assert.throws(() => resolveGifterLevel(-1), TypeError);
assert.throws(() => resolveGifterLevel(Number.MAX_SAFE_INTEGER + 1), TypeError);
console.log('PASS — 50-level gifter progression, strictly increasing lifetime thresholds, and level-50 100M coin milestone.');
