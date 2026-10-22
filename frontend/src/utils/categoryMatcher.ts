/**
 * Category Normalization and Matching Utility
 * 
 * Provides robust mapping between frontend display category labels
 * and backend/official category strings.
 */

export interface CategoryOption {
  id: string;
  label: string;
  aliases: string[];
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'all',
    label: 'All Sectors',
    aliases: ['all', 'all sectors', 'all categories', '*'],
  },
  {
    id: 'agriculture',
    label: 'Agriculture & Rural',
    aliases: [
      'agriculture',
      'rural',
      'agriculture & rural',
      'farmer',
      'farming',
      'krishi',
      'kisan',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare & Wellness',
    aliases: [
      'healthcare',
      'health',
      'wellness',
      'healthcare & wellness',
      'medical',
      'ayushman',
      'hospitalization',
    ],
  },
  {
    id: 'livelihood',
    label: 'Urban Livelihoods & Enterprise',
    aliases: [
      'livelihood',
      'urban livelihoods',
      'urban livelihoods & enterprise',
      'enterprise',
      'microcredit',
      'vendor',
      'business',
      'svanidhi',
    ],
  },
  {
    id: 'education',
    label: 'Education & Skilling',
    aliases: [
      'education',
      'education & skilling',
      'skilling',
      'scholarship',
      'student',
      'skill development',
      'post-matric',
    ],
  },
  {
    id: 'housing',
    label: 'Housing & Infrastructure',
    aliases: [
      'housing',
      'housing & infrastructure',
      'shelter',
      'awas',
      'infrastructure',
      'pmay',
    ],
  },
];

/**
 * Checks if a scheme's category matches the selected category filter option.
 * 
 * @param schemeCategory The raw category string from the scheme record
 * @param selectedCategoryId The identifier of the selected filter (e.g. 'all', 'agriculture')
 */
export function matchesCategory(schemeCategory: string, selectedCategoryId: string): boolean {
  if (!selectedCategoryId || selectedCategoryId === 'all') {
    return true;
  }

  const option = CATEGORY_OPTIONS.find((opt) => opt.id === selectedCategoryId);
  if (!option) {
    // If not in predefined list, do a case-insensitive direct or partial match
    return schemeCategory.toLowerCase().trim() === selectedCategoryId.toLowerCase().trim();
  }

  const normalizedSchemeCategory = (schemeCategory || '').toLowerCase().trim();
  if (!normalizedSchemeCategory) {
    return false;
  }

  // Check if normalized scheme category matches id or any alias
  return (
    normalizedSchemeCategory === option.id ||
    option.aliases.some(
      (alias) =>
        normalizedSchemeCategory === alias ||
        normalizedSchemeCategory.includes(alias) ||
        alias.includes(normalizedSchemeCategory)
    )
  );
}
