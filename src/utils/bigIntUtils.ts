// Utility functions for handling BigInt serialization in API responses

/**
 * Recursively converts BigInt values to Numbers in an object or array
 * This is necessary because JSON.stringify() cannot serialize BigInt values
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Safely converts a BigInt to a Number, handling edge cases
 */
export function bigIntToNumber(value: bigint | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // Check if the BigInt is within safe integer range
  if (value > Number.MAX_SAFE_INTEGER) {
    console.warn('BigInt value exceeds MAX_SAFE_INTEGER, precision may be lost');
  }
  
  return Number(value);
}

/**
 * Safely converts a BigInt to a string for display purposes
 */
export function bigIntToString(value: bigint | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  return value.toString();
}

/**
 * Formats a number (converted from BigInt) for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Safely handles Prisma aggregate results that may contain BigInt values
 */
export function handlePrismaAggregate<T extends Record<string, any>>(
  result: T,
  bigIntFields: string[] = ['viewCount', 'watchTime', 'fileSize']
): T {
  const processed = { ...result };
  
  for (const field of bigIntFields) {
    if (processed[field] && typeof processed[field] === 'bigint') {
      processed[field] = Number(processed[field]);
    }
  }
  
  return processed;
}

/**
 * Creates a safe API response that handles BigInt serialization
 */
export function createSafeResponse<T>(data: T): T {
  return serializeBigInt(data);
}
