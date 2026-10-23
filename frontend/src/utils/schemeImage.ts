import { Scheme } from '../types';

export const DEFAULT_SCHEME_IMAGE = '/schemes/pm-kisan.jpg';

/**
 * Returns a verified, high-quality local scheme image corresponding to the
 * scheme ID or thematic category, avoiding external dependencies or missing assets.
 */
export function getSchemeImage(scheme: Partial<Scheme> | null | undefined): string {
  if (!scheme) return DEFAULT_SCHEME_IMAGE;
  if (scheme.image_url) return scheme.image_url;

  const id = (scheme.id || '').toLowerCase().trim();

  // 1. Direct ID matching
  if (id === 'pm-kisan' || id.includes('kisan')) {
    return '/schemes/pm-kisan.jpg';
  }
  if (
    id === 'ab-pmjay' ||
    id === 'pm-jay' ||
    id.includes('ayushman') ||
    id.includes('pmjay') ||
    id.includes('jan-arogya')
  ) {
    return '/schemes/ab-pmjay.jpg';
  }
  if (id === 'pm-svanidhi' || id.includes('svanidhi') || id.includes('vendor')) {
    return '/schemes/pm-svanidhi.jpg';
  }
  if (
    id === 'nsp-post-matric' ||
    id.includes('scholarship') ||
    id.includes('post-matric') ||
    id.includes('nsp')
  ) {
    return '/schemes/nsp-post-matric.jpg';
  }
  if (id === 'pmay-g' || id.includes('pmay-g') || id.includes('gramin')) {
    return '/schemes/pmay-g.jpg';
  }
  if (id === 'pmay-u' || id.includes('pmay-u') || id.includes('urban') || id.includes('awas')) {
    return '/schemes/pmay-g-house.jpg';
  }
  if (id === 'pm-vishwakarma' || id.includes('vishwakarma') || id.includes('artisan')) {
    return '/schemes/pm-vishwakarma.jpg';
  }
  if (id === 'pm-mudra-yojana' || id.includes('mudra')) {
    return '/schemes/pm-mudra-yojana.jpg';
  }
  if (
    id === 'atal-pension-yojana' ||
    id.includes('atal-pension') ||
    id.includes('apy') ||
    id.includes('pension')
  ) {
    return '/schemes/atal-pension-yojana.jpg';
  }

  // 2. Category / thematic matching fallback
  const cat = (scheme.category || '').toLowerCase();
  if (cat.includes('agri') || cat.includes('rural') || cat.includes('farm')) {
    return '/schemes/pm-kisan.jpg';
  }
  if (cat.includes('health') || cat.includes('well') || cat.includes('medic') || cat.includes('arogya')) {
    return '/schemes/ab-pmjay.jpg';
  }
  if (cat.includes('hous') || cat.includes('shelter') || cat.includes('awas') || cat.includes('infra')) {
    return '/schemes/pmay-g.jpg';
  }
  if (cat.includes('edu') || cat.includes('skill') || cat.includes('learn') || cat.includes('student')) {
    return '/schemes/nsp-post-matric.jpg';
  }
  if (cat.includes('bank') || cat.includes('financ') || cat.includes('insur') || cat.includes('credit')) {
    return '/schemes/pm-mudra-yojana.jpg';
  }
  if (cat.includes('social') || cat.includes('pension') || cat.includes('senior') || cat.includes('welfare')) {
    return '/schemes/atal-pension-yojana.jpg';
  }
  if (cat.includes('vendor') || cat.includes('livelihood') || cat.includes('business') || cat.includes('artisan')) {
    return '/schemes/pm-svanidhi.jpg';
  }

  return DEFAULT_SCHEME_IMAGE;
}
