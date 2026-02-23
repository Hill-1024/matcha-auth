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

// --- Protobuf Decoder for Google Authenticator Migration ---

function decodeVarint(buffer: Uint8Array, offset: number): { value: number, length: number } {
    let result = 0;
    let shift = 0;
    let length = 0;
    while (true) {
        if (offset + length >= buffer.length) break;
        const byte = buffer[offset + length];
        result |= (byte & 0x7f) << shift;
        shift += 7;
        length++;
        if ((byte & 0x80) === 0) {
            break;
        }
    }
    return { value: result, length };
}

function decodeProtobuf(buffer: Uint8Array) {
    let offset = 0;
    const fields = [];
    while (offset < buffer.length) {
        const { value: tag, length: tagLength } = decodeVarint(buffer, offset);
        offset += tagLength;
        const fieldNumber = tag >> 3;
        const wireType = tag & 0x07;

        if (wireType === 0) {
            const { value, length } = decodeVarint(buffer, offset);
            offset += length;
            fields.push({ fieldNumber, type: 'varint', value });
        } else if (wireType === 2) {
            const { value: length, length: lengthLength } = decodeVarint(buffer, offset);
            offset += lengthLength;
            const value = buffer.slice(offset, offset + length);
            offset += length;
            fields.push({ fieldNumber, type: 'bytes', value });
        } else if (wireType === 1) {
            offset += 8;
        } else if (wireType === 5) {
            offset += 4;
        } else {
            // Skip unknown wire types by throwing or breaking
            break;
        }
    }
    return fields;
}

function bufferToBase32(buffer: Uint8Array): string {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += base32chars[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += base32chars[(value << (5 - bits)) & 31];
    }
    return output;
}

function decodeBase64(str: string) {
    let safeStr = str.replace(/-/g, '+').replace(/_/g, '/');
    while (safeStr.length % 4) {
        safeStr += '=';
    }
    const binaryString = atob(safeStr);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i);
    }
    return buffer;
}

// Parse otpauth:// URIs (from QR codes)
export const parseOtpauthUri = (uri: string): Array<Partial<Token>> => {
    try {
        if (uri.startsWith('otpauth-migration://')) {
            const url = new URL(uri);
            const data = url.searchParams.get('data');
            if (!data) return [];

            const buffer = decodeBase64(data);
            const tokens: Partial<Token>[] = [];
            const payloadFields = decodeProtobuf(buffer);

            for (const field of payloadFields) {
                if (field.fieldNumber === 1 && field.type === 'bytes') {
                    const otpFields = decodeProtobuf(field.value as Uint8Array);
                    let secret = '';
                    let name = '';
                    let issuer = '';

                    for (const otpField of otpFields) {
                        if (otpField.fieldNumber === 1 && otpField.type === 'bytes') {
                            secret = bufferToBase32(otpField.value as Uint8Array);
                        } else if (otpField.fieldNumber === 2 && otpField.type === 'bytes') {
                            name = new TextDecoder().decode(otpField.value as Uint8Array);
                        } else if (otpField.fieldNumber === 3 && otpField.type === 'bytes') {
                            issuer = new TextDecoder().decode(otpField.value as Uint8Array);
                        }
                    }

                    if (secret) {
                        tokens.push({
                            issuer: issuer || 'Unknown',
                            account: name || 'Account',
                            secret: secret,
                            period: 30,
                            icon: 'key'
                        });
                    }
                }
            }
            return tokens;
        }

        const parsed = OTPAuth.URI.parse(uri);

        if (parsed instanceof OTPAuth.TOTP) {
            return [{
                issuer: parsed.issuer || 'Unknown',
                account: parsed.label || 'Account',
                secret: parsed.secret.base32,
                period: parsed.period,
                icon: 'key' // Default
            }];
        }
        return [];
    } catch (e) {
        console.error("Error parsing URI", e);
        return [];
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

// Generate otpauth-migration:// URI for batch export
export const generateMigrationUri = (tokens: Token[]): string => {
    // Simple Protobuf Encoder for MigrationPayload
    const encodeVarint = (value: number): number[] => {
        const bytes = [];
        while (value > 127) {
            bytes.push((value & 127) | 128);
            value >>>= 7;
        }
        bytes.push(value);
        return bytes;
    };

    const encodeString = (str: string): number[] => {
        const bytes = new TextEncoder().encode(str);
        return [...encodeVarint(bytes.length), ...Array.from(bytes)];
    };

    const encodeBytes = (bytes: Uint8Array): number[] => {
        return [...encodeVarint(bytes.length), ...Array.from(bytes)];
    };

    const base32ToBuffer = (base32: string): Uint8Array => {
        const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let index = 0;
        const output = new Uint8Array(Math.ceil(base32.length * 5 / 8));
        for (let i = 0; i < base32.length; i++) {
            const val = base32chars.indexOf(base32[i].toUpperCase());
            if (val === -1) continue;
            value = (value << 5) | val;
            bits += 5;
            if (bits >= 8) {
                output[index++] = (value >>> (bits - 8)) & 255;
                bits -= 8;
            }
        }
        return output.slice(0, index);
    };

    let payloadBytes: number[] = [];

    for (const token of tokens) {
        let otpParamBytes: number[] = [];

        // 1: secret (bytes)
        const secretBuffer = base32ToBuffer(token.secret);
        otpParamBytes.push((1 << 3) | 2); // tag
        otpParamBytes.push(...encodeBytes(secretBuffer));

        // 2: name (string)
        if (token.account) {
            otpParamBytes.push((2 << 3) | 2);
            otpParamBytes.push(...encodeString(token.account));
        }

        // 3: issuer (string)
        if (token.issuer) {
            otpParamBytes.push((3 << 3) | 2);
            otpParamBytes.push(...encodeString(token.issuer));
        }

        // 4: algorithm (varint) - SHA1 = 1
        otpParamBytes.push((4 << 3) | 0);
        otpParamBytes.push(...encodeVarint(1));

        // 5: digits (varint) - 6 = 1
        otpParamBytes.push((5 << 3) | 0);
        otpParamBytes.push(...encodeVarint(1));

        // 6: type (varint) - TOTP = 2
        otpParamBytes.push((6 << 3) | 0);
        otpParamBytes.push(...encodeVarint(2));

        // Add otp_parameters to payload
        payloadBytes.push((1 << 3) | 2);
        payloadBytes.push(...encodeVarint(otpParamBytes.length));
        payloadBytes.push(...otpParamBytes);
    }

    // 2: version (varint) = 1
    payloadBytes.push((2 << 3) | 0);
    payloadBytes.push(...encodeVarint(1));

    // 3: batch_size (varint) = 1
    payloadBytes.push((3 << 3) | 0);
    payloadBytes.push(...encodeVarint(1));

    // 4: batch_index (varint) = 0
    payloadBytes.push((4 << 3) | 0);
    payloadBytes.push(...encodeVarint(0));

    // 5: batch_id (varint) = random
    payloadBytes.push((5 << 3) | 0);
    payloadBytes.push(...encodeVarint(Math.floor(Math.random() * 2147483647)));

    const binaryString = String.fromCharCode(...payloadBytes);
    const base64 = btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return `otpauth-migration://offline?data=${base64}`;
};