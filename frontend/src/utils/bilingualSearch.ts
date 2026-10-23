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
  labelHi: string;
  keywordsEn: string[];
  keywordsTa: string[];
  keywordsHi: string[];
  category: string;
  suggestedSchemeIds: string[];
}

export const BILINGUAL_TOPICS: BilingualTopic[] = [
  {
    id: 'agriculture',
    labelEn: 'Farmer Financial Support',
    labelTa: 'விவசாயி நிதி உதவி',
    labelHi: 'किसान वित्तीय सहायता',
    keywordsEn: ['farmer', 'agriculture', 'kisan', 'crop', 'farming', 'land', 'cultivator', 'samman nidhi'],
    keywordsTa: ['விவசாயி', 'விவசாய', 'பயிர்', 'நிலம்', 'உழவர்', 'கிசான்', 'சாகுபடி', 'விவசாய கடன்'],
    keywordsHi: ['किसान', 'कृषि', 'खेती', 'फसल', 'पीएम किसान', 'सम्मान निधि', 'काश्तकार', 'भूमि'],
    category: 'Agriculture & Rural',
    suggestedSchemeIds: ['pm-kisan'],
  },
  {
    id: 'healthcare',
    labelEn: 'Free Healthcare & Hospitalization',
    labelTa: 'இலவச மருத்துவ சிகிச்சை & காப்பீடு',
    labelHi: 'मुफ्त इलाज एवं स्वास्थ्य बीमा',
    keywordsEn: ['health', 'hospital', 'medical', 'insurance', 'ayushman', 'pmjay', 'treatment', 'doctor'],
    keywordsTa: ['மருத்துவம்', 'சிகிச்சை', 'காப்பீடு', 'மருத்துவமனை', 'ஆயுஷ்மான்', 'ஆரோக்கியம்', 'நோயாளி'],
    keywordsHi: ['स्वास्थ्य', 'अस्पताल', 'इलाज', 'बीमा', 'आयुष्मान', 'जन आरोग्य', 'दवा', 'बीमार'],
    category: 'Healthcare & Wellness',
    suggestedSchemeIds: ['pm-jay', 'ab-pmjay'],
  },
  {
    id: 'housing-rural',
    labelEn: 'Rural House Construction (PMAY-G)',
    labelTa: 'கிராமப்புற வீடு கட்ட நிதி உதவி',
    labelHi: 'ग्रामीण आवास सहायता (PMAY-G)',
    keywordsEn: ['rural house', 'housing', 'pucca house', 'kutcha', 'pmay-g', 'gramin', 'village home'],
    keywordsTa: ['கிராமப்புற வீடு', 'வீடு', 'வீட்டு வசதி', 'ஆவாஸ்', 'குடிசை', 'சொந்த வீடு'],
    keywordsHi: ['ग्रामीण आवास', 'आवास', 'मकान', 'पक्का घर', 'कच्चा घर', 'पीएमएवाई', 'ग्रामीण घर'],
    category: 'Housing & Infrastructure',
    suggestedSchemeIds: ['pmay-g'],
  },
  {
    id: 'housing-urban',
    labelEn: 'Urban Housing & Interest Subsidy (PMAY-U)',
    labelTa: 'நகர்ப்புற வீட்டு மானியம்',
    labelHi: 'शहरी आवास एवं ब्याज सब्सिडी (PMAY-U)',
    keywordsEn: ['urban housing', 'flat', 'city home', 'pmay-u', 'interest subsidy', 'home loan subsidy'],
    keywordsTa: ['நகர்ப்புற வீடு', 'வீட்டு கடன் மானியம்', 'அபார்ட்மெண்ட்', 'நகர வீடு'],
    keywordsHi: ['शहरी आवास', 'शहरी मकान', 'गृह ऋण', 'ब्याज सब्सिडी', 'फ्लैट', 'पीएमएवाई शहरी'],
    category: 'Housing & Infrastructure',
    suggestedSchemeIds: ['pmay-u'],
  },
  {
    id: 'pension',
    labelEn: 'Monthly Pension for Senior Citizens (APY)',
    labelTa: 'முதியோர் மாத ஓய்வூதியம் (அடல் பென்ஷன்)',
    labelHi: 'वरिष्ठ नागरिक मासिक पेंशन (APY)',
    keywordsEn: ['pension', 'old age', 'retirement', 'senior citizen', 'monthly income', 'atal pension', 'apy'],
    keywordsTa: ['ஓய்வூதியம்', 'பென்ஷன்', 'முதியோர்', 'அடல் பென்ஷன்', 'மாத வருமானம்'],
    keywordsHi: ['पेंशन', 'अटल पेंशन', 'वृद्धावस्था', 'सेवानिवृत्त', 'बुढ़ापा', 'मासिक आय', 'रिटायरमेंट'],
    category: 'Social Security & Pensions',
    suggestedSchemeIds: ['atal-pension-yojana'],
  },
  {
    id: 'street-vendor',
    labelEn: 'Street Vendor Working Capital (PM SVANidhi)',
    labelTa: 'தெருவோர வியாபாரிகள் கடன் (ஸ்வநிதி)',
    labelHi: 'स्ट्रीट वेंडर कार्यशील पूंजी ऋण (स्वनिधि)',
    keywordsEn: ['vendor', 'street vendor', 'hawker', 'working capital', 'svanidhi', 'thela', 'stall'],
    keywordsTa: ['தெருவோர வியாபாரி', 'சிறு வியாபாரம்', 'ஸ்வநிதி', 'தள்ளுவண்டி', 'வியாபார கடன்'],
    keywordsHi: ['रेहड़ी', 'पटरी', 'फेरीवाले', 'वेंडर', 'स्वनिधि', 'ठेला', 'कार्यशील पूंजी'],
    category: 'Financial Inclusion & Livelihood',
    suggestedSchemeIds: ['pm-svanidhi'],
  },
  {
    id: 'business-loan',
    labelEn: 'Micro Business Loan (MUDRA)',
    labelTa: 'சிறு தொழில் கடன் (முத்ரா திட்டம்)',
    labelHi: 'सूक्ष्म व्यवसाय ऋण (मुद्रा)',
    keywordsEn: ['mudra', 'business loan', 'startup', 'shop loan', 'shishu', 'kishore', 'tarun', 'commercial loan'],
    keywordsTa: ['முத்ரா', 'தொழில் கடன்', 'சிறு தொழில்', 'வியாபார கடன்', 'சுயதொழில் நிதி'],
    keywordsHi: ['मुद्रा', 'व्यापार ऋण', 'व्यवसाय ऋण', 'शिशु', 'किशोर', 'तरुण', 'दुकान ऋण', 'बिजनेस लोन'],
    category: 'Financial Inclusion & Livelihood',
    suggestedSchemeIds: ['pm-mudra-yojana'],
  },
  {
    id: 'artisan',
    labelEn: 'Artisans & Traditional Crafts (PM Vishwakarma)',
    labelTa: 'பாரம்பரிய கைவினைஞர்கள் திட்டம் (விஸ்வகர்மா)',
    labelHi: 'पारंपरिक शिल्पकार एवं कारीगर (विश्वकर्मा)',
    keywordsEn: ['artisan', 'craft', 'vishwakarma', 'carpenter', 'blacksmith', 'tailor', 'potter', 'barber', 'toolkit'],
    keywordsTa: ['கைவினைஞர்', 'விஸ்வகர்மா', 'தச்சர்', 'கொல்லர்', 'தையல் கலைஞர்', 'குயவர்', 'கருவி மானியம்'],
    keywordsHi: ['विश्वकर्मा', 'कारीगर', 'शिल्पकार', 'बढ़ई', 'लोहार', 'दर्जी', 'कुम्हार', 'टूलकिट', 'औजार'],
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

  // Check Tamil, Hindi, and English semantic topics
  for (const topic of BILINGUAL_TOPICS) {
    const matchesTamil = topic.keywordsTa.some((kw) => norm.includes(kw.toLowerCase()));
    const matchesHindi = topic.keywordsHi.some((kw) => norm.includes(kw.toLowerCase()));
    const matchesEnglish = topic.keywordsEn.some((kw) => norm.includes(kw.toLowerCase()));

    if (matchesTamil || matchesHindi || matchesEnglish) {
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
  {
    id: 'farmer',
    labelEn: '🌾 Farmer Financial Support',
    labelTa: '🌾 விவசாயி உதவி (PM-KISAN)',
    labelHi: '🌾 किसान सहायता (PM-KISAN)',
    query: 'விவசாயி',
    queryHi: 'किसान',
    queryEn: 'farmer',
  },
  {
    id: 'health',
    labelEn: '🏥 Free Treatment Card',
    labelTa: '🏥 மருத்துவ காப்பீடு (AB-PMJAY)',
    labelHi: '🏥 मुफ्त इलाज कार्ड (AB-PMJAY)',
    query: 'மருத்துவம்',
    queryHi: 'आयुष्मान',
    queryEn: 'ayushman',
  },
  {
    id: 'housing',
    labelEn: '🏠 House Construction Aid',
    labelTa: '🏠 வீடு கட்ட உதவி (PMAY)',
    labelHi: '🏠 मकान निर्माण सहायता (PMAY)',
    query: 'வீடு',
    queryHi: 'आवास',
    queryEn: 'housing',
  },
  {
    id: 'pension',
    labelEn: '👴 Senior Monthly Pension',
    labelTa: '👴 முதியோர் ஓய்வூதியம் (APY)',
    labelHi: '👴 वरिष्ठ नागरिक पेंशन (APY)',
    query: 'ஓய்வூதியம்',
    queryHi: 'पेंशन',
    queryEn: 'pension',
  },
  {
    id: 'vendor',
    labelEn: '🛒 Street Vendor Loan',
    labelTa: '🛒 தெருவோர வியாபாரி கடன் (SVANidhi)',
    labelHi: '🛒 रेहड़ी-पटरी ऋण (SVANidhi)',
    query: 'தெருவோர வியாபாரி',
    queryHi: 'स्वनिधि',
    queryEn: 'svanidhi',
  },
  {
    id: 'artisan',
    labelEn: '🔨 Artisan Toolkit & Loan',
    labelTa: '🔨 கைவினைஞர் உதவி (Vishwakarma)',
    labelHi: '🔨 विश्वकर्मा कारीगर सहायता',
    query: 'விஸ்வகர்மா',
    queryHi: 'विश्वकर्मा',
    queryEn: 'vishwakarma',
  },
  {
    id: 'business',
    labelEn: '💼 Micro Business Loan',
    labelTa: '💼 சிறு தொழில் கடன் (MUDRA)',
    labelHi: '💼 सूक्ष्म व्यवसाय ऋण (MUDRA)',
    query: 'முத்ரா',
    queryHi: 'मुद्रा',
    queryEn: 'mudra',
  },
];
