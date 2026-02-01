import * as OTPAuth from "otpauth";
import { Token } from "../types";

// Generate code and remaining time based on secret
export const generateTotpValues = (secret: string, period: number = 30) => {
  try {
    // Handle spaces in secret or missing padding
    const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
    
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
      period: period,
      digits: 6,
      algorithm: 'SHA1'
    });

    const code = totp.generate();
    
    // Calculate remaining seconds
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const remaining = period - (epoch % period);

    return { code, remaining };
  } catch (error) {
    console.error("Invalid Secret:", error);
    return { code: "ERROR", remaining: 0 };
  }
};

// Parse otpauth:// URIs (from QR codes)
export const parseOtpauthUri = (uri: string): Partial<Token> | null => {
  try {
    const parsed = OTPAuth.URI.parse(uri);
    
    if (parsed instanceof OTPAuth.TOTP) {
      return {
        issuer: parsed.issuer || 'Unknown',
        account: parsed.label || 'Account',
        secret: parsed.secret.base32,
        period: parsed.period,
        icon: 'key' // Default
      };
    }
    return null;
  } catch (e) {
    console.error("Error parsing URI", e);
    return null;
  }
};

// Generate otpauth:// URI for export
export const generateOtpauthUri = (token: Token): string => {
    const totp = new OTPAuth.TOTP({
        issuer: token.issuer,
        label: token.account,
        algorithm: 'SHA1',
        digits: 6,
        period: token.period,
        secret: OTPAuth.Secret.fromBase32(token.secret)
    });
    return totp.toString();
}