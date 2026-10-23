/**
 * Comprehensive bilingual (English & Tamil) translations for SevAIQ.
 * Covers all screens, components, modals, filters, options, schemes, and documents.
 */

export type AppLanguage = 'en' | 'ta' | 'hi';

export interface SchemeTranslation {
  title: string;
  short_description: string;
  category: string;
  ministry: string;
  beneficiary_type?: string;
  benefits_summary?: string;
  detailed_benefits?: string;
}

export interface DocumentTranslation {
  name: string;
  description: string;
  issuingAuthority: string;
}

export const SCHEME_TRANSLATIONS: Record<'ta' | 'hi', Record<string, SchemeTranslation>> = {
  ta: {
    'pm-kisan': {
      title: 'பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)',
      short_description:
        'சொந்த நிலம் உள்ள விவசாய குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 நிதி உதவி, மூன்று தவணைகளில் தலா ₹2,000 வீதம் நேரடியாக வங்கி கணக்கில் வழங்கப்படுகிறது.',
      category: 'வேளாண்மை & கிராமப்புறம்',
      ministry: 'வேளாண்மை மற்றும் உழவர் நல அமைச்சகம்',
      beneficiary_type: 'சிறு மற்றும் குறு நிலம் வைத்துள்ள விவசாய குடும்பங்கள்',
      benefits_summary: 'நேரடி பயன் பரிமாற்றம் (DBT) மூலம் ஆண்டுக்கு ₹6,000',
      detailed_benefits:
        'நான்கு மாதங்களுக்கு ஒருமுறை ₹2,000 வீதம் ஆண்டுக்கு ₹6,000 மூன்று தவணைகளில் ஆதார் இணைக்கப்பட்ட வங்கி கணக்கில் செலுத்தப்படுகிறது.',
    },
    'ab-pmjay': {
      title: 'ஆயுஷ்மான் பாரத் - பிரதம மந்திரி ஜன் ஆரோக்கிய திட்டம் (AB-PMJAY)',
      short_description:
        'தகுதியான ஏழைக் குடும்பங்களுக்கு இரண்டாம் நிலை மற்றும் மூன்றாம் நிலை மருத்துவ சிகிச்சைகளுக்காக ஆண்டுக்கு குடும்பத்திற்கு ₹5 லட்சம் வரை இலவச ரொக்கமில்லா மருத்துவக் காப்பீடு வழங்கும் திட்டம்.',
      category: 'சுகாதாரம் & நல்வாழ்வு',
      ministry: 'சுகாதாரம் மற்றும் குடும்ப நல அமைச்சகம் / தேசிய சுகாதார ஆணையம் (NHA)',
      beneficiary_type: 'அடித்தட்டு 40% பின்தங்கிய ஏழைக் குடும்பங்கள் & 70+ வயது மூத்த குடிமக்கள்',
      benefits_summary: 'ஆண்டுக்கு குடும்பத்திற்கு ₹5,00,000 வரை ரொக்கமில்லா மருத்துவ சிகிச்சை',
      detailed_benefits:
        'அங்கீகரிக்கப்பட்ட அரசு மற்றும் தனியார் மருத்துவமனைகளில் 1,900+ சிகிச்சைகளுக்கு ₹5 லட்சம் வரை இலவச மருத்துவ சிகிச்சை.',
    },
    'pm-jay': {
      title: 'ஆயுஷ்மான் பாரத் - பிரதம மந்திரி ஜன் ஆரோக்கிய திட்டம் (PM-JAY)',
      short_description:
        'தகுதியான ஏழைக் குடும்பங்களுக்கு இரண்டாம் நிலை மற்றும் மூன்றாம் நிலை மருத்துவ சிகிச்சைகளுக்காக ஆண்டுக்கு குடும்பத்திற்கு ₹5 லட்சம் வரை இலவச ரொக்கமில்லா மருத்துவக் காப்பீடு வழங்கும் திட்டம்.',
      category: 'சுகாதாரம் & நல்வாழ்வு',
      ministry: 'சுகாதாரம் மற்றும் குடும்ப நல அமைச்சகம் / தேசிய சுகாதார ஆணையம் (NHA)',
      beneficiary_type: 'அடித்தட்டு 40% பின்தங்கிய ஏழைக் குடும்பங்கள் & 70+ வயது மூத்த குடிமக்கள்',
      benefits_summary: 'ஆண்டுக்கு குடும்பத்திற்கு ₹5,00,000 வரை ரொக்கமில்லா மருத்துவ சிகிச்சை',
      detailed_benefits:
        'அங்கீகரிக்கப்பட்ட அரசு மற்றும் தனியார் மருத்துவமனைகளில் 1,900+ சிகிச்சைகளுக்கு ₹5 லட்சம் வரை இலவச மருத்துவ சிகிச்சை.',
    },
    'pm-svanidhi': {
      title: 'பிரதம மந்திரி தெருவோர வியாபாரிகள் ஆத்மநிர்பர் நிதி (PM SVANidhi)',
      short_description:
        'நகர்ப்புற தெருவோர வியாபாரிகளுக்கு பிணையில்லா செயல்பாட்டு மூலதனக் கடன் (₹10,000 முதல் ₹50,000 வரை) மற்றும் 7% வட்டி மானியம் வழங்கும் திட்டம்.',
      category: 'நிதி உள்ளடக்கம் & வாழ்வாதாரம்',
      ministry: 'வீட்டுவசதி மற்றும் நகர்ப்புற விவகாரங்கள் அமைச்சகம்',
      beneficiary_type: 'நகர்ப்புற தெருவோர வியாபாரிகள் மற்றும் தள்ளுவண்டி விற்பனையாளர்கள்',
      benefits_summary: '₹10,000 முதல் ₹50,000 வரை குறைந்த வட்டி கடன் & டிஜிட்டல் கேஷ்பேக்',
      detailed_benefits:
        'முதல் கட்டமாக ₹10,000, குறித்த தவணையில் திருப்பிச் செலுத்தினால் ₹20,000 மற்றும் ₹50,000 வரை கடனுதவி, 7% வட்டி மானியம் மற்றும் ஆண்டுக்கு ₹1,200 வரை கேஷ்பேக்.',
    },
    'nsp-post-matric': {
      title: 'போஸ்ட் மெட்ரிக் கல்வி உதவித்தொகை திட்டம் (NSP)',
      short_description:
        'பத்தாம் வகுப்புக்கு மேல் பயிலும் SC / ST / OBC மற்றும் குறைந்த வருவாய் பிரிவு மாணவர்களுக்கு கல்லூரி மற்றும் உயர்கல்வி கட்டண நிதி உதவி.',
      category: 'கல்வி & மாணவர்கள்',
      ministry: 'சமூக நீதி மற்றும் அதிகாரமளித்தல் அமைச்சகம்',
      beneficiary_type: '11-ம் வகுப்பு முதல் உயர்கல்வி பயிலும் தகுதியுடைய மாணவர்கள்',
      benefits_summary: 'முழுக் கல்விக் கட்டணம் மற்றும் மாதாந்திர பராமரிப்பு உதவித்தொகை',
      detailed_benefits:
        'கட்டாய கல்விக் கட்டண திருப்பிச் செலுத்துதல் மற்றும் படிப்பைப் பொறுத்து மாதம் ₹550 முதல் ₹1,200 வரை பராமரிப்பு உதவித்தொகை.',
    },
    'pmay-g': {
      title: 'பிரதான் மந்திரி ஆவாஸ் திட்டம் - கிராமப்புறம் (PMAY-G)',
      short_description:
        'கிராமப்புறங்களில் வீடற்ற அல்லது குடிசை/பழுதடைந்த வீடுகளில் வசிக்கும் ஏழைக் குடும்பங்களுக்கு நிரந்தர கான்கிரீட் வீடு கட்ட ₹1.20 லட்சம் முதல் ₹1.30 லட்சம் வரை நிதி உதவி.',
      category: 'வீட்டுவசதி & உள்கட்டமைப்பு',
      ministry: 'ஊரக வளர்ச்சி அமைச்சகம்',
      beneficiary_type: 'கிராமப்புற வீடற்ற மற்றும் குடிசையில் வசிக்கும் ஏழைக் குடும்பங்கள்',
      benefits_summary: 'நிரந்தர வீடு கட்ட ₹1.20 லட்சம் முதல் ₹1.30 லட்சம் நேரடி மானியம் + 90 நாட்கள் MGNREGA ஊதியம்',
      detailed_benefits:
        'சமவெளி பகுதிகளில் ₹1.20 லட்சமும், மலைப்பகுதிகளில் ₹1.30 லட்சமும் நேரடி மானியம். கூடுதலாக கழிப்பறை கட்ட ₹12,000 மற்றும் மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டத்தின் கீழ் 90-95 நாட்கள் ஊதியம்.',
    },
    'pmay-u': {
      title: 'பிரதான் மந்திரி ஆவாஸ் திட்டம் - நகர்ப்புறம் (PMAY-U)',
      short_description:
        'நகர்ப்புற ஏழைகள் மற்றும் நடுத்தர வருவாய்ப் பிரிவினருக்கு சொந்த வீடு கட்ட அல்லது வாங்க கடன் இணைக்கப்பட்ட வட்டி மானியம் (CLSS) மற்றும் நிதி உதவி.',
      category: 'வீட்டுவசதி & உள்கட்டமைப்பு',
      ministry: 'வீட்டுவசதி மற்றும் நகர்ப்புற விவகாரங்கள் அமைச்சகம்',
      beneficiary_type: 'நகர்ப்புற பொருளாதாரத்தில் பின்தங்கிய (EWS) மற்றும் குறைந்த வருவாய் பிரிவினர் (LIG)',
      benefits_summary: 'சொந்த வீட்டுக் கடனுக்கு ₹2.67 லட்சம் வரை வட்டி மானியம்',
      detailed_benefits:
        'வீட்டுக் கடன்களுக்கு 6.5% வரை வட்டி மானியம் (அதிகபட்சம் ₹2.67 லட்சம் வரை முன்வட்டி மானியம்).',
    },
    'atal-pension-yojana': {
      title: 'அடல் பென்ஷன் திட்டம் (APY)',
      short_description:
        'அமைப்புசாரா தொழிலாளர்களுக்கு 60 வயதிற்குப் பிறகு வாழ்நாள் முழுவதும் மாதம் ₹1,000 முதல் ₹5,000 வரை உத்தரவாதமளிக்கப்பட்ட ஓய்வூதியம்.',
      category: 'சமூகப் பாதுகாப்பு & ஓய்வூதியம்',
      ministry: 'நிதி அமைச்சகம் / PFRDA',
      beneficiary_type: '18 முதல் 40 வயதுடைய இந்திய குடிமக்கள் (அமைப்புசாரா தொழிலாளர்கள்)',
      benefits_summary: '60 வயதிற்குப் பின் மாதம் ₹1,000 முதல் ₹5,000 வரை நிரந்தர ஓய்வூதியம்',
      detailed_benefits:
        'சேரும் வயதிற்கு ஏற்ப குறைந்த மாதாந்திர சந்தா. சந்தாதாரர் மற்றும் வாழ்க்கைத் துணைக்கு வாழ்நாள் முழுவதும் மாதாந்திர ஓய்வூதியம், பின் வாரிசுதாரருக்கு முழுத் தொகை.',
    },
    'pm-mudra-yojana': {
      title: 'பிரதம மந்திரி முத்ரா திட்டம் (PMMY)',
      short_description:
        'சிறு வணிகங்கள், கடைகள், உற்பத்தி மற்றும் சேவைத் துறை தொழில்முனைவோருக்கு ₹50,000 முதல் ₹20 லட்சம் வரை பிணையில்லா தொழில் கடன் (சிசு, கிஷோர், தருண்).',
      category: 'நிதி உள்ளடக்கம் & வாழ்வாதாரம்',
      ministry: 'நிதி அமைச்சகம் (நிதிச் சேவைகள் துறை)',
      beneficiary_type: 'குறு மற்றும் சிறு வணிகர்கள், கடைக்காரர்கள் மற்றும் தொழில்முனைவோர்',
      benefits_summary: 'பிணையில்லாமல் ₹50,000 முதல் ₹20 லட்சம் வரை தொழில் கடன்',
      detailed_benefits:
        'சிசு (₹50,000 வரை), கிஷோர் (₹50,000 முதல் ₹5 லட்சம் வரை), தருண் (₹5 லட்சம் முதல் ₹10 லட்சம் வரை), தருண் பிளஸ் (₹20 லட்சம் வரை) பிணையில்லா தொழில் கடன்.',
    },
    'pm-vishwakarma': {
      title: 'பிரதம மந்திரி விஸ்வகர்மா திட்டம்',
      short_description:
        'பாரம்பரிய கைவினைஞர்கள் மற்றும் தொழிலாளர்களுக்கு அடையாள அட்டை, ₹15,000 கருவி மானியம் மற்றும் 5% சலுகை வட்டி கடன்.',
      category: 'திறன் மேம்பாடு & வாழ்வாதாரம்',
      ministry: 'குறு, சிறு மற்றும் நடுத்தர தொழில்கள் அமைச்சகம் (MSME)',
      beneficiary_type: '18 வகை பாரம்பரிய கைவினைஞர்கள் மற்றும் தொழிலாளர்கள்',
      benefits_summary: 'விஸ்வகர்மா சான்றிதழ், ₹15,000 உபகரண மானியம் மற்றும் ₹3 லட்சம் வரை பிணையில்லா கடன்',
      detailed_benefits:
        'அடிப்படை மற்றும் மேம்பட்ட திறன் பயிற்சி, நாளொன்றுக்கு ₹500 உதவித்தொகை, ₹15,000 மதிப்புள்ள நவீன கருவித்தொகுப்பு மானியம் மற்றும் 5% சலுகை வட்டியில் ₹3 லட்சம் வரை பிணையில்லா கடன்.',
    },
  },
  hi: {
    'pm-kisan': {
      title: 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)',
      short_description:
        'पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता, हर चार माह में ₹2,000 की तीन समान किस्तों में सीधे बैंक खाते में दी जाती है।',
      category: 'कृषि एवं ग्रामीण विकास',
      ministry: 'कृषि एवं किसान कल्याण मंत्रालय',
      beneficiary_type: 'छोटे एवं सीमांत भूमिधारक किसान परिवार',
      benefits_summary: 'प्रत्यक्ष लाभ अंतरण (DBT) द्वारा ₹6,000 प्रति वर्ष',
      detailed_benefits:
        'चार माह के अंतराल पर ₹2,000 की तीन किस्तों में वार्षिक ₹6,000 आधार से जुड़े बैंक खाते में सीधे स्थानांतरित किए जाते हैं।',
    },
    'ab-pmjay': {
      title: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY)',
      short_description:
        'पात्र गरीब परिवारों को द्वितीयक एवं तृतीयक स्तर के अस्पताल में भर्ती एवं इलाज हेतु प्रति वर्ष प्रति परिवार ₹5 लाख तक का निःशुल्क कैशलेस स्वास्थ्य कवर।',
      category: 'स्वास्थ्य एवं परिवार कल्याण',
      ministry: 'स्वास्थ्य एवं परिवार कल्याण मंत्रालय / राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA)',
      beneficiary_type: 'सामाजिक-आर्थिक रूप से वंचित गरीब परिवार एवं 70 वर्ष से अधिक उम्र के वरिष्ठ नागरिक',
      benefits_summary: 'प्रति परिवार प्रति वर्ष ₹5,00,000 तक कैशलेस उपचार',
      detailed_benefits:
        'सूचीबद्ध सरकारी एवं निजी अस्पतालों में 1,900 से अधिक चिकित्सीय प्रक्रियाओं व गंभीर बीमारियों हेतु ₹5 लाख तक का कैशलेस एवं पेपरलेस उपचार।',
    },
    'pm-jay': {
      title: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (PM-JAY)',
      short_description:
        'पात्र गरीब परिवारों को द्वितीयक एवं तृतीयक स्तर के अस्पताल में भर्ती एवं इलाज हेतु प्रति वर्ष प्रति परिवार ₹5 लाख तक का निःशुल्क कैशलेस स्वास्थ्य कवर।',
      category: 'स्वास्थ्य एवं परिवार कल्याण',
      ministry: 'स्वास्थ्य एवं परिवार कल्याण मंत्रालय / राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA)',
      beneficiary_type: 'सामाजिक-आर्थिक रूप से वंचित गरीब परिवार एवं 70 वर्ष से अधिक उम्र के वरिष्ठ नागरिक',
      benefits_summary: 'प्रति परिवार प्रति वर्ष ₹5,00,000 तक कैशलेस उपचार',
      detailed_benefits:
        'सूचीबद्ध सरकारी एवं निजी अस्पतालों में 1,900 से अधिक चिकित्सीय प्रक्रियाओं व गंभीर बीमारियों हेतु ₹5 लाख तक का कैशलेस एवं पेपरलेस उपचार।',
    },
    'pm-svanidhi': {
      title: 'पीएम स्ट्रीट वेंडर्स आत्मनिर्भर निधि (PM SVANidhi)',
      short_description:
        'शहरी पथ विक्रेताओं (रेहड़ी-पटरी वालों) को बिना किसी जमानत के ₹10,000 से ₹50,000 तक कार्यशील पूंजी ऋण एवं 7% ब्याज सब्सिडी।',
      category: 'वित्तीय समावेशन एवं आजीविका',
      ministry: 'आवासन और शहरी कार्य मंत्रालय',
      beneficiary_type: 'शहरी रेहड़ी-पटरी वेंडर्स एवं फेरीवाले',
      benefits_summary: '₹10,000 से ₹50,000 तक आसान ऋण, 7% ब्याज सब्सिडी व डिजिटल कैशबैक',
      detailed_benefits:
        'प्रथम चरण में ₹10,000, समय पर अदायगी पर द्वितीय चरण में ₹20,000 एवं तृतीय चरण में ₹50,000 तक का कोलैटरल-फ्री ऋण, 7% ब्याज अनुदान तथा प्रति वर्ष ₹1,200 तक कैशबैक।',
    },
    'nsp-post-matric': {
      title: 'पोस्ट-मैट्रिक छात्रवृत्ति योजना (NSP)',
      short_description:
        'कक्षा 10वीं से आगे उच्च शिक्षा प्राप्त कर रहे अनुसूचित जाति (SC), जनजाति (ST), अन्य पिछड़ा वर्ग (OBC) एवं आर्थिक रूप से कमजोर छात्रों को वित्तीय सहायता।',
      category: 'शिक्षा एवं छात्र कल्याण',
      ministry: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय',
      beneficiary_type: '11वीं कक्षा से उच्च शिक्षा व व्यावसायिक पाठ्यक्रमों के पात्र छात्र',
      benefits_summary: 'पूर्ण शिक्षण शुल्क प्रतिपूर्ति एवं मासिक रख-रखाव भत्ता',
      detailed_benefits:
        'अनिवार्य गैर-वापसी योग्य शिक्षण शुल्क की प्रतिपूर्ति तथा पाठ्यक्रम के आधार पर ₹550 से ₹1,200 प्रतिमाह तक का रख-रखाव भत्ता।',
    },
    'pmay-g': {
      title: 'प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)',
      short_description:
        'ग्रामीण क्षेत्रों के बेघर या कच्चे/जीर्ण-शीर्ण घरों में रह रहे गरीब परिवारों को पक्का मकान बनाने हेतु ₹1.20 लाख से ₹1.30 लाख की सीधी वित्तीय सहायता।',
      category: 'आवास एवं अवसंरचना',
      ministry: 'ग्रामीण विकास मंत्रालय',
      beneficiary_type: 'ग्रामीण बेघर एवं कच्चे मकानों में रहने वाले पात्र परिवार',
      benefits_summary: 'पक्के मकान निर्माण हेतु ₹1.20 लाख से ₹1.30 लाख प्रत्यक्ष अनुदान + मनरेगा मजदूरी',
      detailed_benefits:
        'मैदानी क्षेत्रों में ₹1.20 लाख तथा पहाड़ी/कठिन क्षेत्रों में ₹1.30 लाख का प्रत्यक्ष अनुदान। शौचालय निर्माण हेतु अतिरिक्त ₹12,000 एवं मनरेगा के अंतर्गत 90-95 दिनों की अकुशल मजदूरी सहायता।',
    },
    'pmay-u': {
      title: 'प्रधानमंत्री आवास योजना - शहरी (PMAY-U)',
      short_description:
        'शहरी गरीबों, झुग्गीवासियों और निम्न आय वर्ग के परिवारों को पक्का मकान बनाने अथवा खरीदने हेतु ब्याज सब्सिडी (CLSS) एवं केंद्रीय वित्तीय सहायता।',
      category: 'आवास एवं अवसंरचना',
      ministry: 'आवासन और शहरी कार्य मंत्रालय',
      beneficiary_type: 'शहरी आर्थिक रूप से कमजोर वर्ग (EWS) एवं निम्न आय वर्ग (LIG)',
      benefits_summary: 'गृह ऋण पर ₹2.67 लाख तक की अग्रिम ब्याज सब्सिडी',
      detailed_benefits:
        'गृह ऋणों पर 6.5% तक ब्याज सब्सिडी (अधिकतम ₹2.67 लाख तक की अग्रिम ब्याज छूट) तथा किफायती आवास साझेदारी के तहत वित्तीय सहायता।',
    },
    'atal-pension-yojana': {
      title: 'अटल पेंशन योजना (APY)',
      short_description:
        'असंगठित क्षेत्र के श्रमिकों को 60 वर्ष की आयु के पश्चात जीवनभर ₹1,000 से ₹5,000 प्रतिमाह तक की गारंटीड पेंशन।',
      category: 'सामाजिक सुरक्षा एवं पेंशन',
      ministry: 'वित्त मंत्रालय / PFRDA',
      beneficiary_type: '18 से 40 वर्ष की आयु के भारतीय नागरिक (असंगठित क्षेत्र के कामगार)',
      benefits_summary: '60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 मासिक आजीवन पेंशन',
      detailed_benefits:
        'जुड़ने की उम्र के अनुसार अल्प मासिक अंशदान। अंशधारक और जीवनसाथी को आजीवन मासिक पेंशन की गारंटी, तत्पश्चात संपूर्ण संचित निधि नामित वारिस (नॉमिनी) को।',
    },
    'pm-mudra-yojana': {
      title: 'प्रधानमंत्री मुद्रा योजना (PMMY)',
      short_description:
        'छोटे व्यवसाय, दुकानदारों, विनिर्माण और सेवा क्षेत्र के उद्यमियों को बिना किसी गारंटी के ₹50,000 से ₹20 लाख तक का व्यवसाय ऋण (शिशु, किशोर, तरुण)।',
      category: 'वित्तीय समावेशन एवं आजीविका',
      ministry: 'वित्त मंत्रालय (वित्तीय सेवाएं विभाग)',
      beneficiary_type: 'सूक्ष्म, लघु व्यापारी, दुकानदार, निर्माता एवं उद्यमी',
      benefits_summary: 'बिना किसी बंधक/जमानत के ₹50,000 से ₹20 लाख तक संस्थागत ऋण',
      detailed_benefits:
        'शिशु (₹50,000 तक), किशोर (₹50,000 से ₹5 लाख तक), तरुण (₹5 लाख से ₹10 लाख तक), एवं तरुण प्लस (₹20 लाख तक) संपार्श्विक-मुक्त व्यावसायिक ऋण।',
    },
    'pm-vishwakarma': {
      title: 'प्रधानमंत्री विश्वकर्मा योजना',
      short_description:
        'पारंपरिक 18 शिल्पों एवं कारीगरों को पहचान पत्र, कौशल प्रशिक्षण, ₹15,000 टूलकिट अनुदान तथा 5% रियायती ब्याज पर ऋण सहायता।',
      category: 'कौशल विकास एवं आजीविका',
      ministry: 'सूक्ष्म, लघु एवं मध्यम उद्यम मंत्रालय (MSME)',
      beneficiary_type: '18 पारंपरिक व्यवसायों से जुड़े शिल्पकार व कारीगर (बढ़ई, लोहार, दर्जी, कुम्हार आदि)',
      benefits_summary: 'विश्वकर्मा प्रमाण पत्र, ₹15,000 आधुनिक औजार प्रोत्साहन व ₹3 लाख तक रियायती ऋण',
      detailed_benefits:
        'बुनियादी और उन्नत कौशल प्रशिक्षण, ₹500 प्रतिदिन का वजीफा, ₹15,000 का आधुनिक टूलकिट ई-वाउचर अनुदान, तथा 5% रियायती ब्याज दर पर ₹3 लाख तक का कोलैटरल-फ्री उद्यम ऋण।',
    },
  },
};

export const DOCUMENT_TRANSLATIONS: Record<'ta', Record<string, DocumentTranslation>> = {
  ta: {
    'aadhaar-card': {
      name: 'ஆதார் அட்டை',
      description: 'குடிமக்களின் தனிப்பட்ட அடையாளத்தை உறுதிப்படுத்தும் 12 இலக்க தேசிய பயோமெட்ரிக் அடையாள அட்டை.',
      issuingAuthority: 'இந்திய தனித்துவ அடையாள ஆணையம் (UIDAI)',
    },
    'bank-passbook': {
      name: 'வங்கி கணக்கு புத்தகம் / அறிக்கை',
      description: 'ஆதார் இணைக்கப்பட்ட கணக்கு புத்தகம் அல்லது IFSC குறியீடு கொண்ட கணக்கு அறிக்கை.',
      issuingAuthority: 'அங்கீகரிக்கப்பட்ட வணிக வங்கி / கிராமிய வங்கி / அஞ்சலகம்',
    },
    'mobile-number': {
      name: 'ஆதார் இணைக்கப்பட்ட மொபைல் எண்',
      description: 'OTP சரிபார்ப்பிற்காக ஆதாருடன் இணைக்கப்பட்ட செயலில் உள்ள மொபைல் எண்.',
      issuingAuthority: 'தொலைத்தொடர்பு நிறுவனம் / UIDAI',
    },
    'pan-card': {
      name: 'பான் அட்டை (PAN Card)',
      description: 'வருமான வரி மற்றும் நிதி மதிப்பீட்டிற்கான நிரந்தர கணக்கு எண் அட்டை.',
      issuingAuthority: 'வருமான வரித்துறை / NSDL / UTIITSL',
    },
    'income-certificate': {
      name: 'வருமானச் சான்றிதழ்',
      description: 'குடும்பத்தின் மொத்த ஆண்டு வருமானத்தை உறுதிப்படுத்தும் அதிகாரப்பூர்வ வருவாய்த்துறை சான்றிதழ்.',
      issuingAuthority: 'வருவாய்த்துறை / வட்டாட்சியர் (Tahsildar) / சார்-ஆட்சியர்',
    },
    'domicile-certificate': {
      name: 'இருப்பிடச் சான்றிதழ்',
      description: 'குறிப்பிட்ட மாநிலம் அல்லது யூனியன் பிரதேசத்தில் தொடர் வசிப்பிடத்தை உறுதிப்படுத்தும் சான்றிதழ்.',
      issuingAuthority: 'வட்டாட்சியர் / மாவட்ட ஆட்சியர் அலுவலகம் / வருவாய்த்துறை',
    },
    'ration-card': {
      name: 'குடும்ப அட்டை (Ration Card)',
      description: 'பொது விநியோகத் திட்ட குடும்ப அட்டை (NFSA / அந்தியோதயா / BPL / PHH).',
      issuingAuthority: 'உணவு மற்றும் நுகர்வோர் பாதுகாப்புத் துறை',
    },
    'caste-certificate': {
      name: 'சாதிச் சான்றிதழ் (SC / ST / OBC)',
      description: 'அரசு விதிகளின்படி அங்கீகரிக்கப்பட்ட சமூகப் பிரிவு சான்றிதழ்.',
      issuingAuthority: 'வருவாய்த்துறை / வட்டாட்சியர் / கோட்டாட்சியர்',
    },
    'land-records': {
      name: 'நில உரிமைப் பதிவேடுகள் (பட்டா / சிட்டா / RoR)',
      description: 'விண்ணப்பதாரர் பெயரில் உள்ள சாகுபடி செய்யக்கூடிய விவசாய நில உரிமை ஆவணம்.',
      issuingAuthority: 'நில அளவை மற்றும் வருவாய்த்துறை / கிராம நிர்வாக அலுவலர் (VAO)',
    },
    'education-marksheet': {
      name: 'முந்தைய ஆண்டு மதிப்பெண் பட்டியல் & கல்விச் சான்றிதழ்',
      description: 'கல்வித் தகுதி மற்றும் கல்லூரி சேர்க்கை உறுதிச் சான்றிதழ்.',
      issuingAuthority: 'அங்கீகரிக்கப்பட்ட கல்வி நிறுவனம் / கல்வி வாரியம்',
    },
    'vending-id': {
      name: 'தெருவோர வியாபாரி அடையாள அட்டை (CoV)',
      description: 'நகர்ப்புற தெருவோர வியாபாரிகளுக்கு நகராட்சி வழங்கும் விற்பனை சான்றிதழ்.',
      issuingAuthority: 'நகர்ப்புற உள்ளாட்சி அமைப்பு (ULB) / நகர விற்பனைக் குழு (TVC)',
    },
    'gram-panchayat-residence': {
      name: 'கிராம ஊராட்சி குடியிருப்பு சான்றிதழ்',
      description: 'குடிசை வீட்டில் வசிப்பதையும் கிராம வசிப்பிடத்தையும் உறுதிப்படுத்தும் உள்ளாட்சி சான்றிதழ்.',
      issuingAuthority: 'கிராம ஊராட்சி / ஊராட்சி மன்ற தலைவர் / வட்டார வளர்ச்சி அலுவலர் (BDO)',
    },
  },
};

export const UI_TRANSLATIONS = {
  en: {
    // Header
    header: {
      tagline: 'Civic Intelligence & Scheme Readiness',
      dashboard: 'Dashboard',
      schemes: 'Schemes',
      schemesMobile: 'Find Schemes',
      schemesDesc: 'Bilingual scheme discovery',
      eligibility: 'Eligibility',
      eligibilityMobile: 'Explainable Eligibility',
      eligibilityDesc: 'Statutory criteria checker',
      documents: 'Documents',
      documentsMobile: 'Document Synergy Mapper',
      documentsDesc: 'Cross-scheme certificate mapper',
      passport: 'Passport',
      passportMobile: 'Readiness Passport',
      passportDesc: 'Civic entitlement dossier',
      trust: 'Trust',
      trustMobile: 'Official Source Trust Monitor',
      trustDesc: 'Government source verification',
      guidance: 'Guidance',
      guidanceMobile: 'Application Guidance Tracker',
      guidanceDesc: 'Step-by-step submission checklist',
      kioskMode: 'Kiosk Mode:',
      active: 'Active',
      off: 'Off',
      kioskActiveTooltip: 'Public Kiosk Mode is Active: Session profile data exists in memory only',
      kioskOffTooltip: 'Toggle Public Kiosk Mode for shared devices',
      endSession: 'End Session',
      endSessionTooltip: 'Clear all demographic answers and document statuses from this device',
      languageSelect: 'Language',
      endSessionDialogTitle: 'End Citizen Session?',
      endSessionDialogDesc:
        'This will immediately purge all demographic inputs, eligibility evaluations, and document statuses from this terminal.',
      cancelKeepSession: 'Cancel (Keep Session)',
      confirmEndSession: 'Yes, End Session & Clear All',
      challengeBadge: 'Seva First Innovation Challenge 2026',
      civicDossier: 'Civic Dossier',
      volatileSession: 'Volatile in-memory session',
      standardSession: 'Standard local session',
    },

    // Hero
    hero: {
      badge: 'Seva First Innovation Challenge 2026',
      track: 'Civic Tech Track',
      titlePart1: 'Empowering Citizens with ',
      titleHighlight: 'Verifiable Government Schemes',
      description:
        'SevAIQ connects citizens directly to central and state welfare programs through verifiable, hallucination-free civic intelligence.',
      discoverSchemes: 'Discover Government Schemes',
      viewArchitecture: 'View Architecture & API Contract',
      guarantee1Title: 'Zero Hallucination',
      guarantee1Desc:
        'Schemes are added only after verification against official government portals.',
      guarantee2Title: 'Targeted Eligibility',
      guarantee2Desc:
        'Matches citizens to schemes tailored to their occupation, location, and demographic profile.',
      guarantee3Title: 'Decoupled Architecture',
      guarantee3Desc:
        'FastAPI backend + Vite React frontend, built collaboratively for national scale.',
    },

    // Dashboard
    dashboard: {
      kioskNoticeTitle: 'Public Kiosk Mode Active:',
      kioskNoticeDesc:
        'Profile answers and document statuses exist in volatile browser memory only. No data is stored on this computer.',
      welcomeBadge: 'Seva First Innovation Challenge 2026',
      welcomeTitle: 'Civic Intelligence & Scheme Readiness',
      welcomeDesc:
        'SevAIQ bridges the gap between citizens and welfare entitlements. Discover verified central and state government programs, assess multi-criteria eligibility transparently, and prepare your application documents without data privacy risk.',
      viewEligibilityResults: 'View Eligibility Results',
      checkEligibility: 'Check Your Eligibility',
      exploreCatalog: 'Explore Scheme Catalog',
      metricCataloged: 'Cataloged Schemes',
      metricVerified: 'Verified Sources',
      metricGazetteLinks: 'Official gazette & portal links',
      metricEligible: 'Eligible Matches',
      metricFullyMet: 'Fully Met',
      metricProfileNeeded: 'Profile needed',
      metricCriteriaMatched: 'Criteria matched against profile',
      metricDocsReady: 'Documents Ready',
      metricDocOverlap: 'Cross-scheme document overlap',
      metricPassport: 'Readiness Passport',
      metricActive: 'Active',
      metricDraft: 'Draft',
      metricExportReady: 'Export Ready',
      metricPrintableDossier: 'Printable civic dossier',
      workflowBadge: 'Structured Citizen Workflow',
      workflowTitle: 'How SevAIQ Empowers Your Application',
      workflowSubtitle:
        'Follow the 4-stage readiness pipeline designed to maximize scheme access and minimize rejected applications.',
      step1Title: 'Discover Schemes',
      step1Desc:
        'Browse verified central and state welfare initiatives with zero simulated data.',
      step1Action: 'Explore catalog',
      step2Title: 'Check Eligibility',
      step2Desc:
        'Fill an anonymous profile to evaluate criteria with Met, Not Met, and Unknown explanations.',
      step2Action: 'Assess profile',
      step3Title: 'Map Documents',
      step3Desc:
        'Discover shared documents across schemes, track missing certificates, and locate issuing offices.',
      step3Action: 'View mapper',
      step4Title: 'Readiness Passport',
      step4Desc:
        'Generate an exportable civic dossier with verified links, checklist, and Seva Kendra next steps.',
      step4Action: 'Generate passport',
      toolsBadge: 'Specialized Citizen Tools',
      toolsTitle: 'Voice Access, Government Source Audits & Submission Tracking',
      feat5Title: 'Tamil & English Voice Assistant',
      feat5Desc:
        'Ask scheme questions verbally or via text in everyday Tamil or English. Web Speech API with zero cloud audio leakage.',
      feat5Action: 'Launch Voice AI (Bottom-Right)',
      feat6Title: 'Official-Source Trust Monitor',
      feat6Desc:
        'Inspect government domain authenticity (.gov.in / .nic.in), real verification dates, and gazette citations for every scheme.',
      feat6Action: 'View Trust Audit',
      feat7Title: 'Application Guidance Tracker',
      feat7Desc:
        'Interactive step-by-step preparation checklist from document gathering to visiting CSC centers and official portals.',
      feat7Action: 'Track Application Guidance',
      privacyTitle: 'Privacy-First Architecture',
      privacyDesc:
        'SevAIQ strictly respects citizen privacy: we never collect Aadhaar numbers, bank account details, or contact identifiers. Eligibility evaluation is performed locally on anonymous demographic parameters.',
      zeroHallucinationTitle: 'Zero Hallucination Standard',
      zeroHallucinationDesc:
        'Every scheme displayed is referenced from official government gazettes and ministry portals (such as pmkisan.gov.in and pmjay.gov.in).',
    },

    // Scheme Discovery
    discover: {
      badge: 'Scheme Catalog',
      title: 'Find Government Schemes',
      subtitle:
        'Search verified central and state welfare initiatives backed by official gazette records.',
      syncBackend: 'Sync Backend',
      searchPlaceholder:
        'Search schemes by title, ministry, benefit, or Tamil keyword (e.g. விவசாயி, மருத்துவம், கடன்)...',
      allCategories: 'All Sectors',
      quickQueries: 'Quick Queries:',
      noSchemesFound: 'No schemes found matching your criteria',
      noSchemesDesc: 'Try adjusting your search query or selecting a different sector filter.',
      clearFilters: 'Clear Filters',
      verifiedOfficialSource: 'Verified Official Source',
      ministry: 'Ministry:',
      targetBeneficiary: 'Target Beneficiary:',
      benefits: 'Benefits:',
      requiredDocs: 'Required Documents:',
      checkEligibility: 'Check Eligibility',
      trackGuidance: 'Track Guidance',
      officialPortal: 'Official Portal',
      viewFullDetails: 'View Full Details & Application Steps',
      schemeOverview: 'Scheme Overview & Verification',
      nodalAgency: 'Nodal Agency',
      verifiedOn: 'Verified On',
      sourceCitation: 'Source Citation',
      detailedBenefits: 'Detailed Benefits & Entitlements',
      eligibilityCriteria: 'Statutory Eligibility Criteria',
      applicationSteps: 'Official Application Steps',
      close: 'Close',
      applicationMode: 'Mode:',
    },

    // Eligibility Screen
    eligibility: {
      badge: 'Civic Eligibility Engine',
      title: 'Explainable Scheme Eligibility',
      subtitle:
        'Enter basic demographic details to evaluate statutory criteria with transparent, rule-by-rule explanations.',
      profileTitle: 'Citizen Demographic Profile',
      privacyNotice:
        'Zero PII Collection: No Aadhaar or phone numbers are stored. Evaluation runs strictly on demographic rules.',
      loadDemo: 'Load Demo Profile',
      resetProfile: 'Reset Answers',
      ageLabel: 'Age (Years)',
      agePlaceholder: 'e.g. 42',
      genderLabel: 'Gender',
      genderSelect: 'Select Gender',
      female: 'Female',
      male: 'Male',
      transgender: 'Transgender',
      preferNotToSay: 'Prefer not to say',
      areaLabel: 'Residence Area',
      areaSelect: 'Select Area',
      rural: 'Rural',
      urban: 'Urban',
      stateLabel: 'State / Union Territory',
      stateSelect: 'Select State / UT',
      occupationLabel: 'Occupation / Livelihood',
      occupationSelect: 'Select Occupation',
      incomeLabel: 'Annual Household Income',
      incomeSelect: 'Select Income Range',
      categoryLabel: 'Social Category',
      categorySelect: 'Select Category',
      landholdingLabel: 'Agricultural Landholding',
      landholdingSelect: 'Select Landholding',
      isStudent: 'Currently enrolled as a student',
      hasDisability: 'Person with benchmark disability (PwD)',
      ownsPuccaHouse: 'Family owns a permanent pucca house',
      isTaxPayer: 'Any family member pays income tax',
      isGovtEmployee: 'Any family member is a regular government employee',
      collapseProfile: 'Collapse Profile Editor',
      editProfile: 'Edit Demographic Profile',
      allSchemes: 'All Schemes',
      eligibleMet: 'Eligible (Met)',
      needsVerification: 'Needs Verification',
      notEligible: 'Not Eligible',
      met: 'Met',
      notMet: 'Not Met',
      unknown: 'Unknown',
      matchedCriteria: 'Matched Criteria',
      missingInfo: 'Missing Information / Needs Verification',
      criteriaNotMet: 'Criteria Not Met',
      addToMapper: 'Add to Document Mapper',
      inMapper: 'Selected in Mapper',
      criteriaResults: 'Criteria Breakdown',
      whyEligible: 'Eligibility Evaluation & Statutory Reasons',
      officialVerificationSource: 'Verified Source:',
      noResultsMatching: 'No schemes match the selected filter',
      backendEvaluatorBadge: 'FastAPI Backend Synchronized',
      targetSchemeBannerTitle: 'Focused Scheme Eligibility',
      targetSchemeBannerDesc:
        'Displaying statutory criteria and explainable outcome for the selected scheme below. You can adjust your profile values above in real-time.',
      targetSchemeBadge: 'Selected Scheme',
      viewAllSchemes: 'View All Schemes',
      filterByScheme: 'Scheme:',
      allSchemesOption: 'All Schemes',
      clearSchemeFilter: 'Clear Scheme Filter',
    },

    // Document Mapper
    documentMapper: {
      badge: 'Document Synergy Mapper',
      title: 'Cross-Scheme Document Synergy',
      subtitle:
        'Discover common certificates required across your selected schemes to avoid redundant government visits.',
      readinessScore: 'Document Readiness Score',
      allDocs: 'All Documents',
      sharedDocs: 'Multi-Scheme Reusable',
      singleDocs: 'Single Scheme Only',
      haveDocs: 'Have in Hand',
      missingDocs: 'Missing / Needed',
      selectedSchemes: 'Target Schemes for Synergy Analysis:',
      noSchemesSelected: 'Please select at least one scheme to map required documents.',
      issuingAuthority: 'Issuing Authority:',
      usedInSchemes: 'Required by Schemes:',
      haveIt: 'Have it in Hand',
      needed: 'Missing / Need to Procure',
      unconfirmed: 'Unconfirmed Status',
      proceedPassport: 'Proceed to Readiness Passport',
      resetSelection: 'Reset Selection',
      reusableBadge: 'Reusable Certificate',
    },

    // Readiness Passport
    readinessPassport: {
      badge: 'Civic Credential',
      title: 'Scheme Readiness Passport',
      subtitle:
        'Your consolidated, verified civic application dossier ready for submission at Seva Kendras.',
      printDossier: 'Print / Save PDF',
      downloadPdf: 'Download Official PDF',
      downloadingPdf: 'Generating PDF...',
      passportId: 'Passport ID:',
      readinessIndex: 'Citizen Readiness Index',
      profileSnapshot: 'Demographic Profile Snapshot',
      targetSchemes: 'Target Welfare Schemes',
      docsChecklist: 'Document Readiness Checklist',
      readyDocuments: 'Ready in Hand',
      missingDocuments: 'Missing / Required Action',
      nextSteps: 'Action Steps at Seva Kendra / CSC',
      step1Action: 'Carry verified original identity and land/income documents.',
      step2Action: 'Visit your nearest Common Service Centre (CSC) or Gram Panchayat office.',
      step3Action: 'Provide application reference and authenticate via biometric/OTP.',
      qrNote: 'Tamper-evident verification token for offline presentation at CSC centers.',
      privacyGuarantee:
        'Civic Privacy Guarantee: Generated client-side without storing Aadhaar numbers or bank credentials.',
    },

    // Trust Monitor
    trustMonitor: {
      badge: 'Civic Provenance Audit',
      title: 'Official-Source Trust Monitor',
      subtitle:
        'Transparent metadata verification, gazette citations, and authentic government domain checks.',
      verifiedPortals: 'Verified Government Portals',
      zeroHallucination: 'Zero Hallucinated Claims',
      officialGovDomains: 'Authentic .gov.in / .nic.in Domains',
      filterAll: 'All Schemes',
      filterVerified: 'Fully Verified (100%)',
      filterFlagged: 'Requires Review',
      searchPlaceholder: 'Search audit by scheme, ministry, or domain...',
      gazetteSource: 'Official Gazette / Notification Reference',
      verifiedDate: 'Last Verification Date:',
      domainStatus: 'Domain Authentication:',
      openPortal: 'Open Official Portal',
      domainValid: 'Valid Government Domain',
      domainInvalid: 'Non-standard domain',
    },

    // Application Tracker
    tracker: {
      badge: 'Submission Guidance',
      title: 'Application Guidance Tracker',
      subtitle:
        'Interactive step-by-step checklist to guide your application from document gathering to official portal submission.',
      selectScheme: 'Select Scheme to Track:',
      overallProgress: 'Application Readiness Progress',
      completed: 'Completed',
      resetSteps: 'Reset Checklist',
      notesTitle: 'Personal Citizen Notes (Stored locally on your device)',
      notesPlaceholder:
        'Record your application acknowledgment number, CSC token, or officer contact here...',
      savedLocalNotice:
        'Notes are saved locally in your browser memory and never uploaded to any server.',
      visitPortal: 'Open Official Application Portal',
      stage1Title: 'Stage 1: Verify Statutory Eligibility Criteria',
      stage2Title: 'Stage 2: Procure Required Documents',
      stage3Title: 'Stage 3: Submit via Official Government Channel',
      stage4Title: 'Stage 4: Note Acknowledgment ID & Track Official Status',
    },

    // Developer Handshake
    developer: {
      badge: 'Shared Project Foundation',
      title: 'Architecture & Developer Integration',
      subtitle: 'Collaborative foundation between Developer 1 (Frontend) and Developer 2 (Backend).',
      apiContract: 'API Contract Status',
      activeBase: 'Active Base URL:',
      test: 'Test',
      testing: 'Testing...',
    },

    // Footer
    footer: {
      disclaimer: 'Civic Tech Foundation • Zero Hallucination Guarantee • Official Gazette Data Only',
      rights: 'SevAIQ • Empowering Citizens with Verifiable Government Entitlements',
    },
  },

  ta: {
    // Header
    header: {
      tagline: 'குடிமக்கள் தகவல் நுண்ணறிவு & திட்டத் தகுதி தளம்',
      dashboard: 'முகப்பு',
      schemes: 'திட்டங்கள்',
      schemesMobile: 'திட்டங்களை காண்க',
      schemesDesc: 'இருமொழி நலத்திட்ட தேடல்',
      eligibility: 'தகுதி சரிபார்ப்பு',
      eligibilityMobile: 'விளக்கமான தகுதி',
      eligibilityDesc: 'சட்டப்பூர்வ தகுதி சரிபார்ப்பு',
      documents: 'ஆவணங்கள்',
      documentsMobile: 'ஆவண இணைப்பு வரைபடம்',
      documentsDesc: 'திட்டங்களுக்கிடையேயான சான்றிதழ் வரைபடம்',
      passport: 'பாஸ்போர்ட்',
      passportMobile: 'தயார்நிலை பாஸ்போர்ட்',
      passportDesc: 'குடிமக்கள் ஆவணக் கோப்பு',
      trust: 'நம்பகத்தன்மை',
      trustMobile: 'அதிகாரப்பூர்வ மூல தணிக்கை',
      trustDesc: 'அரசு மூல சரிபார்ப்பு',
      guidance: 'வழிகாட்டி',
      guidanceMobile: 'விண்ணப்ப வழிகாட்டி',
      guidanceDesc: 'படிபடியான விண்ணப்ப வழிகாட்டி',
      kioskMode: 'கியோஸ்க் முறை:',
      active: 'இயக்கத்தில்',
      off: 'நிறுத்தம்',
      kioskActiveTooltip: 'பொது கியோஸ்க் முறை இயக்கத்தில் உள்ளது: விவரங்கள் நினைவகத்தில் மட்டுமே இருக்கும்',
      kioskOffTooltip: 'பகிரப்பட்ட சாதனங்களுக்கான பொது கியோஸ்க் முறையை மாற்றவும்',
      endSession: 'அமர்வை முடி',
      endSessionTooltip: 'இச்சாதனத்திலிருந்து அனைத்து விவரங்களையும் அழிக்கவும்',
      languageSelect: 'மொழி',
      endSessionDialogTitle: 'குடிமக்கள் அமர்வை முடிக்கவா?',
      endSessionDialogDesc:
        'இது உங்கள் அனைத்து புள்ளிவிவரங்கள், தகுதி முடிவுகள் மற்றும் ஆவண விவரங்களை உடனடியாக அழித்துவிடும்.',
      cancelKeepSession: 'ரத்து (அமர்வை தொடரவும்)',
      confirmEndSession: 'ஆம், அமர்வை முடித்து அனைத்தையும் அழி',
      challengeBadge: 'சேவா முதல் கண்டுபிடிப்பு சவால் 2026',
      civicDossier: 'குடிமக்கள் ஆவணக் கோப்பு',
      volatileSession: 'நினைவகத்தில் மட்டுமே உள்ள அமர்வு',
      standardSession: 'நிலையான உள்ளூர் அமர்வு',
    },

    // Hero
    hero: {
      badge: 'சேவா முதல் கண்டுபிடிப்பு சவால் 2026',
      track: 'குடிமக்கள் தொழில்நுட்ப பிரிவு',
      titlePart1: 'சரிபார்க்கப்பட்ட அரசு நலத்திட்டங்கள் மூலம் ',
      titleHighlight: 'குடிமக்களை வலுப்படுத்துதல்',
      description:
        'SevAIQ குடிமக்களை மத்திய மற்றும் மாநில நலத்திட்டங்களுடன் சரிபார்க்கப்பட்ட, துல்லியமான குடிமக்கள் தகவல் நுண்ணறிவு மூலம் நேரடியாக இணைக்கிறது.',
      discoverSchemes: 'அரசு திட்டங்களை கண்டறியுங்கள்',
      viewArchitecture: 'கட்டமைப்பு & API ஒப்பந்தத்தை காண்க',
      guarantee1Title: 'துல்லிய உத்தரவாதம்',
      guarantee1Desc:
        'அதிகாரப்பூர்வ அரசு இணையதளங்களில் சரிபார்க்கப்பட்ட பின்னரே திட்டங்கள் சேர்க்கப்படுகின்றன.',
      guarantee2Title: 'இலக்கு தகுதி நிர்ணயம்',
      guarantee2Desc:
        'தொழில், இருப்பிடம் மற்றும் சுயவிவரத்தின் அடிப்படையில் சரியான திட்டங்களுடன் இணைக்கிறது.',
      guarantee3Title: 'தனித்தனி கட்டமைப்பு',
      guarantee3Desc:
        'FastAPI பின்தளம் + Vite React முகப்பு, தேசிய அளவில் பயன்படக்கூடிய வகையில் வடிவமைக்கப்பட்டுள்ளது.',
    },

    // Dashboard
    dashboard: {
      kioskNoticeTitle: 'பொது கியோஸ்க் முறை இயக்கத்தில் உள்ளது:',
      kioskNoticeDesc:
        'சுயவிவர பதில்களும் ஆவண நிலைகளும் உலாவி நினைவகத்தில் மட்டுமே இருக்கும். இக்கணினியில் எந்த தகவலும் சேமிக்கப்படாது.',
      welcomeBadge: 'சேவா முதல் கண்டுபிடிப்பு சவால் 2026',
      welcomeTitle: 'குடிமக்கள் தகவல் நுண்ணறிவு & திட்ட தயார்நிலை',
      welcomeDesc:
        'SevAIQ குடிமக்களுக்கும் அரசு நலத்திட்டங்களுக்கும் இடையேயான இடைவெளியைக் குறைக்கிறது. சரிபார்க்கப்பட்ட மத்திய மற்றும் மாநில திட்டங்களைக் கண்டறியுங்கள், தகுதியை வெளிப்படையாக சரிபாருங்கள், ஆவணங்களை பாதுகாப்பாக தயார் செய்யுங்கள்.',
      viewEligibilityResults: 'தகுதி முடிவுகளைக் காண்க',
      checkEligibility: 'உங்கள் தகுதியை சரிபார்க்கவும்',
      exploreCatalog: 'திட்ட பட்டியலை ஆராயுங்கள்',
      metricCataloged: 'பட்டியலிடப்பட்ட திட்டங்கள்',
      metricVerified: 'சரிபார்க்கப்பட்ட ஆதாரங்கள்',
      metricGazetteLinks: 'அரசிதழ் & இணையதள இணைப்புகள்',
      metricEligible: 'தகுதியான திட்டங்கள்',
      metricFullyMet: 'முழு தகுதி',
      metricProfileNeeded: 'விவரக்குறிப்பு தேவை',
      metricCriteriaMatched: 'விவரக்குறிப்புடன் பொருந்திய விதிகள்',
      metricDocsReady: 'தயாராக உள்ள ஆவணங்கள்',
      metricDocOverlap: 'திட்டங்களுக்கிடையேயான பொது ஆவணங்கள்',
      metricPassport: 'தயார்நிலை பாஸ்போர்ட்',
      metricActive: 'செயலில் உள்ளது',
      metricDraft: 'வரைவு',
      metricExportReady: 'பதிவிறக்க தயார்',
      metricPrintableDossier: 'அச்சிடக்கூடிய குடிமக்கள் ஆவணக் கோப்பு',
      workflowBadge: 'முறையான குடிமக்கள் செயல்முறை',
      workflowTitle: 'SevAIQ உங்கள் விண்ணப்பத்தை எவ்வாறு எளிதாக்குகிறது',
      workflowSubtitle:
        'விண்ணப்ப நிராகரிப்பைத் தவிர்த்து திட்ட பலன்களை முழுமையாகப் பெற இந்த 4-படி செயல்முறையைப் பின்பற்றுங்கள்.',
      step1Title: 'திட்டங்களை கண்டறிதல்',
      step1Desc:
        'போலியான தகவல்கள் இன்றி, சரிபார்க்கப்பட்ட மத்திய & மாநில திட்டங்களை பார்வையிடுங்கள்.',
      step1Action: 'பட்டியலை காண்க',
      step2Title: 'தகுதியை சரிபார்த்தல்',
      step2Desc:
        'பெயர் குறிப்பிடாத சுயவிவரத்தை பூர்த்தி செய்து தகுதிக்கான காரணங்களுடன் முடிவுகளைப் பெறுங்கள்.',
      step2Action: 'சுயவிவரத்தை சரிபார்',
      step3Title: 'ஆவணங்களை இணைத்தல்',
      step3Desc:
        'திட்டங்களிடையே பொதுவான ஆவணங்களைக் கண்டறிந்து, விடுபட்ட சான்றிதழ்களை தயார் செய்யுங்கள்.',
      step3Action: 'வரைபடத்தை காண்க',
      step4Title: 'தயார்நிலை பாஸ்போர்ட்',
      step4Desc:
        'சரிபார்க்கப்பட்ட இணைப்புகள் மற்றும் சரிபார்ப்பு பட்டியலுடன் குடிமக்கள் ஆவணக் கோப்பைப் பெறுங்கள்.',
      step4Action: 'பாஸ்போர்ட்டை உருவாக்கு',
      toolsBadge: 'சிறப்பு குடிமக்கள் கருவிகள்',
      toolsTitle: 'குரல் உதவி, அரசு மூல தணிக்கை & விண்ணப்ப கண்காணிப்பு',
      feat5Title: 'தமிழ் & ஆங்கில குரல் உதவியாளர்',
      feat5Desc:
        'பேச்சு அல்லது உரை வடிவில் தமிழ் அல்லது ஆங்கிலத்தில் திட்டங்களை பற்றி கேளுங்கள். தனிநபர் ஆடியோ பாதுகாப்புடன் செயல்படுகிறது.',
      feat5Action: 'குரல் உதவியாளரை தொடங்கு (கீழ் வலது)',
      feat6Title: 'அதிகாரப்பூர்வ மூல தணிக்கை',
      feat6Desc:
        'அரசு இணையதள நம்பகத்தன்மை (.gov.in / .nic.in), உண்மை சரிபார்ப்பு தேதிகள் மற்றும் அரசிதழ் மேற்கோள்களை சரிபாருங்கள்.',
      feat6Action: 'தணிக்கையை காண்க',
      feat7Title: 'விண்ணப்ப வழிகாட்டி கண்காணிப்பாளர்',
      feat7Desc:
        'ஆவணங்களைச் சேகரிப்பது முதல் பொது சேவை மையங்களுக்குச் செல்வது வரையிலான படிபடியான வழிகாட்டி.',
      feat7Action: 'வழிகாட்டியை தொடர்க',
      privacyTitle: 'தனியுரிமைக்கு முதலிடம் தரும் கட்டமைப்பு',
      privacyDesc:
        'SevAIQ குடிமக்களின் தனியுரிமையை முழுமையாக பாதுகாக்கிறது: நாங்கள் ஒருபோதும் ஆதார் எண், வங்கி கணக்கு விவரங்கள் அல்லது தொடர்பு எண்களை சேகரிப்பதில்லை. தகுதி மதிப்பீடு சாதனத்திலேயே பெயர் குறிப்பிடாமல் நடைபெறுகிறது.',
      zeroHallucinationTitle: 'துல்லியத் தர உத்தரவாதம்',
      zeroHallucinationDesc:
        'இங்கு காட்டப்படும் ஒவ்வொரு திட்டமும் அதிகாரப்பூர்வ அரசு அரசிதழ்கள் மற்றும் அமைச்சக இணையதளங்களில் இருந்து மட்டுமே பெறப்பட்டது (எ.கா. pmkisan.gov.in மற்றும் pmjay.gov.in).',
    },

    // Scheme Discovery
    discover: {
      badge: 'திட்ட அட்டவணை',
      title: 'அரசு நலத்திட்டங்களை கண்டறியவும்',
      subtitle:
        'அரசிதழ் பதிவுகள் கொண்ட மத்திய & மாநில அரசு திட்டங்களை தேடுங்கள்.',
      syncBackend: 'பின்தள ஒத்திசைவு',
      searchPlaceholder:
        'திட்டப் பெயர், அமைச்சகம், பயன் அல்லது தமிழ் வார்த்தை மூலம் தேடுங்கள் (எ.கா: விவசாயி, மருத்துவம், கடன்)...',
      allCategories: 'அனைத்து துறைகள்',
      quickQueries: 'விரைவு தேடல்கள்:',
      noSchemesFound: 'உங்கள் தேடலுக்குரிய திட்டங்கள் எதுவும் காணப்படவில்லை',
      noSchemesDesc: 'உங்கள் தேடல் சொல்லை மாற்றவும் அல்லது வேறு துறையை தேர்ந்தெடுக்கவும்.',
      clearFilters: 'வடிகட்டிகளை நீக்கு',
      verifiedOfficialSource: 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ ஆதாரம்',
      ministry: 'அமைச்சகம்:',
      targetBeneficiary: 'பயனாளிகள்:',
      benefits: 'நலத்திட்ட பயன்கள்:',
      requiredDocs: 'தேவைப்படும் ஆவணங்கள்:',
      checkEligibility: 'தகுதி சரிபார்க்கவும்',
      trackGuidance: 'விண்ணப்ப வழிகாட்டி',
      officialPortal: 'அதிகாரப்பூர்வ தளம்',
      viewFullDetails: 'முழு விவரங்கள் & விண்ணப்ப முறைகள்',
      schemeOverview: 'திட்ட கண்ணோட்டம் & சரிபார்ப்பு',
      nodalAgency: 'முதன்மை முகமை',
      verifiedOn: 'சரிபார்க்கப்பட்ட நாள்',
      sourceCitation: 'ஆதார மேற்கோள்',
      detailedBenefits: 'விரிவான பயன்கள் & உரிமைகள்',
      eligibilityCriteria: 'சட்டப்பூர்வ தகுதி நிபந்தனைகள்',
      applicationSteps: 'அதிகாரப்பூர்வ விண்ணப்ப முறைகள்',
      close: 'மூடு',
      applicationMode: 'விண்ணப்ப முறை:',
    },

    // Eligibility Screen
    eligibility: {
      badge: 'குடிமக்கள் தகுதி சரிபார்ப்பு பொறி',
      title: 'விளக்கமான அரசு திட்ட தகுதி சரிபார்ப்பு',
      subtitle:
        'விதிமுறை அடிப்படையிலான வெளிப்படையான காரணங்களுடன் தகுதியை சரிபார்க்க அடிப்படை புள்ளிவிவரங்களை உள்ளிடுங்கள்.',
      profileTitle: 'குடிமக்கள் புள்ளிவிவரக் குறிப்பு',
      privacyNotice:
        'பெயர் குறிப்பிடாத சரிபார்ப்பு: ஆதார் அல்லது தொலைபேசி எண்கள் ஒருபோதும் சேகரிக்கப்படுவதில்லை. புள்ளிவிவர விதிகளின்படி மட்டுமே மதிப்பீடு செய்யப்படுகிறது.',
      loadDemo: 'மாதிரி விவரத்தை ஏற்று',
      resetProfile: 'பதில்களை அழி',
      ageLabel: 'வயது (ஆண்டுகள்)',
      agePlaceholder: 'எ.கா: 42',
      genderLabel: 'பாலினம்',
      genderSelect: 'பாலினத்தை தேர்ந்தெடுக்கவும்',
      female: 'பெண்',
      male: 'ஆண்',
      transgender: 'திருநங்கை / மூன்றாம் பாலினம்',
      preferNotToSay: 'குறிப்பிட விரும்பவில்லை',
      areaLabel: 'வசிப்பிடம்',
      areaSelect: 'வசிப்பிடத்தை தேர்ந்தெடுக்கவும்',
      rural: 'கிராமப்புறம்',
      urban: 'நகர்ப்புறம்',
      stateLabel: 'மாநிலம் / யூனியன் பிரதேசம்',
      stateSelect: 'மாநிலத்தை தேர்ந்தெடுக்கவும்',
      occupationLabel: 'தொழில் / வாழ்வாதாரம்',
      occupationSelect: 'தொழிலை தேர்ந்தெடுக்கவும்',
      incomeLabel: 'ஆண்டு குடும்ப வருமானம்',
      incomeSelect: 'வருமான வரம்பை தேர்ந்தெடுக்கவும்',
      categoryLabel: 'சமூகப் பிரிவு',
      categorySelect: 'பிரிவை தேர்ந்தெடுக்கவும்',
      landholdingLabel: 'விவசாய நில அளவு',
      landholdingSelect: 'நில அளவை தேர்ந்தெடுக்கவும்',
      isStudent: 'தற்போது மாணவராக கல்வி பயில்கிறார்',
      hasDisability: 'மாற்றுத்திறனாளி (PwD)',
      ownsPuccaHouse: 'குடும்பத்திற்கு சொந்தமாக நிரந்தர கான்கிரீட் வீடு உள்ளது',
      isTaxPayer: 'குடும்பத்தில் எவரேனும் வருமான வரி செலுத்துகிறார்களா?',
      isGovtEmployee: 'குடும்பத்தில் எவரேனும் நிரந்தர அரசு ஊழியரா?',
      collapseProfile: 'விவர தொகுப்பை மூடு',
      editProfile: 'சுயவிவரத்தை திருத்து',
      allSchemes: 'அனைத்து திட்டங்கள்',
      eligibleMet: 'தகுதியுடையவை (பூர்த்தி)',
      needsVerification: 'கூடுதல் சரிபார்ப்பு தேவை',
      notEligible: 'தகுதியில்லை',
      met: 'தகுதி பூர்த்தி',
      notMet: 'தகுதியில்லை',
      unknown: 'தெரியவில்லை',
      matchedCriteria: 'பூர்த்தியான தகுதிகள்',
      missingInfo: 'தேவைப்படும் கூடுதல் தகவல் / சரிபார்ப்பு',
      criteriaNotMet: 'பொருந்தாத நிபந்தனைகள்',
      addToMapper: 'ஆவண வரைபடத்தில் சேர்',
      inMapper: 'வரைபடத்தில் சேர்க்கப்பட்டது',
      criteriaResults: 'தகுதி விதிமுறைகளின் சுருக்கம்',
      whyEligible: 'தகுதி மதிப்பீடு & சட்டப்பூர்வ காரணங்கள்',
      officialVerificationSource: 'சரிபார்க்கப்பட்ட மூலம்:',
      noResultsMatching: 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டலுக்கு திட்டங்கள் எதுவும் இல்லை',
      backendEvaluatorBadge: 'FastAPI பின்தளத்துடன் ஒத்திசைக்கப்பட்டது',
      targetSchemeBannerTitle: 'தேர்ந்தெடுக்கப்பட்ட திட்டத்தின் தகுதி விவரம்',
      targetSchemeBannerDesc:
        'தேர்ந்தெடுக்கப்பட்ட திட்டத்திற்கான தகுதி நிலையை கீழே காணலாம். உங்கள் விவரங்களை மேலே மாற்றி தகுதியை உடனுக்குடன் பரிசோதிக்கலாம்.',
      targetSchemeBadge: 'தேர்ந்தெடுக்கப்பட்டது',
      viewAllSchemes: 'அனைத்து திட்டங்களையும் காட்டு',
      filterByScheme: 'திட்டம்:',
      allSchemesOption: 'அனைத்து திட்டங்கள்',
      clearSchemeFilter: 'வடிகட்டலை நீக்கு',
    },

    // Document Mapper
    documentMapper: {
      badge: 'ஆவண இணைப்பு வரைபடம்',
      title: 'திட்டங்களுக்கிடையேயான பொது ஆவணங்கள்',
      subtitle:
        'மீண்டும் மீண்டும் அலைச்சலைத் தவிர்க்க பல நலத்திட்டங்களுக்குப் பயன்படும் பொதுவான ஆவணங்களைக் கண்டறியுங்கள்.',
      readinessScore: 'ஆவண தயார்நிலை மதிப்பெண்',
      allDocs: 'அனைத்து ஆவணங்கள்',
      sharedDocs: 'பல திட்டங்களுக்கு பயன்படுபவை',
      singleDocs: 'ஒரு திட்டத்திற்கு மட்டும்',
      haveDocs: 'கையில் உள்ளவை',
      missingDocs: 'விடுபட்டவை / தேவை',
      selectedSchemes: 'ஆவண இணைப்பிற்காக தேர்ந்தெடுக்கப்பட்ட திட்டங்கள்:',
      noSchemesSelected: 'ஆவணங்களை இணைக்க குறைந்தபட்சம் ஒரு திட்டத்தையாவது தேர்ந்தெடுக்கவும்.',
      issuingAuthority: 'வழங்கும் அதிகாரம்:',
      usedInSchemes: 'பயன்படும் திட்டங்கள்:',
      haveIt: 'கையில் உள்ளது',
      needed: 'இல்லை / பெற வேண்டும்',
      unconfirmed: 'உறுதிப்படுத்தப்படவில்லை',
      proceedPassport: 'தயார்நிலை பாஸ்போர்ட்டிற்கு செல்',
      resetSelection: 'தேர்வை மீட்டமை',
      reusableBadge: 'மறுபயன்பாட்டு சான்றிதழ்',
    },

    // Readiness Passport
    readinessPassport: {
      badge: 'குடிமக்கள் சான்றாவணம்',
      title: 'திட்ட தயார்நிலை பாஸ்போர்ட்',
      subtitle:
        'விண்ணப்பிக்கத் தயாராக உள்ள உங்கள் சரிபார்க்கப்பட்ட குடிமக்கள் ஆவணக் கோப்பு.',
      printDossier: 'அச்சிடு / PDF சேமி',
      downloadPdf: 'அதிகாரப்பூர்வ PDF பதிவிறக்கு',
      downloadingPdf: 'PDF உருவாக்கப்படுகிறது...',
      passportId: 'பாஸ்போர்ட் அடையாள எண்:',
      readinessIndex: 'குடிமக்கள் தயார்நிலை குறியீடு',
      profileSnapshot: 'சுயவிவர சுருக்கம்',
      targetSchemes: 'இலக்கு நலத்திட்டங்கள்',
      docsChecklist: 'ஆவண தயார்நிலை சரிபார்ப்பு பட்டியல்',
      readyDocuments: 'கையில் தயார்',
      missingDocuments: 'விடுபட்டவை / எடுக்க வேண்டிய நடவடிக்கை',
      nextSteps: 'பொது சேவை மையம் / அரசு அலுவலக அடுத்த கட்ட நடவடிக்கைகள்',
      step1Action: 'சரிபார்க்கப்பட்ட அசல் அடையாள அட்டை மற்றும் வருமானம்/நில ஆவணங்களை எடுத்துச் செல்லவும்.',
      step2Action: 'அருகிலுள்ள பொது சேவை மையம் (CSC) அல்லது கிராம ஊராட்சி அலுவலகத்திற்கு செல்லவும்.',
      step3Action: 'விண்ணப்ப குறிப்பை வழங்கி பயோமெட்ரிக் அல்லது OTP மூலம் சரிபார்க்கவும்.',
      qrNote: 'பொது சேவை மையங்களில் சமர்ப்பிப்பதற்கான ஆஃப்லைன் சரிபார்ப்பு குறியீடு.',
      privacyGuarantee:
        'குடிமக்கள் தனியுரிமை உத்தரவாதம்: ஆதார் அல்லது வங்கி கணக்கு எண்களைச் சேமிக்காமல் உலாவி சாதனத்திலேயே உருவாக்கப்பட்டது.',
    },

    // Trust Monitor
    trustMonitor: {
      badge: 'அரசு மூல உண்மைத் தணிக்கை',
      title: 'அதிகாரப்பூர்வ மூல தணிக்கை',
      subtitle:
        'வெளிப்படையான தகவல்கள், அரசிதழ் மேற்கோள்கள் மற்றும் அதிகாரப்பூர்வ அரசு இணையதள சரிபார்ப்புகள்.',
      verifiedPortals: 'சரிபார்க்கப்பட்ட அரசு தளங்கள்',
      zeroHallucination: 'துல்லியத் தர உத்தரவாதம்',
      officialGovDomains: 'அதிகாரப்பூர்வ .gov.in / .nic.in முகவரிகள்',
      filterAll: 'அனைத்து திட்டங்கள்',
      filterVerified: 'முழுமையாக சரிபார்க்கப்பட்டது (100%)',
      filterFlagged: 'கூடுதல் ஆய்வு தேவை',
      searchPlaceholder: 'திட்டம், அமைச்சகம் அல்லது இணைய முகவரி மூலம் தேடுங்கள்...',
      gazetteSource: 'அதிகாரப்பூர்வ அரசிதழ் / அறிவிக்கை குறிப்பு',
      verifiedDate: 'கடைசி சரிபார்ப்பு நாள்:',
      domainStatus: 'இணையதள நம்பகத்தன்மை:',
      openPortal: 'அதிகாரப்பூர்வ தளத்தை திற',
      domainValid: 'சரியான அரசு இணையதளம்',
      domainInvalid: 'நிலையான அரசு தளம் அல்ல',
    },

    // Application Tracker
    tracker: {
      badge: 'விண்ணப்ப வழிகாட்டுதல்',
      title: 'விண்ணப்ப வழிகாட்டி & கண்காணிப்பு',
      subtitle:
        'ஆவணங்களைச் சேகரிப்பது முதல் அதிகாரப்பூர்வ தளத்தில் சமர்ப்பிப்பது வரையிலான படிபடியான சரிபார்ப்பு பட்டியல்.',
      selectScheme: 'கண்காணிக்க வேண்டிய திட்டத்தை தேர்வு செய்க:',
      overallProgress: 'விண்ணப்ப தயார்நிலை முன்னேற்றம்',
      completed: 'முடிந்தது',
      resetSteps: 'பட்டியலை மீட்டமை',
      notesTitle: 'தனிப்பட்ட குறிப்புகள் (உங்கள் சாதனத்தில் மட்டுமே சேமிக்கப்படும்)',
      notesPlaceholder:
        'உங்கள் விண்ணப்ப ரசீது எண், டோக்கன் எண் அல்லது தொடர்பு விவரங்களை இங்கு குறித்து வைக்கலாம்...',
      savedLocalNotice:
        'குறிப்புகள் உங்கள் உலாவி நினைவகத்தில் மட்டுமே சேமிக்கப்படும், எந்த சேவையகத்திற்கும் அனுப்பப்படாது.',
      visitPortal: 'அதிகாரப்பூர்வ விண்ணப்ப தளத்தை திற',
      stage1Title: 'படி 1: தகுதி விதிகளை சரிபார்த்தல்',
      stage2Title: 'படி 2: தேவையான ஆவணங்களை தயார் செய்தல்',
      stage3Title: 'படி 3: அதிகாரப்பூர்வ இணையதளம் / மையத்தில் விண்ணப்பித்தல்',
      stage4Title: 'படி 4: விண்ணப்ப ரசீது எண்ணை குறித்து வைத்தல்',
    },

    // Developer Handshake
    developer: {
      badge: 'திட்ட ஒருங்கிணைப்பு தளம்',
      title: 'கட்டமைப்பு & டெவலப்பர் ஒருங்கிணைப்பு',
      subtitle: 'டெவலப்பர் 1 (முகப்பு) மற்றும் டெவலப்பர் 2 (பின்தளம்) இடையிலான ஒருங்கிணைந்த கட்டமைப்பு.',
      apiContract: 'API ஒப்பந்த நிலை',
      activeBase: 'செயலில் உள்ள முகவரி:',
      test: 'சோதி',
      testing: 'சோதிக்கிறது...',
    },

    // Footer
    footer: {
      disclaimer: 'குடிமக்கள் தொழில்நுட்ப அறக்கட்டளை • துல்லிய உத்தரவாதம் • அதிகாரப்பூர்வ அரசிதழ் தகவல்கள் மட்டுமே',
      rights: 'SevAIQ • சரிபார்க்கப்பட்ட அரசு நலத்திட்டங்கள் மூலம் குடிமக்களை வலுப்படுத்துதல்',
    },
  },
};

/**
 * Localized option labels for demographic dropdowns
 */
export const LOCALIZED_OPTIONS = {
  genders: {
    en: {
      Female: 'Female',
      Male: 'Male',
      Transgender: 'Transgender',
      'Prefer not to say': 'Prefer not to say',
    },
    ta: {
      Female: 'பெண் (Female)',
      Male: 'ஆண் (Male)',
      Transgender: 'திருநங்கை / மூன்றாம் பாலினம் (Transgender)',
      'Prefer not to say': 'குறிப்பிட விரும்பவில்லை (Prefer not to say)',
    },
  },
  areas: {
    en: {
      Rural: 'Rural (Village / Gram Panchayat)',
      Urban: 'Urban (City / Town / Municipality)',
    },
    ta: {
      Rural: 'கிராமப்புறம் (Rural / ஊராட்சி)',
      Urban: 'நகர்ப்புறம் (Urban / நகராட்சி)',
    },
  },
  incomes: {
    en: {
      '< 1 Lakh': '< 1 Lakh (BPL / Antyodaya Category)',
      '1 - 2.5 Lakh': '1 - 2.5 Lakh (Low Income / EWS)',
      '2.5 - 5 Lakh': '2.5 - 5 Lakh (Lower Middle Class)',
      '5 - 8 Lakh': '5 - 8 Lakh (Middle Income)',
      '> 8 Lakh': '> 8 Lakh (Higher Income)',
    },
    ta: {
      '< 1 Lakh': '₹1 லட்சத்திற்கும் குறைவு (வறுமைக்கோடு கீழ்)',
      '1 - 2.5 Lakh': '₹1 - ₹2.5 லட்சம் (குறைந்த வருவாய் / EWS)',
      '2.5 - 5 Lakh': '₹2.5 - ₹5 லட்சம் (நடுத்தர வருவாய்)',
      '5 - 8 Lakh': '₹5 - ₹8 லட்சம் (உயர் நடுத்தர வருவாய்)',
      '> 8 Lakh': '₹8 லட்சத்திற்கு மேல் (உயர் வருவாய்)',
    },
  },
  categories: {
    en: {
      General: 'General Category',
      OBC: 'Other Backward Classes (OBC)',
      SC: 'Scheduled Castes (SC)',
      ST: 'Scheduled Tribes (ST)',
      EWS: 'Economically Weaker Section (EWS)',
    },
    ta: {
      General: 'பொதுப்பிரிவு (General)',
      OBC: 'பிற்படுத்தப்பட்டோர் (OBC)',
      SC: 'ஆதிதிராவிடர் / பட்டியல் சாதி (SC)',
      ST: 'பழங்குடியினர் (ST)',
      EWS: 'பொருளாதாரத்தில் பின்தங்கியோர் (EWS)',
    },
  },
  landholdings: {
    en: {
      None: 'None (Landless / Non-Agricultural)',
      'Marginal (< 1 ha)': 'Marginal Farmer (< 1 ha / 2.5 acres)',
      'Small (1-2 ha)': 'Small Farmer (1-2 ha / 2.5 to 5 acres)',
      'Medium/Large (> 2 ha)': 'Medium or Large Farmer (> 2 ha / 5+ acres)',
    },
    ta: {
      None: 'நிலமில்லை (விவசாய நிலம் இல்லை)',
      'Marginal (< 1 ha)': 'குறு விவசாயி (< 1 ஹெக்டேர் / 2.5 ஏக்கருக்குள்)',
      'Small (1-2 ha)': 'சிறு விவசாயி (1-2 ஹெக்டேர் / 2.5 - 5 ஏக்கர்)',
      'Medium/Large (> 2 ha)': 'நடுத்தர / பெரிய விவசாயி (> 2 ஹெக்டேர்)',
    },
  },
  occupations: {
    en: {
      'Farmer / Cultivator': 'Farmer / Cultivator',
      'Agricultural Worker': 'Agricultural Worker / Farm Labour',
      'Street Vendor / Hawker': 'Street Vendor / Hawker',
      'Small Business / Artisan': 'Small Business Owner / Traditional Artisan',
      'Daily Wage / Informal Worker': 'Daily Wage / Construction / Informal Worker',
      'Self-Employed': 'Self-Employed Professional',
      'Student / Scholar': 'Student / Research Scholar',
      'Salaried Employee (Private)': 'Salaried Employee (Private Sector)',
      Homemaker: 'Homemaker',
      'Senior Citizen / Retired': 'Senior Citizen / Retired Pensioner',
      'Unemployed / Jobseeker': 'Unemployed / Jobseeker',
    },
    ta: {
      'Farmer / Cultivator': 'விவசாயி / நில உரிமையாளர் (Farmer / Cultivator)',
      'Agricultural Worker': 'விவசாய கூலித் தொழிலாளி (Agricultural Worker)',
      'Street Vendor / Hawker': 'தெருவோர வியாபாரி / தள்ளுவண்டி (Street Vendor)',
      'Small Business / Artisan': 'சிறு வணிகர் / கைவினைஞர் (Artisan / Small Business)',
      'Daily Wage / Informal Worker': 'தினக்கூலி / கட்டுமானத் தொழிலாளி (Daily Wage Worker)',
      'Self-Employed': 'சுயதொழில் புரிபவர் (Self-Employed)',
      'Student / Scholar': 'மாணவர் / ஆய்வாளர் (Student / Scholar)',
      'Salaried Employee (Private)': 'தனியார் துறை ஊழியர் (Private Employee)',
      Homemaker: 'குடும்பத் தலைவி / இல்லத்தரசி (Homemaker)',
      'Senior Citizen / Retired': 'மூத்த குடிமக்கள் / ஓய்வுபெற்றவர் (Senior Citizen)',
      'Unemployed / Jobseeker': 'வேலை தேடுபவர் (Jobseeker)',
    },
  },
  categoryFilters: {
    en: {
      all: 'All Sectors',
      agriculture: 'Agriculture & Rural',
      healthcare: 'Healthcare & Wellness',
      livelihood: 'Urban Livelihoods & Enterprise',
      education: 'Education & Skilling',
      housing: 'Housing & Infrastructure',
    },
    ta: {
      all: 'அனைத்து துறைகள்',
      agriculture: 'வேளாண்மை & கிராமப்புறம்',
      healthcare: 'சுகாதாரம் & நல்வாழ்வு',
      livelihood: 'வாழ்வாதாரம் & குறுந்தொழில்',
      education: 'கல்வி & திறன்மேம்பாடு',
      housing: 'வீட்டுவசதி & உள்கட்டமைப்பு',
    },
  },
};
