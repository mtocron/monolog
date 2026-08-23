import { randomBytes } from 'node:crypto';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

function encode(value: bigint, length: number): string {
  let result = '';
  let remaining = value;
  for (let index = 0; index < length; index += 1) {
    result = ENCODING[Number(remaining & 31n)] + result;
    remaining >>= 5n;
  }
  return result;
}

export function createUlid(now = Date.now()): string {
  const timestamp = encode(BigInt(now), 10);
  const random = encode(BigInt(`0x${randomBytes(10).toString('hex')}`), 16);
  return `${timestamp}${random}`;
}

export function isUlid(value: string): boolean {
  return ULID_PATTERN.test(value);
}
