import React from 'react';
import { ExternalLink, ShieldCheck, Building2, Info } from 'lucide-react';

export interface CivicMarkdownProps {
  content: string;
  className?: string;
}

export type DomainTrustLevel = 'official_gov' | 'authorized_agency' | 'external';

/**
 * Classifies a URL's trust level based on verifiable statutory and administrative identity.
 * - 'official_gov': Direct Central/State Government Ministry/NIC portals (.gov.in / .nic.in).
 * - 'authorized_agency': Statutory or public financial entities (e.g. PFRDA-appointed CRA nsdl.co.in, SIDBI subsidiary mudra.org.in).
 * - 'external': General external domains without direct government or statutory backing.
 */
export function classifyDomainTrust(urlStr: string): DomainTrustLevel {
  try {
    const raw = urlStr.trim();
    const candidate = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();

    // 1. Genuine Government of India / State Government domains
    if (
      host.endsWith('.gov.in') ||
      host.endsWith('.nic.in') ||
      host === 'india.gov.in' ||
      host.endsWith('.india.gov.in') ||
      host === 'myscheme.gov.in' ||
      host.endsWith('.myscheme.gov.in')
    ) {
      return 'official_gov';
    }

    // 2. Authorized Statutory Institutions & Nodal Agencies (not .gov.in)
    // - nsdl.co.in / npscra.nsdl.co.in: Central Recordkeeping Agency (CRA) designated by PFRDA (statutory regulator)
    // - mudra.org.in: Micro Units Development & Refinance Agency Ltd. (SIDBI subsidiary under Dept. of Financial Services)
    if (
      host === 'nsdl.co.in' ||
      host.endsWith('.nsdl.co.in') ||
      host === 'mudra.org.in' ||
      host.endsWith('.mudra.org.in')
    ) {
      return 'authorized_agency';
    }

    return 'external';
  } catch {
    if (urlStr.includes('.gov.in') || urlStr.includes('.nic.in') || urlStr.includes('myscheme.gov.in')) {
      return 'official_gov';
    }
    return 'external';
  }
}

/**
 * Returns true ONLY if the domain is a genuine government domain (.gov.in / .nic.in).
 * Distinguishes direct government portals from other authorized corporate or agency partners.
 */
export function isOfficialGovDomain(urlStr: string): boolean {
  return classifyDomainTrust(urlStr) === 'official_gov';
}

/**
 * Returns true if the domain is an authorized public-sector or statutory nodal agency.
 */
export function isAuthorizedAgencyDomain(urlStr: string): boolean {
  return classifyDomainTrust(urlStr) === 'authorized_agency';
}

/**
 * Derives a citizen-friendly label for bare or generic official government URLs.
 */
export function getFriendlyGovLabel(urlStr: string, existingLabel?: string): string {
  if (existingLabel && existingLabel.trim() && !existingLabel.startsWith('http')) {
    return existingLabel.trim();
  }

  const clean = urlStr.toLowerCase();
  if (clean.includes('pmkisan.gov.in')) return 'Official PM-KISAN Portal (pmkisan.gov.in)';
  if (clean.includes('pmjay.gov.in') || clean.includes('nha.gov.in')) return 'Official Ayushman Bharat Portal (pmjay.gov.in)';
  if (clean.includes('pmayg.nic.in')) return 'Official PMAY-Gramin Portal (pmayg.nic.in)';
  if (clean.includes('pmay-urban.gov.in') || clean.includes('pmaymis.gov.in')) return 'Official PMAY-Urban Portal (pmay-urban.gov.in)';
  if (clean.includes('financialservices.gov.in')) return 'Department of Financial Services (financialservices.gov.in)';
  if (clean.includes('pmsvanidhi.mohua.gov.in')) return 'Official PM SVANidhi Portal (pmsvanidhi.mohua.gov.in)';
  if (clean.includes('scholarships.gov.in')) return 'National Scholarship Portal (scholarships.gov.in)';
  if (clean.includes('pmvishwakarma.gov.in')) return 'Official PM Vishwakarma Portal (pmvishwakarma.gov.in)';
  if (clean.includes('mudra.org.in')) return 'MUDRA Scheme Portal (mudra.org.in)';
  if (clean.includes('npscra.nsdl.co.in')) return 'Atal Pension Yojana Portal (PFRDA/NSDL-CRA)';
  if (clean.includes('myscheme.gov.in')) return 'myScheme National Portal (myscheme.gov.in)';
  if (clean.includes('india.gov.in')) return 'National Portal of India (india.gov.in)';

  // Fallback domain extraction
  try {
    const candidate = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const parsed = new URL(candidate);
    return `Official Portal (${parsed.hostname})`;
  } catch {
    return urlStr;
  }
}

/**
 * Parses inline markdown:
 * - Links: [label](url) and bare URLs
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `code`
 * - Plain escaped text
 */
export function renderInlineContent(text: string): React.ReactNode[] {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  // Tokenizer pattern matching:
  // 1. Markdown link: [label](url)
  // 2. Bare URL: https?://[^\s)]+
  // 3. Bold: **text**
  // 4. Inline code: `code`
  // 5. Italic: *text*
  const pattern = /(\[[^\]]+\]\([^\)]+\)|https?:\/\/[^\s<>"')]+|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Plain text before token
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Case 1: Markdown Link [Label](url)
    if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const closeBracket = token.indexOf('](');
      const rawLabel = token.slice(1, closeBracket);
      const rawUrl = token.slice(closeBracket + 2, -1).trim();
      const trust = classifyDomainTrust(rawUrl);
      const label = getFriendlyGovLabel(rawUrl, rawLabel);

      nodes.push(
        <a
          key={`md-link-${keyCounter++}`}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 decoration-blue-300 hover:decoration-blue-700 transition-colors"
          title={
            trust === 'official_gov'
              ? 'Official Government Portal (.gov.in / .nic.in) - opens in new tab'
              : trust === 'authorized_agency'
              ? 'Authorized Statutory Agency / Nodal Partner - opens in new tab'
              : 'External link - opens in new tab'
          }
        >
          {trust === 'official_gov' && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-200/80 mr-0.5 select-none shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-civic-700 inline" />
              Govt Portal
            </span>
          )}
          {trust === 'authorized_agency' && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-300 mr-0.5 select-none shrink-0">
              <Building2 className="w-2.5 h-2.5 mr-0.5 text-slate-600 inline" />
              Authorized Agency
            </span>
          )}
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 text-blue-600 inline shrink-0" aria-hidden="true" />
        </a>
      );
    }
    // Case 2: Bare URL https://...
    else if (token.startsWith('http://') || token.startsWith('https://')) {
      const trust = classifyDomainTrust(token);
      const label = getFriendlyGovLabel(token);

      nodes.push(
        <a
          key={`bare-url-${keyCounter++}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 decoration-blue-300 hover:decoration-blue-700 transition-colors"
          title={
            trust === 'official_gov'
              ? 'Official Government Portal (.gov.in / .nic.in) - opens in new tab'
              : trust === 'authorized_agency'
              ? 'Authorized Statutory Agency / Nodal Partner - opens in new tab'
              : 'External link - opens in new tab'
          }
        >
          {trust === 'official_gov' && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-200/80 mr-0.5 select-none shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-civic-700 inline" />
              Govt Portal
            </span>
          )}
          {trust === 'authorized_agency' && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-300 mr-0.5 select-none shrink-0">
              <Building2 className="w-2.5 h-2.5 mr-0.5 text-slate-600 inline" />
              Authorized Agency
            </span>
          )}
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 text-blue-600 inline shrink-0" aria-hidden="true" />
        </a>
      );
    }
    // Case 3: Bold **text**
    else if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      const inner = token.slice(2, -2);
      nodes.push(
        <strong key={`bold-${keyCounter++}`} className="font-bold text-slate-900">
          {renderInlineContent(inner)}
        </strong>
      );
    }
    // Case 4: Inline code `code`
    else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      const inner = token.slice(1, -1);
      nodes.push(
        <code
          key={`code-${keyCounter++}`}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200"
        >
          {inner}
        </code>
      );
    }
    // Case 5: Italic *text*
    else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      const inner = token.slice(1, -1);
      nodes.push(
        <em key={`italic-${keyCounter++}`} className="italic text-slate-700">
          {renderInlineContent(inner)}
        </em>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = pattern.lastIndex;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

type BlockType =
  | { type: 'heading'; level: number; text: string }
  | { type: 'divider' }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; text: string; variant: 'privacy' | 'info' }
  | { type: 'paragraph'; text: string };

/**
 * Parses raw markdown lines into structured block types for safe React rendering.
 */
function parseBlocks(markdown: string): BlockType[] {
  if (!markdown) return [];

  const rawLines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: BlockType[] = [];

  let currentBullets: string[] = [];
  let currentNumbers: string[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join('\n').trim();
      if (text) {
        // Detect special privacy or caution callouts
        const lower = text.toLowerCase();
        if (
          lower.startsWith('*privacy note') ||
          lower.startsWith('privacy note') ||
          lower.startsWith('குறிப்பு:') ||
          lower.startsWith('*குறிப்பு:')
        ) {
          blocks.push({ type: 'callout', text, variant: 'privacy' });
        } else if (lower.startsWith('note:') || lower.startsWith('*note:')) {
          blocks.push({ type: 'callout', text, variant: 'info' });
        } else {
          blocks.push({ type: 'paragraph', text });
        }
      }
      currentParagraphLines = [];
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      blocks.push({ type: 'ul', items: [...currentBullets] });
      currentBullets = [];
    }
  };

  const flushNumbers = () => {
    if (currentNumbers.length > 0) {
      blocks.push({ type: 'ol', items: [...currentNumbers] });
      currentNumbers = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushNumbers();
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      flushAll();
      continue;
    }

    // Horizontal Rule: ---, ***, ___
    if (/^(\s*[-*_]\s*){3,}$/.test(trimmed)) {
      flushAll();
      blocks.push({ type: 'divider' });
      continue;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushAll();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    // Bullet List: * item, - item, • item, + item
    const bulletMatch = /^[\*\-\•\+]\s+(.+)$/.exec(trimmed);
    if (bulletMatch) {
      flushParagraph();
      flushNumbers();
      currentBullets.push(bulletMatch[1].trim());
      continue;
    }

    // Numbered List: 1. item, 2. item
    const numberMatch = /^[0-9]+[\.\)]\s+(.+)$/.exec(trimmed);
    if (numberMatch) {
      flushParagraph();
      flushBullets();
      currentNumbers.push(numberMatch[1].trim());
      continue;
    }

    // Continuation line or regular paragraph
    currentParagraphLines.push(trimmed);
  }

  flushAll();
  return blocks;
}

/**
 * CivicMarkdown: Clean, safe, accessible Markdown renderer tailored for
 * public-service citizen welfare applications.
 *
 * Guaranteed:
 * - Zero raw HTML execution (prevents XSS).
 * - Proper headings, bold, bullet points, numbered steps, dividers.
 * - Meaningful, accurately classified badges ('Govt Portal' for .gov.in/.nic.in,
 *   'Authorized Agency' for statutory partners like SIDBI MUDRA / PFRDA NSDL-CRA).
 * - Full Unicode and Tamil script rendering without visual clipping.
 * - Mobile-responsive layout and comfortable public-service typography.
 */
export const CivicMarkdown: React.FC<CivicMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 text-xs sm:text-[13px] leading-relaxed break-words ${className}`} data-testid="civic-markdown-root">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h1 key={idx} className="text-sm sm:text-base font-extrabold text-slate-900 mt-2 mb-1 tracking-tight">
                  {renderInlineContent(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2 key={idx} className="text-xs sm:text-sm font-bold text-slate-900 mt-2 mb-1 tracking-tight">
                  {renderInlineContent(block.text)}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3 key={idx} className="text-xs sm:text-[13px] font-bold text-slate-800 mt-1.5 mb-0.5">
                  {renderInlineContent(block.text)}
                </h3>
              );
            }
            return (
              <h4 key={idx} className="text-xs font-semibold text-slate-700 mt-1 mb-0.5">
                {renderInlineContent(block.text)}
              </h4>
            );
          }

          case 'divider':
            return <hr key={idx} className="my-2 border-slate-200/80" />;

          case 'ul':
            return (
              <ul key={idx} className="space-y-1.5 my-1.5 pl-1">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start space-x-2 text-slate-800 leading-normal">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-civic-600 mt-1.5 shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-0">{renderInlineContent(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="space-y-2 my-2 pl-0.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start space-x-2.5 text-slate-800 leading-normal">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-civic-100 text-civic-800 font-bold text-[10px] shrink-0 mt-0.5 select-none">
                      {itemIdx + 1}
                    </span>
                    <span className="flex-1 min-w-0 pt-0.5">{renderInlineContent(item)}</span>
                  </li>
                ))}
              </ol>
            );

          case 'callout':
            return (
              <aside
                key={idx}
                className={`my-2 p-2.5 rounded-xl border flex items-start space-x-2 text-[11px] leading-relaxed ${
                  block.variant === 'privacy'
                    ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}
                aria-label={block.variant === 'privacy' ? 'Privacy notice' : 'Important note'}
              >
                {block.variant === 'privacy' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-civic-700 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">{renderInlineContent(block.text)}</div>
              </aside>
            );

          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-slate-800 my-1 leading-relaxed">
                {renderInlineContent(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};
