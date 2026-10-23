/**
 * Bilingual Tamil & English Search & Intent Matching Utility for SevAIQ.
 * 
 * Provides rule-based natural language understanding and keyword resolution
 * bridging Tamil citizen queries to government scheme categories and records.
 * Transparent and privacy-safe (zero third-party LLM transmission).
 */

import { Scheme } from '../types';

export interface BilingualTopic {
  id: string;
  labelEn: string;
  labelTa: string;
  keywordsEn: string[];
  keywordsTa: string[];
  category: string;
  suggestedSchemeIds: string[];
}

export const BILINGUAL_TOPICS: BilingualTopic[] = [
  {
    id: 'agriculture',
    labelEn: 'Farmer Financial Support',
    labelTa: 'விவசாயி நிதி உதவி',
    keywordsEn: ['farmer', 'agriculture', 'kisan', 'crop', 'farming', 'land', 'cultivator', 'samman nidhi'],
    keywordsTa: ['விவசாயி', 'விவசாய', 'பயிர்', 'நிலம்', 'உழவர்', 'கிசான்', 'சாகுபடி', 'விவசாய கடன்'],
    category: 'Agriculture & Rural',
    suggestedSchemeIds: ['pm-kisan'],
  },
  {
    id: 'healthcare',
    labelEn: 'Free Healthcare & Hospitalization',
    labelTa: 'இலவச மருத்துவ சிகிச்சை & காப்பீடு',
    keywordsEn: ['health', 'hospital', 'medical', 'insurance', 'ayushman', 'pmjay', 'treatment', 'doctor'],
    keywordsTa: ['மருத்துவம்', 'சிகிச்சை', 'காப்பீடு', 'மருத்துவமனை', 'ஆயுஷ்மான்', 'ஆரோக்கியம்', 'நோயாளி'],
    category: 'Healthcare & Wellness',
    suggestedSchemeIds: ['pm-jay', 'ab-pmjay'],
  },
  {
    id: 'housing-rural',
    labelEn: 'Rural House Construction (PMAY-G)',
    labelTa: 'கிராமப்புற வீடு கட்ட நிதி உதவி',
    keywordsEn: ['rural house', 'housing', 'pucca house', 'kutcha', 'pmay-g', 'gramin', 'village home'],
    keywordsTa: ['கிராமப்புற வீடு', 'வீடு', 'வீட்டு வசதி', 'ஆவாஸ்', 'குடிசை', 'சொந்த வீடு'],
    category: 'Housing & Infrastructure',
    suggestedSchemeIds: ['pmay-g'],
  },
  {
    id: 'housing-urban',
    labelEn: 'Urban Housing & Interest Subsidy (PMAY-U)',
    labelTa: 'நகர்ப்புற வீட்டு மானியம்',
    keywordsEn: ['urban housing', 'flat', 'city home', 'pmay-u', 'interest subsidy', 'home loan subsidy'],
    keywordsTa: ['நகர்ப்புற வீடு', 'வீட்டு கடன் மானியம்', 'அபார்ட்மெண்ட்', 'நகர வீடு'],
    category: 'Housing & Infrastructure',
    suggestedSchemeIds: ['pmay-u'],
  },
  {
    id: 'pension',
    labelEn: 'Monthly Pension for Senior Citizens (APY)',
    labelTa: 'முதியோர் மாத ஓய்வூதியம் (அடல் பென்ஷன்)',
    keywordsEn: ['pension', 'old age', 'retirement', 'senior citizen', 'monthly income', 'atal pension', 'apy'],
    keywordsTa: ['ஓய்வூதியம்', 'பென்ஷன்', 'முதியோர்', 'அடல் பென்ஷன்', 'மாத வருமானம்'],
    category: 'Social Security & Pensions',
    suggestedSchemeIds: ['atal-pension-yojana'],
  },
  {
    id: 'street-vendor',
    labelEn: 'Street Vendor Working Capital (PM SVANidhi)',
    labelTa: 'தெருவோர வியாபாரிகள் கடன் (ஸ்வநிதி)',
    keywordsEn: ['vendor', 'street vendor', 'hawker', 'working capital', 'svanidhi', 'thela', 'stall'],
    keywordsTa: ['தெருவோர வியாபாரி', 'சிறு வியாபாரம்', 'ஸ்வநிதி', 'தள்ளுவண்டி', 'வியாபார கடன்'],
    category: 'Financial Inclusion & Livelihood',
    suggestedSchemeIds: ['pm-svanidhi'],
  },
  {
    id: 'business-loan',
    labelEn: 'Micro Business Loan (MUDRA)',
    labelTa: 'சிறு தொழில் கடன் (முத்ரா திட்டம்)',
    keywordsEn: ['mudra', 'business loan', 'startup', 'shop loan', 'shishu', 'kishore', 'tarun', 'commercial loan'],
    keywordsTa: ['முத்ரா', 'தொழில் கடன்', 'சிறு தொழில்', 'வியாபார கடன்', 'சுயதொழில் நிதி'],
    category: 'Financial Inclusion & Livelihood',
    suggestedSchemeIds: ['pm-mudra-yojana'],
  },
  {
    id: 'artisan',
    labelEn: 'Artisans & Traditional Crafts (PM Vishwakarma)',
    labelTa: 'பாரம்பரிய கைவினைஞர்கள் திட்டம் (விஸ்வகர்மா)',
    keywordsEn: ['artisan', 'craft', 'vishwakarma', 'carpenter', 'blacksmith', 'tailor', 'potter', 'barber', 'toolkit'],
    keywordsTa: ['கைவினைஞர்', 'விஸ்வகர்மா', 'தச்சர்', 'கொல்லர்', 'தையல் கலைஞர்', 'குயவர்', 'கருவி மானியம்'],
    category: 'Skill Development & Livelihood',
    suggestedSchemeIds: ['pm-vishwakarma'],
  },
];

/**
 * Normalizes input text for case-insensitive matching across Latin and Tamil Unicode characters.
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Evaluates whether a scheme matches a bilingual query term or natural-language expression.
 */
export function matchesBilingualQuery(scheme: Scheme, query: string): boolean {
  const norm = normalizeQuery(query);
  if (!norm) return true;

  // Direct English field comparison
  const inEnglishFields =
    scheme.title.toLowerCase().includes(norm) ||
    scheme.short_description.toLowerCase().includes(norm) ||
    scheme.ministry.toLowerCase().includes(norm) ||
    scheme.category.toLowerCase().includes(norm) ||
    (scheme.beneficiary_type && scheme.beneficiary_type.toLowerCase().includes(norm)) ||
    (scheme.detailed_benefits && scheme.detailed_benefits.toLowerCase().includes(norm));

  if (inEnglishFields) return true;

  // Check Tamil and English semantic topics
  for (const topic of BILINGUAL_TOPICS) {
    const matchesTamil = topic.keywordsTa.some((kw) => norm.includes(kw.toLowerCase()));
    const matchesEnglish = topic.keywordsEn.some((kw) => norm.includes(kw.toLowerCase()));

    if (matchesTamil || matchesEnglish) {
      // If the topic matches, check if this scheme is suggested or shares the category
      if (
        topic.suggestedSchemeIds.some(
          (sId) => sId.toLowerCase() === scheme.id.toLowerCase()
        ) ||
        scheme.category.toLowerCase().includes(topic.category.toLowerCase()) ||
        topic.category.toLowerCase().includes(scheme.category.toLowerCase())
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns suggested bilingual quick queries for discovery chips.
 */
export const QUICK_SEARCH_CHIPS = [
  { id: 'farmer', labelEn: '🌾 Farmer Financial Support', labelTa: '🌾 விவசாயி உதவி (PM-KISAN)', query: 'விவசாயி' },
  { id: 'health', labelEn: '🏥 Free Treatment Card', labelTa: '🏥 மருத்துவ காப்பீடு (AB-PMJAY)', query: 'மருத்துவம்' },
  { id: 'housing', labelEn: '🏠 House Construction Aid', labelTa: '🏠 வீடு கட்ட உதவி (PMAY)', query: 'வீடு' },
  { id: 'pension', labelEn: '👴 Senior Monthly Pension', labelTa: '👴 முதியோர் ஓய்வூதியம் (APY)', query: 'ஓய்வூதியம்' },
  { id: 'vendor', labelEn: '🛒 Street Vendor Loan', labelTa: '🛒 தெருவோர வியாபாரி கடன் (SVANidhi)', query: 'தெருவோர வியாபாரி' },
  { id: 'artisan', labelEn: '🔨 Artisan Toolkit & Loan', labelTa: '🔨 கைவினைஞர் உதவி (Vishwakarma)', query: 'விஸ்வகர்மா' },
  { id: 'business', labelEn: '💼 Micro Business Loan', labelTa: '💼 சிறு தொழில் கடன் (MUDRA)', query: 'முத்ரா' },
];
