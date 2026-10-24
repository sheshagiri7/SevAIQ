import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { AccessibilityProvider, useAccessibility } from '../context/AccessibilityContext';

describe('SevAIQ App and Context Providers', () => {
  it('useLanguage does not throw even outside LanguageProvider', () => {
    const TestComponent = () => {
      const { language, t } = useLanguage();
      return React.createElement('div', null, `${language}: ${t.header.dashboard}`);
    };

    expect(() => renderToString(React.createElement(TestComponent))).not.toThrow();
  });

  it('useAccessibility does not throw even outside AccessibilityProvider', () => {
    const TestComponent = () => {
      const { settings, activeCount } = useAccessibility();
      return React.createElement('div', null, `${settings.textSize} - ${activeCount}`);
    };

    expect(() => renderToString(React.createElement(TestComponent))).not.toThrow();
  });

  it('renders the complete App component tree without errors', () => {
    const tree = React.createElement(
      LanguageProvider,
      null,
      React.createElement(
        AccessibilityProvider,
        null,
        React.createElement(App)
      )
    );

    const html = renderToString(tree);
    expect(html).toContain('SevAIQ');
    expect(html).toContain('Dashboard');
  });

  it('does not render the floating accessibility button, badge, or tooltip in App', () => {
    const tree = React.createElement(
      LanguageProvider,
      null,
      React.createElement(
        AccessibilityProvider,
        null,
        React.createElement(App)
      )
    );

    const html = renderToString(tree);
    expect(html).not.toContain('fixed left-0 top-[38%]');
    expect(html).not.toContain('from-[#6342E8]');
    expect(html).not.toContain('Accessibility options');
    expect(html).not.toContain('அணுகல்தன்மை விருப்பங்கள்');
    expect(html).not.toContain('सुलभता विकल्प');
  });
});
