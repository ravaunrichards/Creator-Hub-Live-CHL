import levelCatalog from '../../frontend/assets/gifts/gifter-levels.json' with { type: 'json' };

export const GIFTER_LEVELS = Object.freeze(levelCatalog.levels.map((level) => Object.freeze({ ...level })));
export const GIFTER_CATEGORIES = Object.freeze(levelCatalog.categories.map((category) => Object.freeze({ ...category })));

export function thresholdForLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > 50) throw new RangeError('Level must be an integer from 1 through 50.');
  return GIFTER_LEVELS[level - 1].minEligibleCoinsSpent;
}

export function resolveGifterLevel(eligibleCoinsSpent) {
  const amount = Number(eligibleCoinsSpent);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new TypeError('Eligible coin spend must be a non-negative safe integer.');
  let result = { level: 0, name: 'Newcomer', category: null, badgeId: null, badgeStyle: null, threshold: 0 };
  for (const item of GIFTER_LEVELS) {
    if (amount < item.minEligibleCoinsSpent) break;
    result = { level: item.level, name: item.name, category: item.category, badgeId: item.id, badgeStyle: item.badgeStyle, threshold: item.minEligibleCoinsSpent };
  }
  return { ...result, eligibleCoinsSpent: amount };
}

export function validateGifterCatalog(catalog = levelCatalog) {
  if (!Array.isArray(catalog.levels) || catalog.levels.length !== 50) throw new Error('Gifter catalog must define exactly 50 levels.');
  let previous = 0;
  for (let index = 0; index < catalog.levels.length; index += 1) {
    const item = catalog.levels[index];
    if (item.level !== index + 1 || !Number.isSafeInteger(item.minEligibleCoinsSpent) || item.minEligibleCoinsSpent <= previous || !item.id || !item.badgeStyle) {
      throw new Error(`Invalid or non-increasing gifter level definition at index ${index}.`);
    }
    previous = item.minEligibleCoinsSpent;
  }
  if (previous !== 100_000_000) throw new Error('Level 50 must begin at 100,000,000 eligible gift coins.');
  return true;
}

validateGifterCatalog();
