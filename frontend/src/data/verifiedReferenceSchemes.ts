import { Scheme, DocumentRecord } from '../types';

/**
 * Official Verified Reference Schemes.
 * 
 * Source: Official Government Portals & Gazette Notifications.
 * Used for client-side eligibility evaluation, document mapping, and readiness passport
 * while the backend scheme database undergoes verified ingestion by Developer 2.
 */
export const VERIFIED_REFERENCE_SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    short_description:
      'Direct income support of ₹6,000 per year transferred in three equal installments of ₹2,000 directly to bank accounts of landholding farmer families.',
    category: 'Agriculture & Rural',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    beneficiary_type: 'Small and Marginal Landholding Farmers',
    official_portal_url: 'https://pmkisan.gov.in',
    verified: true,
    verification_source: 'Official Portal (pmkisan.gov.in) & Operational Guidelines 2019-2024',
    verification_date: '2019-02-01',
    origin: 'reference',
    benefits_summary: '₹6,000 per annum via Direct Benefit Transfer (DBT)',
    application_mode: 'Both',
    rules: {
      allowedOccupations: ['Farmer / Cultivator', 'Agricultural Worker'],
      allowedLandholding: ['Marginal (< 1 ha)', 'Small (1-2 ha)'],
      allowedAreas: ['Rural', 'Urban', 'All'],
      maxAge: 100,
      minAge: 18,
    },
    required_documents: ['land-records', 'domicile-certificate', 'ration-card'],
  },
  {
    id: 'ab-pmjay',
    title: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)',
    short_description:
      'World’s largest government-funded health assurance scheme providing health cover of ₹5 Lakh per eligible family per year for secondary and tertiary hospitalization.',
    category: 'Healthcare & Wellness',
    ministry: 'Ministry of Health and Family Welfare / National Health Authority (NHA)',
    beneficiary_type: 'Bottom 40% vulnerable and deprived households',
    official_portal_url: 'https://pmjay.gov.in',
    verified: true,
    verification_source: 'National Health Authority (nha.gov.in / pmjay.gov.in)',
    verification_date: '2018-09-23',
    origin: 'reference',
    benefits_summary: '₹5,00,000 annual cashless hospitalization cover per family',
    application_mode: 'CSC / Seva Kendra',
    rules: {
      maxIncomeBracketIndex: 1, // < 1L or 1-2.5L (SECC/BPL proxy)
      minAge: 0,
      maxAge: 100,
    },
    required_documents: ['ration-card', 'income-certificate', 'domicile-certificate'],
  },
  {
    id: 'pm-svanidhi',
    title: 'PM Street Vendor’s AtmaNirbhar Nidhi (PM SVANidhi)',
    short_description:
      'Special micro-credit facility providing affordable working capital loans starting at ₹10,000 (escalating to ₹20,000 and ₹50,000 on timely repayment) with interest subsidy.',
    category: 'Urban Livelihoods & Enterprise',
    ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
    beneficiary_type: 'Urban and Peri-Urban Street Vendors & Hawkers',
    official_portal_url: 'https://pmsvanidhi.mohua.gov.in',
    verified: true,
    verification_source: 'MoHUA Official Portal (pmsvanidhi.mohua.gov.in)',
    verification_date: '2020-06-01',
    origin: 'reference',
    benefits_summary: 'Collateral-free microcredit loan with 7% interest subsidy',
    application_mode: 'Online',
    rules: {
      allowedOccupations: ['Street Vendor / Hawker', 'Small Business / Artisan', 'Self-Employed'],
      allowedAreas: ['Urban'],
      minAge: 18,
    },
    required_documents: ['vending-id', 'domicile-certificate'],
  },
  {
    id: 'nsp-post-matric',
    title: 'Post-Matric Scholarship for SC/ST/OBC Students',
    short_description:
      'Centrally sponsored financial assistance covering compulsory non-refundable fees and maintenance allowance for students pursuing higher secondary and higher education.',
    category: 'Education & Skilling',
    ministry: 'Ministry of Social Justice and Empowerment / Tribal Affairs',
    beneficiary_type: 'SC/ST/OBC Students in Class 11 and above',
    official_portal_url: 'https://scholarships.gov.in',
    verified: true,
    verification_source: 'National Scholarship Portal (scholarships.gov.in)',
    verification_date: '2021-04-01',
    origin: 'reference',
    benefits_summary: '100% Tuition Fee reimbursement + Monthly maintenance allowance',
    application_mode: 'Online',
    rules: {
      mustBeStudent: true,
      allowedCategories: ['SC', 'ST', 'OBC'],
      maxIncomeBracketIndex: 1, // Family income <= 2.5 Lakh per annum
      minAge: 15,
      maxAge: 35,
    },
    required_documents: ['caste-certificate', 'income-certificate', 'education-marksheet', 'domicile-certificate'],
  },
  {
    id: 'pmay-g',
    title: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    short_description:
      'Financial assistance of ₹1.20 Lakh (plains) to ₹1.30 Lakh (hilly/difficult areas) along with 90 days of unskilled labor support under MGNREGS for pucca house construction.',
    category: 'Housing & Infrastructure',
    ministry: 'Ministry of Rural Development',
    beneficiary_type: 'Houseless families and households living in kutcha/dilapidated houses in rural areas',
    official_portal_url: 'https://pmayg.nic.in',
    verified: true,
    verification_source: 'Ministry of Rural Development Framework for Implementation',
    verification_date: '2016-11-20',
    origin: 'reference',
    benefits_summary: '₹1.20 Lakh to ₹1.30 Lakh financial grant for pucca house construction',
    application_mode: 'Both',
    rules: {
      allowedAreas: ['Rural'],
      maxIncomeBracketIndex: 1,
      minAge: 18,
    },
    required_documents: ['gram-panchayat-residence', 'income-certificate', 'ration-card'],
  },
];

/**
 * Standard Catalog of Civic Documents recognized across government portals.
 */
export const INITIAL_DOCUMENT_RECORDS: DocumentRecord[] = [
  {
    id: 'income-certificate',
    name: 'Income Certificate',
    description: 'Official revenue document certifying total annual family income.',
    issuingAuthority: 'Revenue Department / Tahsildar / Sub-Divisional Magistrate (SDM)',
    applicableSchemeIds: ['ab-pmjay', 'nsp-post-matric', 'pmay-g'],
    status: 'unconfirmed',
  },
  {
    id: 'domicile-certificate',
    name: 'Domicile / Residence Certificate',
    description: 'Proof of continuous residence in the respective State or Union Territory.',
    issuingAuthority: 'Tahsildar / District Magistrate / Revenue Authority',
    applicableSchemeIds: ['pm-kisan', 'ab-pmjay', 'pm-svanidhi', 'nsp-post-matric'],
    status: 'unconfirmed',
  },
  {
    id: 'ration-card',
    name: 'Ration Card (NFSA / BPL / AAY)',
    description: 'Public Distribution System family document establishing household classification.',
    issuingAuthority: 'Food, Civil Supplies and Consumer Affairs Department',
    applicableSchemeIds: ['pm-kisan', 'ab-pmjay', 'pmay-g'],
    status: 'unconfirmed',
  },
  {
    id: 'caste-certificate',
    name: 'Caste Certificate (SC / ST / OBC)',
    description: 'Attestation of reserved social category recognized under central/state orders.',
    issuingAuthority: 'Revenue Department / Competent District Magistrate',
    applicableSchemeIds: ['nsp-post-matric'],
    status: 'unconfirmed',
  },
  {
    id: 'land-records',
    name: 'Land Ownership Records (RoR / Khasra-Khatauni)',
    description: 'Record of Rights verifying cultivable agricultural land title in claimant’s name.',
    issuingAuthority: 'Revenue / Land Records Department / Patwari / Village Accountant',
    applicableSchemeIds: ['pm-kisan'],
    status: 'unconfirmed',
  },
  {
    id: 'education-marksheet',
    name: 'Previous Year Marksheet & Bonafide Certificate',
    description: 'Academic qualification record and college enrollment verification.',
    issuingAuthority: 'Recognized Educational Institution / Board of Education',
    applicableSchemeIds: ['nsp-post-matric'],
    status: 'unconfirmed',
  },
  {
    id: 'vending-id',
    name: 'Certificate of Vending (CoV) / Vending ID Card',
    description: 'Official hawking recognition issued to urban street vendors.',
    issuingAuthority: 'Urban Local Body (ULB) / Town Vending Committee (TVC)',
    applicableSchemeIds: ['pm-svanidhi'],
    status: 'unconfirmed',
  },
  {
    id: 'gram-panchayat-residence',
    name: 'Gram Panchayat Residence Verification Certificate',
    description: 'Local verification affirming kutcha house dwelling and rural residence.',
    issuingAuthority: 'Gram Panchayat / Village Secretary / Block Development Officer',
    applicableSchemeIds: ['pmay-g'],
    status: 'unconfirmed',
  },
];
