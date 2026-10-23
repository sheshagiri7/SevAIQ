/**
 * Voice Assistant Knowledge Engine for SevAIQ.
 * 
 * Provides truthful, verified responses in Tamil and English based on the official scheme catalog.
 * No fabricated AI claims; maps citizen queries directly to authentic government guidelines.
 */

import { Scheme, AssistantLanguage, NavigationTab } from '../types';

export interface AssistantAnswer {
  text: string;
  matchedSchemes: Scheme[];
  suggestedAction?: {
    label: string;
    tab: NavigationTab;
    schemeId?: string;
  };
}

export const SAMPLE_PROMPTS: Record<AssistantLanguage, Array<{ label: string; query: string }>> = {
  ta: [
    { label: '🌾 விவசாயி உதவி', query: 'விவசாயிகளுக்கு என்னென்ன அரசு திட்டங்கள் உள்ளன?' },
    { label: '🏥 இலவச மருத்துவ காப்பீடு', query: 'ஆயுஷ்மான் பாரத் அட்டை பெறுவது எப்படி?' },
    { label: '🏠 வீடு கட்ட நிதி உதவி', query: 'வீடு கட்ட அரசு மானியம் யாருக்கு கிடைக்கும்?' },
    { label: '👴 முதியோர் ஓய்வூதியம்', query: 'முதியோர் பென்ஷன் திட்டத்திற்கு என்னென்ன ஆவணங்கள் தேவை?' },
    { label: '🛒 வியாபார கடன்', query: 'தெருவோர வியாபாரிகள் கடன் பெறுவது எப்படி?' },
  ],
  en: [
    { label: '🌾 Farmer Financial Support', query: 'What schemes are available for farmers?' },
    { label: '🏥 Free Healthcare Card', query: 'How to get an Ayushman Bharat health card?' },
    { label: '🏠 Housing Subsidy', query: 'Who is eligible for PMAY housing grant?' },
    { label: '👴 Senior Pension', query: 'What documents are required for Atal Pension Yojana?' },
    { label: '🛒 Street Vendor Loan', query: 'How can street vendors apply for PM SVANidhi loan?' },
  ],
  hi: [
    { label: '🌾 किसान वित्तीय सहायता', query: 'किसानों के लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?' },
    { label: '🏥 मुफ्त स्वास्थ्य कार्ड', query: 'आयुष्मान भारत स्वास्थ्य कार्ड कैसे प्राप्त करें?' },
    { label: '🏠 आवास निर्माण अनुदान', query: 'पीएम आवास योजना के तहत मकान के लिए कौन पात्र है?' },
    { label: '👴 वरिष्ठ नागरिक पेंशन', query: 'अटल पेंशन योजना के लिए कौन से दस्तावेज आवश्यक हैं?' },
    { label: '🛒 रेहड़ी-पटरी ऋण', query: 'स्ट्रीट वेंडर पीएम स्वनिधि लोन के लिए कैसे आवेदन करें?' },
  ],
};

export function processCitizenQuery(
  rawQuery: string,
  language: AssistantLanguage,
  schemes: Scheme[]
): AssistantAnswer {
  const query = rawQuery.trim().toLowerCase();

  // 1. Farmer / PM-KISAN
  if (
    query.includes('விவசாயி') ||
    query.includes('விவசாய') ||
    query.includes('farmer') ||
    query.includes('kisan') ||
    query.includes('agriculture') ||
    query.includes('பயிர்') ||
    query.includes('किसान') ||
    query.includes('खेती') ||
    query.includes('कृषि')
  ) {
    const kisan = schemes.find((s) => s.id === 'pm-kisan');
    if (language === 'ta') {
      return {
        text: 'விவசாயிகளுக்கு "பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)" திட்டம் உள்ளது. சொந்த நிலம் உள்ள விவசாய குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 (மூன்று தவணைகளில் தலா ₹2,000) நேரடியாக வங்கி கணக்கில் செலுத்தப்படுகிறது. தேவையான ஆவணங்கள்: ஆதார் அட்டை, நில பட்டா/சிட்டா (RoR), வங்கி கணக்கு புத்தகம், மற்றும் ஆதார் இணைக்கப்பட்ட மொபைல் எண். விண்ணப்பிக்க pmkisan.gov.in போர்ட்டல் அல்லது பொது சேவை மையத்தை (CSC) அணுகலாம்.',
        matchedSchemes: kisan ? [kisan] : [],
        suggestedAction: {
          label: 'விவசாயி தகுதி சரிபார்க்கவும் (Check Eligibility)',
          tab: 'eligibility',
          schemeId: 'pm-kisan',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: 'किसानों के लिए सरकार द्वारा "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)" योजना संचालित है। इसके तहत पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता, ₹2,000 की तीन 4-मासिक किस्तों में सीधे आधार से जुड़े बैंक खाते में DBT के माध्यम से प्रदान की जाती है। आवश्यक दस्तावेज: आधार कार्ड, भूमि स्वामित्व अभिलेख (खतौनी / RoR), बैंक पासबुक, और सक्रिय मोबाइल नंबर। आप pmkisan.gov.in पोर्टल अथवा नजदीकी जन सेवा केंद्र (CSC) से आवेदन कर सकते हैं।',
        matchedSchemes: kisan ? [kisan] : [],
        suggestedAction: {
          label: 'पीएम किसान पात्रता जांचें',
          tab: 'eligibility',
          schemeId: 'pm-kisan',
        },
      };
    }
    return {
      text: 'For farmers, the government provides the "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)" scheme. Eligible landholding farmer families receive ₹6,000 annually in three 4-monthly installments of ₹2,000 directly into Aadhaar-linked bank accounts via DBT. Mandatory documents: Aadhaar Card, Land Ownership Document (RoR / Khasra-Khatauni), Bank Passbook, and active mobile number. You can apply on pmkisan.gov.in or at Common Service Centres (CSCs).',
      matchedSchemes: kisan ? [kisan] : [],
      suggestedAction: {
        label: 'Check PM-KISAN Eligibility',
        tab: 'eligibility',
        schemeId: 'pm-kisan',
      },
    };
  }

  // 2. Healthcare / Ayushman Bharat / AB-PMJAY
  if (
    query.includes('மருத்துவம்') ||
    query.includes('சிகிச்சை') ||
    query.includes('காப்பீடு') ||
    query.includes('ஆயுஷ்மான்') ||
    query.includes('health') ||
    query.includes('medical') ||
    query.includes('hospital') ||
    query.includes('ayushman') ||
    query.includes('pmjay') ||
    query.includes('स्वास्थ्य') ||
    query.includes('इलाज') ||
    query.includes('चिकित्सा') ||
    query.includes('अस्पताल') ||
    query.includes('आयुष्मान') ||
    query.includes('बीमार')
  ) {
    const pmjay = schemes.find((s) => s.id === 'pm-jay' || s.id === 'ab-pmjay');
    if (language === 'ta') {
      return {
        text: 'ஏழை எளிய குடும்பங்களுக்கு "ஆயுஷ்மான் பாரத் - பிரதம மந்திரி ஜன் ஆரோக்கிய திட்டம் (AB-PMJAY)" மூலம் ஆண்டுக்கு குடும்பத்திற்கு ₹5,00,000 வரை இலவச பணமில்லா மருத்துவ சிகிச்சை வழங்கப்படுகிறது. 70 வயது நிரம்பிய அனைத்து மூத்த குடிமக்களுக்கும் ஆயுஷ்மான் வய வந்தனா அட்டை மூலம் இது விரிவுபடுத்தப்பட்டுள்ளது. தேவையான ஆவணங்கள்: ஆதார் அட்டை, குடும்ப அட்டை (Ration Card), மொபைல் எண். அருகிலுள்ள அரசு அல்லது இணைக்கப்பட்ட தனியார் மருத்துவமனையில் உள்ள ஆயுஷ்மான் மித்ரா மையத்தில் உடனடியாக அட்டை பெறலாம்.',
        matchedSchemes: pmjay ? [pmjay] : [],
        suggestedAction: {
          label: 'ஆயுஷ்மான் பாரத் தகுதி சரிபார்க்கவும்',
          tab: 'eligibility',
          schemeId: 'pm-jay',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: 'पात्र परिवारों को "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY)" के अंतर्गत सूचीबद्ध सरकारी व निजी अस्पतालों में प्रति वर्ष प्रति परिवार ₹5,00,000 तक का निःशुल्क कैशलेस इलाज मिलता है। 70 वर्ष से अधिक उम्र के सभी वरिष्ठ नागरिकों को भी आयुष्मान वय वंदना कार्ड के तहत यह सुरक्षा उपलब्ध है। आवश्यक दस्तावेज: आधार कार्ड, राशन कार्ड (NFSA Card) और सक्रिय मोबाइल नंबर। beneficiary.nha.gov.in पर या नजदीकी अस्पताल के आयुष्मान मित्र केंद्र पर जाकर कार्ड बनवा सकते हैं।',
        matchedSchemes: pmjay ? [pmjay] : [],
        suggestedAction: {
          label: 'आयुष्मान भारत पात्रता जांचें',
          tab: 'eligibility',
          schemeId: 'pm-jay',
        },
      };
    }
    return {
      text: 'Under Ayushman Bharat (AB-PMJAY), eligible families receive health coverage of ₹5 Lakh per year for hospitalization at empanelled public and private hospitals nationwide. Senior citizens aged 70+ are also covered universally under the Ayushman Vay Vandana card. Required documents: Aadhaar Card, Ration Card / NFSA Card, and Mobile Number. Visit beneficiary.nha.gov.in or an Ayushman Mitra desk at any empanelled hospital.',
      matchedSchemes: pmjay ? [pmjay] : [],
      suggestedAction: {
        label: 'Check AB-PMJAY Eligibility',
        tab: 'eligibility',
        schemeId: 'pm-jay',
      },
    };
  }

  // 3. Housing / PMAY
  if (
    query.includes('வீடு') ||
    query.includes('ஆவாஸ்') ||
    query.includes('house') ||
    query.includes('housing') ||
    query.includes('pmay') ||
    query.includes('pucca') ||
    query.includes('मकान') ||
    query.includes('आवास') ||
    query.includes('घर')
  ) {
    const pmayg = schemes.find((s) => s.id === 'pmay-g');
    const pmayu = schemes.find((s) => s.id === 'pmay-u');
    const matched = [pmayg, pmayu].filter(Boolean) as Scheme[];

    if (language === 'ta') {
      return {
        text: 'வீடு கட்ட இரண்டு முக்கிய அரசு திட்டங்கள் உள்ளன: 1) கிராமப்புறங்களுக்கு "பிரதான் மந்திரி ஆவாஸ் யோஜனா - கிராமின் (PMAY-G)" மூலம் சொந்தமாக பக்கா வீடு இல்லாத ஏழைகளுக்கு ₹1.20 லட்சம் முதல் ₹1.30 லட்சம் வரை நேரடி மானியம் வழங்கப்படுகிறது. 2) நகர்ப்புறங்களுக்கு "PMAY-U" மூலம் வட்டி மானியம் அல்லது ₹2.67 லட்சம் வரை உதவி கிடைக்கிறது. இந்தியாவில் எங்கும் சொந்தமாக பக்கா வீடு இருக்கக்கூடாது. தேவையான ஆவணங்கள்: ஆதார் அட்டை, வங்கி கணக்கு புத்தகம், கிராம பஞ்சாயத்து ஆவணங்கள்.',
        matchedSchemes: matched,
        suggestedAction: {
          label: 'வீட்டு வசதி திட்டங்கள் பார்க்கவும்',
          tab: 'discover',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: 'पक्के मकान हेतु दो प्रमुख सरकारी योजनाएं हैं: 1) ग्रामीण क्षेत्रों के लिए "प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)" जिसके तहत कच्चे घर में रहने वाले बेघर परिवारों को ₹1.20 लाख से ₹1.30 लाख का प्रत्यक्ष सरकारी अनुदान मिलता है। 2) शहरी क्षेत्रों के लिए "PMAY-U" जिसके तहत ब्याज सब्सिडी या ₹2.67 लाख तक की सहायता मिलती है। भारत में कहीं भी पक्का मकान नहीं होना चाहिए। आवश्यक दस्तावेज: आधार कार्ड, बैंक पासबुक, भूमि पट्टा/स्वामित्व प्रमाण पत्र और जॉब कार्ड।',
        matchedSchemes: matched,
        suggestedAction: {
          label: 'आवास योजनाएं देखें',
          tab: 'discover',
        },
      };
    }
    return {
      text: 'The government operates two housing schemes: 1) PMAY-Gramin provides ₹1.20 Lakh to ₹1.30 Lakh direct grant to rural families living in kutcha houses or without homes. 2) PMAY-Urban provides interest subsidy and central assistance up to ₹2.67 Lakh for urban EWS/LIG families. Beneficiaries must not own a pucca house anywhere in India. Required documents: Aadhaar, Bank Passbook, Land Title/Patta, and MGNREGA Job Card (for rural).',
      matchedSchemes: matched,
      suggestedAction: {
        label: 'Explore Housing Schemes',
        tab: 'discover',
      },
    };
  }

  // 4. Pension / APY
  if (
    query.includes('ஓய்வூதியம்') ||
    query.includes('பென்ஷன்') ||
    query.includes('முதியோர்') ||
    query.includes('pension') ||
    query.includes('atal') ||
    query.includes('apy') ||
    query.includes('retirement') ||
    query.includes('पेंशन') ||
    query.includes('वृद्ध') ||
    query.includes('रिटायर') ||
    query.includes('बुढ़ापा')
  ) {
    const apy = schemes.find((s) => s.id === 'atal-pension-yojana');
    if (language === 'ta') {
      return {
        text: '"அடல் பென்ஷன் யோஜனா (APY)" மூலம் 18 முதல் 40 வயதுடைய இந்திய குடிமக்கள் தங்களின் 60 வயதுக்குப் பிறகு மாதம் ₹1,000 முதல் ₹5,000 வரை உத்தரவாதமான மாதாந்திர ஓய்வூதியம் பெறலாம். குறைந்த மாதாந்திர பங்களிப்புடன் உங்கள் சேமிப்பு கணக்கு உள்ள எந்த வங்கியிலும் அல்லது தபால் நிலையத்திலும் இதில் சேரலாம். தேவையான ஆவணங்கள்: ஆதார் அட்டை, வங்கி சேமிப்பு கணக்கு, மொபைல் எண். வருமான வரி செலுத்துவோர் இதற்கு தகுதியற்றவர்கள்.',
        matchedSchemes: apy ? [apy] : [],
        suggestedAction: {
          label: 'ஓய்வூதிய தகுதி பார்க்கவும்',
          tab: 'eligibility',
          schemeId: 'atal-pension-yojana',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: '"अटल पेंशन योजना (APY)" के तहत 18 से 40 वर्ष के भारतीय नागरिक 60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 प्रतिमाह की आजीवन गारंटीड पेंशन प्राप्त कर सकते हैं। अपनी आयु के अनुसार न्यूनतम मासिक अंशदान देकर किसी भी बैंक शाखा या डाकघर में खाता खुलवाया जा सकता है। आवश्यक दस्तावेज: आधार कार्ड, बचत बैंक खाता और मोबाइल नंबर। ध्यान दें: आयकर दाता इसके पात्र नहीं हैं।',
        matchedSchemes: apy ? [apy] : [],
        suggestedAction: {
          label: 'अटल पेंशन पात्रता जांचें',
          tab: 'eligibility',
          schemeId: 'atal-pension-yojana',
        },
      };
    }
    return {
      text: 'Under Atal Pension Yojana (APY), Indian citizens aged 18 to 40 can secure a guaranteed monthly pension of ₹1,000 to ₹5,000 upon reaching 60 years of age. Contributions depend on joining age and selected pension slab. Required documents: Aadhaar Card, Savings Bank Account, and Mobile Number. Note: Income tax payers are not eligible to enroll.',
      matchedSchemes: apy ? [apy] : [],
      suggestedAction: {
        label: 'Check APY Eligibility',
        tab: 'eligibility',
        schemeId: 'atal-pension-yojana',
      },
    };
  }

  // 5. Street Vendors / PM SVANidhi
  if (
    query.includes('வியாபாரி') ||
    query.includes('தெருவோர') ||
    query.includes('vendor') ||
    query.includes('svanidhi') ||
    query.includes('street vendor') ||
    query.includes('रेहड़ी') ||
    query.includes('पटरी') ||
    query.includes('फेरीवाले') ||
    query.includes('वेंडर') ||
    query.includes('स्वनिधि')
  ) {
    const svanidhi = schemes.find((s) => s.id === 'pm-svanidhi');
    if (language === 'ta') {
      return {
        text: 'தெருவோர வியாபாரிகளுக்கு "பிஎம் ஸ்வநிதி (PM SVANidhi)" திட்டம் உள்ளது. பிணையில்லா செயல்பாட்டு மூலதன கடனாக முதல் தவணையில் ₹10,000, சரியாக திருப்பி செலுத்தினால் இரண்டாம் தவணையில் ₹20,000, மூன்றாம் தவணையில் ₹50,000 கடன் வழங்கப்படுகிறது. மேலும் 7% வட்டி மானியமும் டிஜிட்டல் பரிவர்த்தனைகளுக்கு கேஷ்பேக் சலுகையும் உண்டு. தேவையான ஆவணங்கள்: ஆதார் அட்டை, நகராட்சி விற்பனை சான்றிதழ் (CoV) அல்லது பரிந்துரை கடிதம் (LoR), வங்கி கணக்கு புத்தகம்.',
        matchedSchemes: svanidhi ? [svanidhi] : [],
        suggestedAction: {
          label: 'ஸ்வநிதி ஆவணங்களை சரிபார்க்கவும்',
          tab: 'document-mapper',
          schemeId: 'pm-svanidhi',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: 'शहरी रेहड़ी-पटरी वालों के लिए "पीएम स्वनिधि (PM SVANidhi)" योजना बिना किसी गारंटी के कार्यशील पूंजी ऋण प्रदान करती है। पहले चरण में ₹10,000, समय पर चुकाने पर दूसरे चरण में ₹20,000 और तीसरे चरण में ₹50,000 तक का ऋण मिलता है। साथ ही 7% वार्षिक ब्याज सब्सिडी और डिजिटल लेनदेन पर ₹1,200 तक कैशबैक मिलता है। आवश्यक दस्तावेज: आधार कार्ड, स्थानीय निकाय द्वारा जारी वेंडिंग प्रमाण पत्र (CoV) या सिफारिश पत्र (LoR), और बैंक पासबुक।',
        matchedSchemes: svanidhi ? [svanidhi] : [],
        suggestedAction: {
          label: 'स्वनिधि दस्तावेज मैपर देखें',
          tab: 'document-mapper',
          schemeId: 'pm-svanidhi',
        },
      };
    }
    return {
      text: 'For urban street vendors, the "PM SVANidhi" scheme offers collateral-free working capital loans starting with ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and ₹50,000 (3rd tranche) upon timely repayment, along with 7% interest subsidy and digital cashback. Required documents: Aadhaar Card, Certificate of Vending (CoV) / Letter of Recommendation from Urban Local Body, and Bank Account Passbook.',
      matchedSchemes: svanidhi ? [svanidhi] : [],
      suggestedAction: {
        label: 'Map SVANidhi Documents',
        tab: 'document-mapper',
        schemeId: 'pm-svanidhi',
      },
    };
  }

  // 6. Artisans / PM Vishwakarma
  if (
    query.includes('கைவினைஞர்') ||
    query.includes('விஸ்வகர்மா') ||
    query.includes('artisan') ||
    query.includes('craft') ||
    query.includes('vishwakarma') ||
    query.includes('தச்சர்') ||
    query.includes('தையல்') ||
    query.includes('विश्वकर्मा') ||
    query.includes('कारीगर') ||
    query.includes('शिल्पकार') ||
    query.includes('दर्जी') ||
    query.includes('बढ़ई') ||
    query.includes('लोहार')
  ) {
    const vishwa = schemes.find((s) => s.id === 'pm-vishwakarma');
    if (language === 'ta') {
      return {
        text: '"பிஎம் விஸ்வகர்மா திட்டம்" 18 பாரம்பரிய கைவினைஞர்கள் மற்றும் தொழிலாளர்களுக்கு (தச்சர், கொல்லர், பொற்கொல்லர், தையல்காரர், கொத்தனார், குயவர் போன்றவர்கள்) திறன் பயிற்சி, ₹15,000 மதிப்புள்ள இலவச நவீன கருவித்தொகுதி மானியம் மற்றும் 5% சலுகை வட்டியில் ₹3 லட்சம் வரை பிணையில்லா தொழில் கடன் வழங்குகிறது. தேவையான ஆவணங்கள்: ஆதார் அட்டை, கைவினைஞர் சுய அறிவிப்பு, வங்கி கணக்கு புத்தகம்.',
        matchedSchemes: vishwa ? [vishwa] : [],
        suggestedAction: {
          label: 'விஸ்வகர்மா தகுதி பார்க்கவும்',
          tab: 'eligibility',
          schemeId: 'pm-vishwakarma',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: '"पीएम विश्वकर्मा योजना" 18 पारंपरिक शिल्पों एवं व्यवसायों (बढ़ई, लोहार, सुनार, कुम्हार, दर्जी, राजमिस्त्री आदि) के कारीगरों को विश्वकर्मा प्रमाण पत्र, निःशुल्क आधुनिक कौशल प्रशिक्षण, ₹15,000 का टूलकिट ई-वाउचर अनुदान, और 5% रियायती ब्याज दर पर ₹3 लाख तक का संपार्श्विक-मुक्त ऋण देती है। आवश्यक दस्तावेज: आधार कार्ड, पारंपरिक व्यवसाय स्व-घोषणा, और बैंक पासबुक।',
        matchedSchemes: vishwa ? [vishwa] : [],
        suggestedAction: {
          label: 'विश्वकर्मा पात्रता जांचें',
          tab: 'eligibility',
          schemeId: 'pm-vishwakarma',
        },
      };
    }
    return {
      text: 'The "PM Vishwakarma" scheme supports 18 traditional artisan trades (carpenters, blacksmiths, tailors, masons, potters, etc.) with skill certification, ₹15,000 modern toolkit incentive, and collateral-free enterprise credit up to ₹3 Lakh at 5% concessional interest. Required documents: Aadhaar Card, Bank Passbook, and Traditional Trade Self-Declaration.',
      matchedSchemes: vishwa ? [vishwa] : [],
      suggestedAction: {
        label: 'Check Vishwakarma Eligibility',
        tab: 'eligibility',
        schemeId: 'pm-vishwakarma',
      },
    };
  }

  // 7. Micro Business / MUDRA Loan
  if (
    query.includes('முத்ரா') ||
    query.includes('கடன்') ||
    query.includes('தொழில் கடன்') ||
    query.includes('loan') ||
    query.includes('mudra') ||
    query.includes('business') ||
    query.includes('मुद्रा') ||
    query.includes('ऋण') ||
    query.includes('लोन') ||
    query.includes('कारोबार') ||
    query.includes('उद्योग')
  ) {
    const mudra = schemes.find((s) => s.id === 'pm-mudra-yojana');
    if (language === 'ta') {
      return {
        text: '"பிரதான் மந்திரி முத்ரா யோஜனா (PMMY)" சிறு தொழில் மற்றும் வர்த்தகம் தொடங்குவதற்கு ₹10 லட்சம் வரை (மற்றும் ₹20 லட்சம் வரை விரிவுபடுத்தப்பட்ட) பிணையில்லா வணிக கடன் வழங்குகிறது. 3 பிரிவுகள் உள்ளன: சிசு (₹50,000 வரை), கிஷோர் (₹50,000 முதல் ₹5 லட்சம் வரை), தருண் (₹5 லட்சம் முதல் ₹10 லட்சம் வரை). தேவையான ஆவணங்கள்: ஆதார் அட்டை, பான் கார்டு, வணிக முகவரி சான்று, வங்கி அறிக்கை.',
        matchedSchemes: mudra ? [mudra] : [],
        suggestedAction: {
          label: 'முத்ரா திட்ட விவரங்களை பார்க்கவும்',
          tab: 'discover',
        },
      };
    }
    if (language === 'hi') {
      return {
        text: '"प्रधानमंत्री मुद्रा योजना (PMMY)" गैर-कॉर्पोरेट छोटे कारोबारियों, विनिर्माण एवं सेवा क्षेत्र के उद्यमियों को बिना किसी गारंटी के ₹10 लाख से ₹20 लाख तक का व्यवसाय ऋण प्रदान करती है। तीन श्रेणियां हैं: शिशु (₹50,000 तक), किशोर (₹50,000 से ₹5 लाख), और तरुण (₹5 लाख से ₹10 लाख)। आवश्यक दस्तावेज: पहचान प्रमाण (आधार/पैन कार्ड), निवास प्रमाण, व्यवसाय पता प्रमाण और पिछले 6 माह का बैंक विवरण।',
        matchedSchemes: mudra ? [mudra] : [],
        suggestedAction: {
          label: 'मुद्रा योजना विवरण देखें',
          tab: 'discover',
        },
      };
    }
    return {
      text: 'Under Pradhan Mantri Mudra Yojana (PMMY), non-corporate small businesses and micro-enterprises can access collateral-free institutional loans up to ₹10 Lakh across three categories: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 Lakh), and Tarun (₹5 Lakh to ₹10 Lakh). Required documents: Identity Proof (Aadhaar/PAN), Proof of Residence, Business Address Proof, and Bank Statements.',
      matchedSchemes: mudra ? [mudra] : [],
      suggestedAction: {
        label: 'View MUDRA Scheme Details',
        tab: 'discover',
      },
    };
  }

  // General fallback
  if (language === 'ta') {
    return {
      text: `உங்கள் கேள்வி தொடர்பாக சரிபார்க்கப்பட்ட அரசு தரவுத்தளத்தில் ${schemes.length} அதிகாரப்பூர்வ திட்டங்கள் உள்ளன. விவசாயம், மருத்துவம், வீட்டு வசதி, ஓய்வூதியம், அல்லது சிறு தொழில் கடன் ஆகியவற்றில் உங்களுக்கு என்ன உதவி தேவை என்பதை குறிப்பிடவும். அல்லது "திட்டங்களை தேடு" பக்கத்தில் முழு பட்டியலை காணலாம்.`,
      matchedSchemes: schemes.slice(0, 3),
      suggestedAction: {
        label: 'அனைத்து திட்டங்களையும் காண்க',
        tab: 'discover',
      },
    };
  }
  if (language === 'hi') {
    return {
      text: `आपके प्रश्न के संदर्भ में सत्यापित सरकारी कैटलॉग में ${schemes.length} आधिकारिक योजनाएं उपलब्ध हैं। आप किसान सहायता, मुफ्त अस्पताल इलाज (आयुष्मान), पक्का आवास, वरिष्ठ पेंशन, या सूक्ष्म व्यवसाय/मुद्रा ऋण के बारे में विशेष रूप से पूछ सकते हैं। आप "योजनाएं खोजें" पृष्ठ पर पूरा कैटलॉग भी देख सकते हैं।`,
      matchedSchemes: schemes.slice(0, 3),
      suggestedAction: {
        label: 'सभी योजनाएं देखें',
        tab: 'discover',
      },
    };
  }
  return {
    text: `Based on your query, SevAIQ verified ${schemes.length} official government schemes in the catalog. You can ask specifically about farming assistance, free hospital treatment, housing grants, senior pensions, or micro-business loans. You can also explore the full catalog directly.`,
    matchedSchemes: schemes.slice(0, 3),
    suggestedAction: {
      label: 'Explore All Schemes',
      tab: 'discover',
    },
  };
}

/**
 * Normalizes and prepares text for browser Speech Synthesis (TTS).
 * Specifically converts English acronyms, currency symbols (₹), percentages,
 * and URLs into authentic, fluent Tamil phonetic words so Tamil speech engines
 * (e.g. Vani, Google தமிழ், Latha) read out the text clearly without stumbling.
 */
export function prepareSpeechText(text: string, language: AssistantLanguage): string {
  if (!text) return '';

  if (language === 'ta') {
    let clean = text;

    // 1. Remove parenthesized English translations e.g. (Check Eligibility), (PM-KISAN), (RoR), (NFSA Card)
    clean = clean.replace(/\([A-Za-z0-9\s\/\-_.,]+\)/g, '');

    // 2. Pronounce platform & common terms in Tamil phonetics
    clean = clean.replace(/\bSevAIQ\b/gi, 'சேவை ஐ க்யூ');
    clean = clean.replace(/\be-KYC\b/gi, 'இ-கேஒய்சி');
    clean = clean.replace(/\bWeb Speech API\b/gi, 'வெப் ஸ்பீச் ஏபிஐ');
    clean = clean.replace(/\bAadhaar\b/gi, 'ஆதார்');
    clean = clean.replace(/\bRation Card\b/gi, 'ரேஷன் அட்டை');
    clean = clean.replace(/\bBank Passbook\b/gi, 'வங்கி கணக்கு புத்தகம்');
    clean = clean.replace(/\bVoter ID\b/gi, 'வாக்காளர் அடையாள அட்டை');

    // 3. Expand common acronyms to natural Tamil phonetic pronunciations
    clean = clean.replace(/\bPM-KISAN\b/gi, 'பி எம் கிசான்');
    clean = clean.replace(/\bAB-PMJAY\b/gi, 'ஆயுஷ்மான் பாரத் திட்டம்');
    clean = clean.replace(/\bPM-JAY\b/gi, 'ஜன் ஆரோக்கிய திட்டம்');
    clean = clean.replace(/\bPMAY-G\b/gi, 'பிரதம மந்திரி ஆவாஸ் யோஜனா கிராமப்புற திட்டம்');
    clean = clean.replace(/\bPMAY-U\b/gi, 'பிரதம மந்திரி ஆவாஸ் யோஜனா நகர்ப்புற திட்டம்');
    clean = clean.replace(/\bPMAY\b/gi, 'ஆவாஸ் யோஜனா');
    clean = clean.replace(/\bAPY\b/gi, 'அடல் பென்ஷன் யோஜனா');
    clean = clean.replace(/\bPM SVANidhi\b/gi, 'பி எம் ஸ்வநிதி திட்டம்');
    clean = clean.replace(/\bPMMY\b/gi, 'முத்ரா திட்டம்');
    clean = clean.replace(/\bCSC\b/gi, 'பொது சேவை மையம்');
    clean = clean.replace(/\bDBT\b/gi, 'நேரடி வங்கி பரிமாற்றம்');
    clean = clean.replace(/\bNFSA\b/gi, 'ரேஷன் அட்டை');
    clean = clean.replace(/\bRoR\b/gi, 'பட்டா சிட்டா');
    clean = clean.replace(/\bCoV\b/gi, 'விற்பனை சான்றிதழ்');
    clean = clean.replace(/\bLoR\b/gi, 'பரிந்துரை கடிதம்');
    clean = clean.replace(/\bPAN\b/gi, 'பான் அட்டை');

    // 4. URLs to spoken Tamil
    clean = clean.replace(/pmkisan\.gov\.in/gi, 'பி எம் கிசான் இணையதளம்');
    clean = clean.replace(/beneficiary\.nha\.gov\.in/gi, 'ஆயுஷ்மான் பாரத் இணையதளம்');
    clean = clean.replace(/pmsvanidhi\.mohua\.gov\.in/gi, 'பி எம் ஸ்வநிதி இணையதளம்');
    clean = clean.replace(/npscra\.nsdl\.co\.in/gi, 'அடல் பென்ஷன் இணையதளம்');
    clean = clean.replace(/pmjay\.gov\.in/gi, 'ஜன் ஆரோக்கிய இணையதளம்');

    // 5. Currency amounts to fluent spoken Tamil numbers
    clean = clean.replace(/₹\s*([0-9,.]+)\s*(லட்சம்|கோடி)?/g, (_match, num, unit) => {
      const cleanNum = num.replace(/,/g, '');
      if (cleanNum === '500000') return 'ஐந்து லட்சம் ரூபாய்';
      if (cleanNum === '6000') return 'ஆறாயிரம் ரூபாய்';
      if (cleanNum === '2000') return 'இரண்டாயிரம் ரூபாய்';
      if (cleanNum === '1000') return 'ஆயிரம் ரூபாய்';
      if (cleanNum === '5000') return 'ஐந்தாயிரம் ரூபாய்';
      if (cleanNum === '120000') return 'ஒரு லட்சத்து இருபதாயிரம் ரூபாய்';
      if (cleanNum === '130000') return 'ஒரு லட்சத்து முப்பதாயிரம் ரூபாய்';
      if (cleanNum === '10000') return 'பத்தாயிரம் ரூபாய்';
      if (cleanNum === '20000') return 'இருபதாயிரம் ரூபாய்';
      if (cleanNum === '50000') return 'ஐம்பதாயிரம் ரூபாய்';
      if (cleanNum === '2.5' && unit === 'லட்சம்') return 'இரண்டரை லட்சம் ரூபாய்';
      if (cleanNum === '3' && unit === 'லட்சம்') return 'மூன்று லட்சம் ரூபாய்';
      if (cleanNum === '10' && unit === 'லட்சம்') return 'பத்து லட்சம் ரூபாய்';
      if (cleanNum === '20' && unit === 'லட்சம்') return 'இருபது லட்சம் ரூபாய்';
      return unit ? `${cleanNum} ${unit} ரூபாய்` : `${cleanNum} ரூபாய்`;
    });
    clean = clean.replace(/₹/g, ' ரூபாய் ');

    // 6. Percentages e.g. 7% -> 7 சதவீதம்
    clean = clean.replace(/([0-9]+)\s*%/g, '$1 சதவீதம்');

    // 7. Age patterns e.g. 70+ -> 70 வயதுக்கு மேற்பட்ட
    clean = clean.replace(/([0-9]+)\s*\+/g, '$1 வயதுக்கு மேற்பட்ட');

    // 8. Strip markdown characters, quotes, and brackets
    clean = clean.replace(/[*_#`~"“”'’[\]]/g, '');

    // 9. Normalize spacing
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  }

  if (language === 'hi') {
    let clean = text;

    // 1. Remove parenthesized English translations e.g. (Check Eligibility), (PM-KISAN), (RoR), (NFSA Card)
    clean = clean.replace(/\([A-Za-z0-9\s\/\-_.,]+\)/g, '');

    // 2. Pronounce platform & common terms in Hindi phonetics
    clean = clean.replace(/\bSevAIQ\b/gi, 'सेवा आई क्यू');
    clean = clean.replace(/\be-KYC\b/gi, 'ई-केवाईसी');
    clean = clean.replace(/\bWeb Speech API\b/gi, 'वेब स्पीच एपीआई');
    clean = clean.replace(/\bAadhaar\b/gi, 'आधार');
    clean = clean.replace(/\bRation Card\b/gi, 'राशन कार्ड');
    clean = clean.replace(/\bBank Passbook\b/gi, 'बैंक पासबुक');

    // 3. Expand common acronyms to natural Hindi phonetic pronunciations
    clean = clean.replace(/\bPM-KISAN\b/gi, 'पीएम किसान');
    clean = clean.replace(/\bAB-PMJAY\b/gi, 'आयुष्मान भारत योजना');
    clean = clean.replace(/\bPM-JAY\b/gi, 'जन आरोग्य योजना');
    clean = clean.replace(/\bPMAY-G\b/gi, 'प्रधानमंत्री आवास योजना ग्रामीण');
    clean = clean.replace(/\bPMAY-U\b/gi, 'प्रधानमंत्री आवास योजना शहरी');
    clean = clean.replace(/\bPMAY\b/gi, 'आवास योजना');
    clean = clean.replace(/\bAPY\b/gi, 'अटल पेंशन योजना');
    clean = clean.replace(/\bPM SVANidhi\b/gi, 'पीएम स्वनिधि योजना');
    clean = clean.replace(/\bPMMY\b/gi, 'मुद्रा योजना');
    clean = clean.replace(/\bCSC\b/gi, 'जन सेवा केंद्र');
    clean = clean.replace(/\bDBT\b/gi, 'प्रत्यक्ष लाभ अंतरण');
    clean = clean.replace(/\bNFSA\b/gi, 'राशन कार्ड');
    clean = clean.replace(/\bRoR\b/gi, 'भूलेख खतौनी');
    clean = clean.replace(/\bCoV\b/gi, 'वेंडिंग प्रमाण पत्र');
    clean = clean.replace(/\bLoR\b/gi, 'सिफारिश पत्र');
    clean = clean.replace(/\bPAN\b/gi, 'पैन कार्ड');

    // 4. URLs to spoken Hindi
    clean = clean.replace(/pmkisan\.gov\.in/gi, 'पीएम किसान पोर्टल');
    clean = clean.replace(/beneficiary\.nha\.gov\.in/gi, 'आयुष्मान भारत पोर्टल');
    clean = clean.replace(/pmsvanidhi\.mohua\.gov\.in/gi, 'पीएम स्वनिधि पोर्टल');
    clean = clean.replace(/npscra\.nsdl\.co\.in/gi, 'अटल पेंशन पोर्टल');
    clean = clean.replace(/pmjay\.gov\.in/gi, 'जन आरोग्य पोर्टल');

    // 5. Currency amounts to fluent spoken Hindi numbers
    clean = clean.replace(/₹\s*([0-9,.]+)\s*(लाख|करोड़)?/g, (_match, num, unit) => {
      const cleanNum = num.replace(/,/g, '');
      if (cleanNum === '500000') return 'पांच लाख रुपये';
      if (cleanNum === '6000') return 'छह हजार रुपये';
      if (cleanNum === '2000') return 'दो हजार रुपये';
      if (cleanNum === '1000') return 'एक हजार रुपये';
      if (cleanNum === '5000') return 'पांच हजार रुपये';
      if (cleanNum === '120000') return 'एक लाख बीस हजार रुपये';
      if (cleanNum === '130000') return 'एक लाख तीस हजार रुपये';
      if (cleanNum === '10000') return 'दस हजार रुपये';
      if (cleanNum === '20000') return 'बीस हजार रुपये';
      if (cleanNum === '50000') return 'पचास हजार रुपये';
      if (cleanNum === '2.5' && unit === 'लाख') return 'ढाई लाख रुपये';
      if (cleanNum === '3' && unit === 'लाख') return 'तीन लाख रुपये';
      if (cleanNum === '10' && unit === 'लाख') return 'दस लाख रुपये';
      if (cleanNum === '20' && unit === 'लाख') return 'बीस लाख रुपये';
      return unit ? `${cleanNum} ${unit} रुपये` : `${cleanNum} रुपये`;
    });
    clean = clean.replace(/₹/g, ' रुपये ');

    // 6. Percentages e.g. 7% -> 7 प्रतिशत
    clean = clean.replace(/([0-9]+)\s*%/g, '$1 प्रतिशत');

    // 7. Age patterns e.g. 70+ -> 70 वर्ष से अधिक उम्र
    clean = clean.replace(/([0-9]+)\s*\+/g, '$1 वर्ष से अधिक');

    // 8. Strip markdown characters, quotes, and brackets
    clean = clean.replace(/[*_#`~"“”'’[\]]/g, '');

    // 9. Normalize spacing
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  }

  // English cleanup
  let cleanEn = text;
  cleanEn = cleanEn.replace(/₹\s*([0-9,.]+)\s*(Lakh|Crore)?/gi, (_match, num, unit) => {
    return unit ? `${num} ${unit} Rupees` : `${num} Rupees`;
  });
  cleanEn = cleanEn.replace(/₹/g, ' Rupees ');
  cleanEn = cleanEn.replace(/([0-9]+)%/g, '$1 percent');
  cleanEn = cleanEn.replace(/[*_#`~"[\]]/g, '');
  cleanEn = cleanEn.replace(/\s+/g, ' ').trim();
  return cleanEn;
}

export interface VoiceCandidate {
  name: string;
  lang: string;
  default?: boolean;
}

/**
 * Discovers and selects the optimal native speech synthesis voice for the chosen language.
 * Prefers natural high-fidelity voices (Google தமிழ், macOS Vani, Windows Latha) for Tamil,
 * and Indian English voices for English.
 */
export function getBestVoice<T extends VoiceCandidate>(
  voices: T[],
  language: AssistantLanguage
): T | null {
  if (!voices || voices.length === 0) return null;

  if (language === 'ta') {
    // 1. Preferred high-quality native Tamil voices
    const preferredTamil = voices.find(
      (v) =>
        (v.lang.toLowerCase() === 'ta-in' ||
          v.lang.toLowerCase() === 'ta_in' ||
          v.lang.toLowerCase().startsWith('ta')) &&
        (v.name.includes('Google') ||
          v.name.includes('Vani') ||
          v.name.includes('Latha') ||
          v.name.includes('Valluvar') ||
          v.name.includes('Tamil') ||
          v.name.includes('தமிழ்'))
    );
    if (preferredTamil) return preferredTamil;

    // 2. Exact match on language tag ta-IN or ta_IN
    const exactTamil = voices.find(
      (v) => v.lang.toLowerCase() === 'ta-in' || v.lang.toLowerCase() === 'ta_in'
    );
    if (exactTamil) return exactTamil;

    // 3. Any voice starting with ta
    const anyTamil = voices.find((v) => v.lang.toLowerCase().startsWith('ta'));
    if (anyTamil) return anyTamil;

    // 4. Any voice with 'tamil' in its name
    const namedTamil = voices.find((v) => v.name.toLowerCase().includes('tamil'));
    if (namedTamil) return namedTamil;

    return null;
  }

  if (language === 'hi') {
    // 1. Preferred high-quality native Hindi voices
    const preferredHindi = voices.find(
      (v) =>
        (v.lang.toLowerCase() === 'hi-in' ||
          v.lang.toLowerCase() === 'hi_in' ||
          v.lang.toLowerCase().startsWith('hi')) &&
        (v.name.includes('Google') ||
          v.name.includes('Kalpana') ||
          v.name.includes('Lekha') ||
          v.name.includes('Hemant') ||
          v.name.includes('Neerja') ||
          v.name.includes('Hindi') ||
          v.name.includes('हिन्दी'))
    );
    if (preferredHindi) return preferredHindi;

    // 2. Exact match on language tag hi-IN or hi_IN
    const exactHindi = voices.find(
      (v) => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase() === 'hi_in'
    );
    if (exactHindi) return exactHindi;

    // 3. Any voice starting with hi
    const anyHindi = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
    if (anyHindi) return anyHindi;

    // 4. Any voice with 'hindi' in its name
    const namedHindi = voices.find((v) => v.name.toLowerCase().includes('hindi'));
    if (namedHindi) return namedHindi;

    return null;
  }

  // English: Indian English preferred for authentic local terminology pronunciation
  const indianEnglish = voices.find(
    (v) =>
      (v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in') &&
      (v.name.includes('Google') ||
        v.name.includes('Rishi') ||
        v.name.includes('Veena') ||
        v.name.includes('Heera'))
  );
  if (indianEnglish) return indianEnglish;

  const anyIndianEnglish = voices.find(
    (v) => v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in'
  );
  if (anyIndianEnglish) return anyIndianEnglish;

  // Fallback: Default or any English voice
  const defaultEnglish = voices.find(
    (v) => v.default && v.lang.toLowerCase().startsWith('en')
  );
  if (defaultEnglish) return defaultEnglish;

  const anyEnglish = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  return anyEnglish || voices[0] || null;
}
