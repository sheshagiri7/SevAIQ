import { describe, it, expect } from 'vitest';
import { auditSchemeTrust } from '../components/TrustMonitor';
import { Scheme } from '../types';

describe('Trust Monitor Audit Suite', () => {
  it('correctly audits a fully verified scheme with authentic gov domain and real date', () => {
    const verifiedScheme: Scheme = {
      id: 'pm-kisan',
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      short_description: 'Income support for landholding farmers.',
      category: 'Agriculture & Rural',
      ministry: 'Ministry of Agriculture and Farmers Welfare',
      official_portal_url: 'https://pmkisan.gov.in',
      verified: true,
      verification_source: 'Official Operational Guidelines (pmkisan.gov.in)',
      verification_date: '2026-10-22',
    };

    const audit = auditSchemeTrust(verifiedScheme);
    expect(audit.hasOfficialGovDomain).toBe(true);
    expect(audit.domainName).toBe('pmkisan.gov.in');
    expect(audit.hasRealDate).toBe(true);
    expect(audit.verificationDate).toBe('2026-10-22');
    expect(audit.hasGazetteCitation).toBe(true);
    expect(audit.isFullyVerified).toBe(true);
    expect(audit.flags).toHaveLength(0);
  });

  it('flags schemes with missing verification dates or missing portal URLs', () => {
    const unverifiedScheme: Scheme = {
      id: 'draft-scheme',
      title: 'Draft Unverified Initiative',
      short_description: 'Proposed scheme without official gazette citation.',
      category: 'General',
      ministry: 'Ministry of Test',
      official_portal_url: null,
      verified: false,
      verification_source: null,
      verification_date: null,
    };

    const audit = auditSchemeTrust(unverifiedScheme);
    expect(audit.hasOfficialGovDomain).toBe(false);
    expect(audit.hasRealDate).toBe(false);
    expect(audit.isFullyVerified).toBe(false);
    expect(audit.flags.length).toBeGreaterThan(0);
    expect(audit.flags).toContain('Official portal URL missing');
    expect(audit.flags).toContain('Last-verification date is not recorded');
  });

  it('flags schemes with non-governmental external domains', () => {
    const externalScheme: Scheme = {
      id: 'test-scheme',
      title: 'External Blog Scheme',
      short_description: 'Blog post reference.',
      category: 'General',
      ministry: 'Unknown',
      official_portal_url: 'https://example-blog.com/schemes',
      verified: false,
      verification_source: 'Blog citation',
      verification_date: '2026-01-01',
    };

    const audit = auditSchemeTrust(externalScheme);
    expect(audit.hasOfficialGovDomain).toBe(false);
    expect(audit.flags).toContain('Non-standard government domain (requires verification)');
  });
});
