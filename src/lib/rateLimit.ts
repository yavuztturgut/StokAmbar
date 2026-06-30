import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRandomToken, hashToken } from "@/lib/auth";
import { extractRequestToken } from "@/lib/authMiddleware";

export const ANON_DEVICE_COOKIE_NAME = "anon_device_id";

type RateLimitScope =
  | "auth:login"
  | "auth:register"
  | "auth:forgot-password"
  | "auth:reset-password"
  | "auth:select-company"
  | "auth:switch-account"
  | "auth:change-password"
  | "auth:profile-update"
  | "accounts:write"
  | "ingredients:write"
  | "transactions:create"
  | "stock-counts:create";

interface RateLimitPolicy {
  scope: RateLimitScope;
  maxRequests: number;
  windowMs: number;
}

interface PreAuthInput {
  scope: RateLimitScope;
  request: NextRequest;
}

interface PostAuthInput {
  scope: RateLimitScope;
  request: NextRequest;
}

interface AllowResult {
  allowed: true;
  anonDeviceId: string | null;
  headers: Record<string, string>;
}

interface BucketState {
  count: number;
  windowStart: Date;
  windowEnd: Date;
  lastSeenAt: Date;
}

type RateLimitPrismaClient = typeof prisma & {
  rateLimitBucket?: typeof prisma.rateLimitBucket;
};

const globalRateLimitState = globalThis as typeof globalThis & {
  __stokTakipRateLimitBuckets?: Map<string, BucketState>;
};

const memoryBuckets =
  globalRateLimitState.__stokTakipRateLimitBuckets ??
  (globalRateLimitState.__stokTakipRateLimitBuckets = new Map<string, BucketState>());

const RATE_LIMIT_POLICIES: Record<RateLimitScope, RateLimitPolicy> = {
  "auth:login": { scope: "auth:login", maxRequests: 12, windowMs: 15 * 60 * 1000 },
  "auth:register": { scope: "auth:register", maxRequests: 8, windowMs: 60 * 60 * 1000 },
  "auth:forgot-password": { scope: "auth:forgot-password", maxRequests: 8, windowMs: 60 * 60 * 1000 },
  "auth:reset-password": { scope: "auth:reset-password", maxRequests: 10, windowMs: 60 * 60 * 1000 },
  "auth:select-company": { scope: "auth:select-company", maxRequests: 20, windowMs: 15 * 60 * 1000 },
  "auth:switch-account": { scope: "auth:switch-account", maxRequests: 30, windowMs: 15 * 60 * 1000 },
  "auth:change-password": { scope: "auth:change-password", maxRequests: 10, windowMs: 15 * 60 * 1000 },
  "auth:profile-update": { scope: "auth:profile-update", maxRequests: 30, windowMs: 15 * 60 * 1000 },
  "accounts:write": { scope: "accounts:write", maxRequests: 30, windowMs: 15 * 60 * 1000 },
  "ingredients:write": { scope: "ingredients:write", maxRequests: 60, windowMs: 15 * 60 * 1000 },
  "transactions:create": { scope: "transactions:create", maxRequests: 120, windowMs: 15 * 60 * 1000 },
  "stock-counts:create": { scope: "stock-counts:create", maxRequests: 20, windowMs: 15 * 60 * 1000 },
};

const RATE_LIMIT_DIRECT_IP_FALLBACK = "local-client";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

const getDirectClientIp = (request: NextRequest) => {
  const directIp = (request as NextRequest & { ip?: string | null }).ip;
  if (directIp?.trim()) {
    return directIp.trim();
  }

  return RATE_LIMIT_DIRECT_IP_FALLBACK;
};

export const resolveRateLimitIp = (request: NextRequest) => {
  if (!TRUST_PROXY) {
    return getDirectClientIp(request);
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [firstIp] = forwarded.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  return getDirectClientIp(request);
};

const getOrCreateAnonDeviceId = (request: NextRequest) =>
  request.cookies.get(ANON_DEVICE_COOKIE_NAME)?.value || createRandomToken(16);

const getHeaderValues = (bucket: BucketState, policy: RateLimitPolicy) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.windowEnd.getTime() - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(policy.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(0, policy.maxRequests - bucket.count)),
    "X-RateLimit-Reset": String(Math.ceil(bucket.windowEnd.getTime() / 1000)),
    "Retry-After": String(retryAfterSeconds),
  };
};

const applyAuxiliaryState = (response: NextResponse, anonDeviceId: string | null, headers: Record<string, string>) => {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (anonDeviceId) {
    response.cookies.set(ANON_DEVICE_COOKIE_NAME, anonDeviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  return response;
};

const getStorageKey = (scope: RateLimitScope, keyHash: string) => `${scope}:${keyHash}`;

const pruneMemoryBucket = (scope: RateLimitScope, keyHash: string) => {
  const storageKey = getStorageKey(scope, keyHash);
  const current = memoryBuckets.get(storageKey);
  if (current && current.windowEnd.getTime() <= Date.now()) {
    memoryBuckets.delete(storageKey);
  }
};

const getRateLimitClient = () => {
  const client = prisma as RateLimitPrismaClient;
  if (!client.rateLimitBucket) {
    console.warn("Rate limit bucket modeli aktif Prisma client icinde bulunamadi. Memory fallback devrede.");
    return null;
  }

  return client;
};

const ensureBucket = async (policy: RateLimitPolicy, keyHash: string): Promise<BucketState> => {
  const client = getRateLimitClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + policy.windowMs);

  if (!client) {
    pruneMemoryBucket(policy.scope, keyHash);
    const storageKey = getStorageKey(policy.scope, keyHash);
    const current = memoryBuckets.get(storageKey);

    if (!current) {
      const created = {
        count: 1,
        windowStart: now,
        windowEnd,
        lastSeenAt: now,
      };
      memoryBuckets.set(storageKey, created);
      return created;
    }

    const updated = {
      ...current,
      count: current.count + 1,
      lastSeenAt: now,
    };
    memoryBuckets.set(storageKey, updated);
    return updated;
  }

  const current = await client.rateLimitBucket.findUnique({
    where: {
      scope_keyHash: {
        scope: policy.scope,
        keyHash,
      },
    },
  });

  if (!current) {
    return client.rateLimitBucket.create({
      data: {
        scope: policy.scope,
        keyHash,
        count: 1,
        windowStart: now,
        windowEnd,
        lastSeenAt: now,
      },
    });
  }

  if (current.windowEnd.getTime() <= now.getTime()) {
    return client.rateLimitBucket.update({
      where: {
        scope_keyHash: {
          scope: policy.scope,
          keyHash,
        },
      },
      data: {
        count: 1,
        windowStart: now,
        windowEnd,
        lastSeenAt: now,
      },
    });
  }

  return client.rateLimitBucket.update({
    where: {
      scope_keyHash: {
        scope: policy.scope,
        keyHash,
      },
    },
    data: {
      count: { increment: 1 },
      lastSeenAt: now,
    },
  });
};

const buildTooManyRequestsResponse = (message: string, anonDeviceId: string | null, headers: Record<string, string>) =>
  applyAuxiliaryState(
    NextResponse.json(
      {
        error: message,
        code: "RATE_LIMITED",
        retryAfterSeconds: Number(headers["Retry-After"] || "60"),
      },
      { status: 429 }
    ),
    anonDeviceId,
    headers
  );

export const enforcePreAuthRateLimit = async ({
  scope,
  request,
}: PreAuthInput): Promise<AllowResult | NextResponse> => {
  const policy = RATE_LIMIT_POLICIES[scope];
  const anonDeviceId = getOrCreateAnonDeviceId(request);
  const keyHash = hashToken(`${scope}:${resolveRateLimitIp(request)}:${anonDeviceId}`);
  const bucket = await ensureBucket(policy, keyHash);
  const headers = getHeaderValues(bucket, policy);

  if (bucket.count > policy.maxRequests) {
    return buildTooManyRequestsResponse("Cok fazla deneme yapildi. Lutfen biraz bekleyin.", anonDeviceId, headers);
  }

  return {
    allowed: true,
    anonDeviceId,
    headers,
  };
};

export const enforcePostAuthRateLimit = async ({
  scope,
  request,
}: PostAuthInput): Promise<AllowResult | NextResponse> => {
  const policy = RATE_LIMIT_POLICIES[scope];
  const token = extractRequestToken(request);

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 401 });
  }

  const keyHash = hashToken(`${scope}:${resolveRateLimitIp(request)}:${hashToken(token)}`);
  const bucket = await ensureBucket(policy, keyHash);
  const headers = getHeaderValues(bucket, policy);

  if (bucket.count > policy.maxRequests) {
    return buildTooManyRequestsResponse("Bu islem icin cok fazla istek yapildi.", null, headers);
  }

  return {
    allowed: true,
    anonDeviceId: null,
    headers,
  };
};

export const withRateLimitHeaders = (response: NextResponse, result: AllowResult) =>
  applyAuxiliaryState(response, result.anonDeviceId, result.headers);
