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
      'environment',
      'agriculture,rural & environment',
    ],
  },
  {
    id: 'banking',
    label: 'Banking, Financial Services and Insurance',
    aliases: [
      'banking',
      'financial',
      'finance',
      'insurance',
      'loan',
      'credit',
      'bank',
      'bima',
      'banking,financial services and insurance',
    ],
  },
  {
    id: 'business',
    label: 'Business & Entrepreneurship',
    aliases: [
      'business',
      'entrepreneurship',
      'enterprise',
      'msme',
      'startup',
      'vendor',
      'commerce',
      'svanidhi',
      'livelihood',
      'urban livelihoods',
      'business & entrepreneurship',
    ],
  },
  {
    id: 'education',
    label: 'Education & Learning',
    aliases: [
      'education',
      'learning',
      'education & skilling',
      'skilling',
      'scholarship',
      'student',
      'skill development',
      'post-matric',
      'education & learning',
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
      'health & wellness',
    ],
  },
  {
    id: 'housing',
    label: 'Housing & Shelter',
    aliases: [
      'housing',
      'housing & infrastructure',
      'shelter',
      'awas',
      'infrastructure',
      'pmay',
      'home',
      'housing & shelter',
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
    id: 'public-safety',
    label: 'Public Safety, Law & Justice',
    aliases: [
      'public safety',
      'law',
      'justice',
      'police',
      'legal',
      'safety',
      'public safety,law & justice',
    ],
  },
  {
    id: 'science-it',
    label: 'Science, IT & Communications',
    aliases: [
      'science',
      'it',
      'communications',
      'technology',
      'digital',
      'research',
      'telecom',
      'science, it & communications',
    ],
  },
  {
    id: 'skills',
    label: 'Skills & Employment',
    aliases: [
      'skills',
      'employment',
      'job',
      'training',
      'skilling',
      'vocational',
      'career',
      'rojgar',
      'skills & employment',
    ],
  },
  {
    id: 'social-welfare',
    label: 'Social welfare & Empowerment',
    aliases: [
      'social welfare',
      'empowerment',
      'social justice',
      'pension',
      'sc',
      'st',
      'obc',
      'disability',
      'divyang',
      'tribal',
      'social welfare & empowerment',
    ],
  },
  {
    id: 'sports',
    label: 'Sports & Culture',
    aliases: [
      'sports',
      'culture',
      'heritage',
      'athletics',
      'games',
      'art',
      'khelo',
      'sports & culture',
    ],
  },
  {
    id: 'transport',
    label: 'Transport & Infrastructure',
    aliases: [
      'transport',
      'infrastructure',
      'roads',
      'highways',
      'railways',
      'transit',
      'mobility',
      'transport & infrastructure',
    ],
  },
  {
    id: 'tourism',
    label: 'Travel & Tourism',
    aliases: [
      'travel',
      'tourism',
      'hospitality',
      'tourist',
      'travel & tourism',
    ],
  },
  {
    id: 'utility',
    label: 'Utility & Sanitation',
    aliases: [
      'utility',
      'sanitation',
      'cleanliness',
      'swachh',
      'water',
      'electricity',
      'drainage',
      'utility & sanitation',
    ],
  },
  {
    id: 'women-child',
    label: 'Women and Child',
    aliases: [
      'women',
      'child',
      'women and child',
      'maternity',
      'girl',
      'poshan',
      'anganwadi',
      'matru',
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
