export const API_HOSTNAME = 'thegaterealestae.runasp.net';
export const API_DOMAIN = `https://${API_HOSTNAME}`;

export const API_BASE_URL = typeof window === 'undefined' 
  ? API_DOMAIN 
  : '/backend';

// We can define other API-related configurations here in the future
// such as default headers, timeouts, or specific endpoint paths.
