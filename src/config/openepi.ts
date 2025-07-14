/**
 * Configuration pour l'API OpenEPI
 */

import dotenv from 'dotenv';

// S'assurer que les variables d'environnement sont chargées
dotenv.config();

export interface OpenEPIConfig {
  baseURL: string;
  authURL: string;
  timeout: number;
  clientId: string;
  clientSecret: string;
  headers: {
    Accept: string;
    'Content-Type': string;
    'User-Agent': string;
  };
}

export const openEPIConfig: OpenEPIConfig = {
  baseURL: process.env.OPENEPI_BASE_URL || 'https://api.openepi.io',
  authURL: process.env.OPENEPI_AUTH_URL || 'https://auth.openepi.io/realms/openepi/protocol/openid-connect/token',
  timeout: parseInt(process.env.OPENEPI_TIMEOUT || '30000'),
  clientId: process.env.OPENEPI_CLIENT_ID || '',
  clientSecret: process.env.OPENEPI_CLIENT_SECRET || '',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'OpenEPI-NodeJS-Client/1.0'
  }
};

export const cropHealthConfig = {
  baseURL: `${openEPIConfig.baseURL}/crop-health`,
  timeout: openEPIConfig.timeout
};

export const weatherConfig = {
  baseURL: `${openEPIConfig.baseURL}/weather`,
  timeout: openEPIConfig.timeout
};
