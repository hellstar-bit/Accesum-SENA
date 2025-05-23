// src/auth/jwt.config.ts
import * as dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'accesum_secret_key',
  expiresIn: process.env.JWT_EXPIRATION || '1d',
};