import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  CivicMarkdown,
  isOfficialGovDomain,
  isAuthorizedAgencyDomain,
  classifyDomainTrust,
  getFriendlyGovLabel,
  renderInlineContent,
} from '../components/CivicMarkdown';

describe('CivicMarkdown Government UX & Safe Rendering Suite', () => {
  describe('Official Government and Authorized Agency Domain Detection', () => {
    it('accurately identifies direct official Indian government domains (.gov.in / .nic.in)', () => {
      expect(isOfficialGovDomain('https://pmkisan.gov.in')).toBe(true);
      expect(isOfficialGovDomain('https://pmjay.gov.in/about')).toBe(true);
      expect(isOfficialGovDomain('https://pmayg.nic.in/netiay/home.aspx')).toBe(true);
      expect(isOfficialGovDomain('https://myscheme.gov.in')).toBe(true);
      expect(isOfficialGovDomain('https://india.gov.in')).toBe(true);
      expect(classifyDomainTrust('https://pmkisan.gov.in')).toBe('official_gov');
    });

    it('distinguishes authorized statutory service entities from direct government domains', () => {
      // nsdl.co.in (CRA for PFRDA) and mudra.org.in (SIDBI subsidiary)
      expect(isOfficialGovDomain('https://npscra.nsdl.co.in')).toBe(false);
      expect(isOfficialGovDomain('https://mudra.org.in')).toBe(false);

      expect(isAuthorizedAgencyDomain('https://npscra.nsdl.co.in')).toBe(true);
      expect(isAuthorizedAgencyDomain('https://mudra.org.in')).toBe(true);
      expect(classifyDomainTrust('https://npscra.nsdl.co.in')).toBe('authorized_agency');
      expect(classifyDomainTrust('https://mudra.org.in')).toBe('authorized_agency');
    });

    it('rejects commercial, unverified, or third-party domains', () => {
      expect(isOfficialGovDomain('https://example.com')).toBe(false);
      expect(isAuthorizedAgencyDomain('https://example.com')).toBe(false);
      expect(classifyDomainTrust('https://fake-pmkisan.biz')).toBe('external');
      expect(classifyDomainTrust('https://gov.in.fraudulent-site.org')).toBe('external');
      expect(classifyDomainTrust('https://google.com')).toBe('external');
    });

    it('derives citizen-friendly labels for official and authorized portals', () => {
      expect(getFriendlyGovLabel('https://pmkisan.gov.in')).toBe('Official PM-KISAN Portal (pmkisan.gov.in)');
      expect(getFriendlyGovLabel('https://pmjay.gov.in')).toBe('Official Ayushman Bharat Portal (pmjay.gov.in)');
      expect(getFriendlyGovLabel('https://pmayg.nic.in')).toBe('Official PMAY-Gramin Portal (pmayg.nic.in)');
      expect(getFriendlyGovLabel('https://scholarships.gov.in')).toBe('National Scholarship Portal (scholarships.gov.in)');
      expect(getFriendlyGovLabel('https://mudra.org.in')).toBe('MUDRA Scheme Portal (mudra.org.in)');
      expect(getFriendlyGovLabel('https://npscra.nsdl.co.in')).toBe('Atal Pension Yojana Portal (PFRDA/NSDL-CRA)');
      // Preserves meaningful explicit labels
      expect(getFriendlyGovLabel('https://pmkisan.gov.in', 'PM-KISAN Official Website')).toBe('PM-KISAN Official Website');
    });
  });

  describe('Inline Element Rendering', () => {
    it('converts markdown links to safe, badged official links', () => {
      const html = renderToString(
        <div>{renderInlineContent('Visit [PM-KISAN Portal](https://pmkisan.gov.in) to register.')}</div>
      );
      expect(html).toContain('href="https://pmkisan.gov.in"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('Govt Portal'); // Official Govt Portal badge
      expect(html).toContain('PM-KISAN Portal');
    });

    it('converts authorized agency links with Authorized Agency badge', () => {
      const html = renderToString(
        <div>{renderInlineContent('Check guidelines at https://mudra.org.in and https://npscra.nsdl.co.in')}</div>
      );
      expect(html).toContain('Authorized Agency');
      expect(html).toContain('MUDRA Scheme Portal (mudra.org.in)');
      expect(html).toContain('Atal Pension Yojana Portal (PFRDA/NSDL-CRA)');
    });

    it('converts bare official URLs to friendly badged links', () => {
      const html = renderToString(
        <div>{renderInlineContent('Apply online at https://pmkisan.gov.in for benefits.')}</div>
      );
      expect(html).toContain('href="https://pmkisan.gov.in"');
      expect(html).toContain('Official PM-KISAN Portal (pmkisan.gov.in)');
      expect(html).toContain('Govt');
    });

    it('renders bold and inline code without raw markdown markers', () => {
      const html = renderToString(
        <div>{renderInlineContent('Receive **₹6,000** annually through `DBT` transfer.')}</div>
      );
      expect(html).toContain('<strong class="font-bold text-slate-900">₹6,000</strong>');
      expect(html).toContain('<code class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">DBT</code>');
      expect(html).not.toContain('**₹6,000**');
      expect(html).not.toContain('`DBT`');
    });
  });

  describe('Block Elements & Government Formatting', () => {
    it('renders headings cleanly at appropriate levels', () => {
      const markdown = `
### Required Application Documents
#### Verification Guidelines
      `;
      const html = renderToString(<CivicMarkdown content={markdown} />);
      expect(html).toContain('<h3');
      expect(html).toContain('Required Application Documents</h3>');
      expect(html).toContain('<h4');
      expect(html).toContain('Verification Guidelines</h4>');
      expect(html).not.toContain('###');
    });

    it('renders bullet lists with accessible visual indicators', () => {
      const markdown = `
* Aadhaar Card (linked with mobile)
* Land Ownership Record (RoR)
* Bank Account Passbook
      `;
      const html = renderToString(<CivicMarkdown content={markdown} />);
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Aadhaar Card (linked with mobile)');
      expect(html).toContain('Land Ownership Record (RoR)');
      expect(html).not.toContain('* Aadhaar');
    });

    it('renders numbered steps with step pills', () => {
      const markdown = `
1. Visit the official portal
2. Complete Aadhaar OTP verification
3. Submit landholding details
      `;
      const html = renderToString(<CivicMarkdown content={markdown} />);
      expect(html).toContain('<ol');
      expect(html).toContain('Visit the official portal');
      expect(html).toContain('Complete Aadhaar OTP verification');
      expect(html).toContain('1');
      expect(html).toContain('2');
      expect(html).toContain('3');
    });

    it('renders dividers cleanly', () => {
      const markdown = 'Section one\n\n---\n\nSection two';
      const html = renderToString(<CivicMarkdown content={markdown} />);
      expect(html).toContain('<hr');
      expect(html).toContain('Section one');
      expect(html).toContain('Section two');
    });

    it('renders privacy callouts with reassuring styling', () => {
      const markdown = '*Privacy Note: Never share your Aadhaar number or OTP in public chat.*';
      const html = renderToString(<CivicMarkdown content={markdown} />);
      expect(html).toContain('<aside');
      expect(html).toContain('Never share your Aadhaar number');
    });
  });

  describe('Security & XSS Prevention', () => {
    it('never evaluates raw HTML tags or script injection', () => {
      const malicious = '<script>alert("hacked")</script><img src="x" onerror="alert(1)" />';
      const html = renderToString(<CivicMarkdown content={malicious} />);
      // Should not contain executable script or unescaped img tags
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src="x"');
      // Escaped safely
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('Tamil Unicode & Mixed-Script Excellence', () => {
    it('renders natural Tamil welfare text, Rupee amounts, and official links', () => {
      const tamilMd = `
### பிரதம மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)

விவசாயிகளுக்கு ஆண்டுக்கு **₹6,000** நேரடி வங்கி பரிமாற்றம் (DBT) மூலம் வழங்கப்படுகிறது.

* ஆதார் அட்டை
* நில உரிமை ஆவணம் (பட்டா / சிட்டா)
* வங்கி கணக்கு புத்தகம்

விண்ணப்பிக்க [அதிகாரப்பூர்வ போர்டல்](https://pmkisan.gov.in) அணுகவும்.
      `;

      const html = renderToString(<CivicMarkdown content={tamilMd} />);

      expect(html).toContain('பிரதம மந்திரி கிசான் சம்மான் நிதி');
      expect(html).toContain('ஆண்டுக்கு');
      expect(html).toContain('₹6,000');
      expect(html).toContain('நேரடி வங்கி பரிமாற்றம்');
      expect(html).toContain('பட்டா / சிட்டா');
      expect(html).toContain('https://pmkisan.gov.in');
      expect(html).toContain('Govt');
      expect(html).not.toContain('###');
      expect(html).not.toContain('**₹6,000**');
    });
  });
});
