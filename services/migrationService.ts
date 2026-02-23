import protobuf from 'protobufjs';
import { Buffer } from 'buffer';
import { Token } from '../types';

const RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(buffer: Uint8Array): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += RFC4648[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += RFC4648[(value << (5 - bits)) & 31];
    }
    return output;
}

export function decodeBase32(input: string): Uint8Array {
    const cleanedInput = input.toUpperCase().replace(/=+$/, '');
    const length = cleanedInput.length;
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(((length * 5) / 8) | 0);

    for (let i = 0; i < length; i++) {
        value = (value << 5) | RFC4648.indexOf(cleanedInput[i]);
        bits += 5;
        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return output;
}

const root = protobuf.Root.fromJSON({
    nested: {
        MigrationPayload: {
            fields: {
                otpParameters: { rule: "repeated", type: "OtpParameters", id: 1 },
                version: { type: "int32", id: 2 },
                batchSize: { type: "int32", id: 3 },
                batchIndex: { type: "int32", id: 4 },
                batchId: { type: "int32", id: 5 }
            },
            nested: {
                Algorithm: {
                    values: {
                        ALGORITHM_UNSPECIFIED: 0,
                        ALGORITHM_SHA1: 1,
                        ALGORITHM_SHA256: 2,
                        ALGORITHM_SHA512: 3,
                        ALGORITHM_MD5: 4
                    }
                },
                DigitCount: {
                    values: {
                        DIGIT_COUNT_UNSPECIFIED: 0,
                        DIGIT_COUNT_SIX: 1,
                        DIGIT_COUNT_EIGHT: 2
                    }
                },
                OtpType: {
                    values: {
                        OTP_TYPE_UNSPECIFIED: 0,
                        OTP_TYPE_HOTP: 1,
                        OTP_TYPE_TOTP: 2
                    }
                },
                OtpParameters: {
                    fields: {
                        secret: { type: "bytes", id: 1 },
                        name: { type: "string", id: 2 },
                        issuer: { type: "string", id: 3 },
                        algorithm: { type: "Algorithm", id: 4 },
                        digits: { type: "DigitCount", id: 5 },
                        type: { type: "OtpType", id: 6 },
                        counter: { type: "int64", id: 7 }
                    }
                }
            }
        }
    }
});

const MigrationPayload = root.lookupType("MigrationPayload");

export function parseMigrationUri(uri: string): Token[] {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth-migration:') {
        throw new Error('Invalid protocol');
    }
    const data = url.searchParams.get('data');
    if (!data) {
        throw new Error('No data parameter');
    }

    const buffer = Buffer.from(decodeURIComponent(data), 'base64');
    const message = MigrationPayload.decode(buffer) as any;

    const tokens: Token[] = [];
    if (message.otpParameters) {
        for (const otp of message.otpParameters) {
            if (otp.type !== 2 && otp.type !== 0) { // Support TOTP (2) and UNSPECIFIED (0, which is usually TOTP)
                continue;
            }
            const secretBase32 = encodeBase32(otp.secret);

            let issuer = otp.issuer || '';
            let account = otp.name || '';

            // If issuer is empty but account contains a colon, split it
            // e.g. "Github: Hill-1024" -> issuer="Github", account="Hill-1024"
            if (!issuer && account.includes(':')) {
                const parts = account.split(':');
                issuer = parts[0].trim();
                account = parts.slice(1).join(':').trim();
            }

            tokens.push({
                id: Math.random().toString(36).substr(2, 9),
                issuer: issuer,
                account: account,
                secret: secretBase32,
                code: '000000',
                icon: 'key',
                period: 30, // Google Authenticator defaults to 30
                remaining: 30
            });
        }
    }
    return tokens;
}

export function generateMigrationUri(tokens: Token[]): string {
    const otpParameters = tokens.map(token => {
        return {
            secret: decodeBase32(token.secret),
            name: token.account,
            issuer: token.issuer,
            algorithm: 1, // SHA1
            digits: 1, // SIX
            type: 2, // TOTP
            counter: 0
        };
    });

    const payload = {
        otpParameters,
        version: 1,
        batchSize: 1,
        batchIndex: 0,
        batchId: Math.floor(Math.random() * 2147483647)
    };

    const errMsg = MigrationPayload.verify(payload);
    if (errMsg) throw Error(errMsg);

    const message = MigrationPayload.create(payload);
    const buffer = MigrationPayload.encode(message).finish();
    const base64Data = Buffer.from(buffer).toString('base64');

    return `otpauth-migration://offline?data=${encodeURIComponent(base64Data)}`;
}
