import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRandomToken, hashToken } from "@/lib/auth";
import { extractRequestToken } from "@/lib/authMiddleware";

export const ANON_DEVICE_COOKIE_NAME = "anon_device_id";

type RateLimitScope =
  | "auth:login"
  | "auth:login-ip"
  | "auth:login-ip-email"
  | "auth:login-fail"
  | "auth:login-blacklist"
  | "auth:token"
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

interface LoginRateLimitInput {
  request: NextRequest;
  email: string;
}

interface LoginStateInput {
  request: NextRequest;
  email: string;
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
  "auth:login-ip": { scope: "auth:login-ip", maxRequests: 30, windowMs: 15 * 60 * 1000 },
  "auth:login-ip-email": { scope: "auth:login-ip-email", maxRequests: 5, windowMs: 10 * 60 * 1000 },
  "auth:login-fail": { scope: "auth:login-fail", maxRequests: 6, windowMs: 30 * 60 * 1000 },
  "auth:login-blacklist": { scope: "auth:login-blacklist", maxRequests: 1, windowMs: 30 * 60 * 1000 },
  "auth:token": { scope: "auth:token", maxRequests: 60, windowMs: 15 * 60 * 1000 },
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
const LOGIN_DELAY_STEPS = [
  { threshold: 4, delayMs: 5_000 },
  { threshold: 2, delayMs: 1_000 },
];
const LOGIN_BLACKLIST_THRESHOLD = 6;
const LOGIN_BLACKLIST_DELAY_MS = 15_000;

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

export const normalizeRateLimitEmail = (email: string) => email.trim().toLowerCase();

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

const normalizeBucket = (bucket: BucketState | null) => {
  if (!bucket) {
    return null;
  }

  return {
    ...bucket,
    windowStart: new Date(bucket.windowStart),
    windowEnd: new Date(bucket.windowEnd),
    lastSeenAt: new Date(bucket.lastSeenAt),
  };
};

const getRateLimitClient = () => {
  const client = prisma as RateLimitPrismaClient;
  if (!client.rateLimitBucket) {
    console.warn("Rate limit bucket modeli aktif Prisma client icinde bulunamadi. Memory fallback devrede.");
    return null;
  }

  return client;
};

const getBucket = async (policy: RateLimitPolicy, keyHash: string): Promise<BucketState | null> => {
  const client = getRateLimitClient();
  const now = Date.now();

  if (!client) {
    const storageKey = getStorageKey(policy.scope, keyHash);
    const current = normalizeBucket(memoryBuckets.get(storageKey) ?? null);
    if (!current) {
      return null;
    }

    if (current.windowEnd.getTime() <= now) {
      memoryBuckets.delete(storageKey);
      return null;
    }

    return current;
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
    return null;
  }

  if (current.windowEnd.getTime() <= now) {
    await client.rateLimitBucket.delete({
      where: {
        scope_keyHash: {
          scope: policy.scope,
          keyHash,
        },
      },
    });
    return null;
  }

  return current;
};

const setBucket = async (
  policy: RateLimitPolicy,
  keyHash: string,
  count: number,
  windowMs: number = policy.windowMs
): Promise<BucketState> => {
  const client = getRateLimitClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  if (!client) {
    const bucket = {
      count,
      windowStart: now,
      windowEnd,
      lastSeenAt: now,
    };
    memoryBuckets.set(getStorageKey(policy.scope, keyHash), bucket);
    return bucket;
  }

  const existing = await client.rateLimitBucket.findUnique({
    where: {
      scope_keyHash: {
        scope: policy.scope,
        keyHash,
      },
    },
  });

  if (!existing) {
    return client.rateLimitBucket.create({
      data: {
        scope: policy.scope,
        keyHash,
        count,
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
      count,
      windowStart: now,
      windowEnd,
      lastSeenAt: now,
    },
  });
};

const clearBucket = async (policy: RateLimitPolicy, keyHash: string) => {
  const client = getRateLimitClient();

  if (!client) {
    memoryBuckets.delete(getStorageKey(policy.scope, keyHash));
    return;
  }

  await client.rateLimitBucket.deleteMany({
    where: {
      scope: policy.scope,
      keyHash,
    },
  });
};

const ensureBucket = async (policy: RateLimitPolicy, keyHash: string): Promise<BucketState> => {
  const current = await getBucket(policy, keyHash);
  const now = new Date();

  if (!current) {
    return setBucket(policy, keyHash, 1);
  }

  return setBucket(
    policy,
    keyHash,
    current.count + 1,
    current.windowEnd.getTime() - now.getTime()
  );
};

const sleep = async (delayMs: number) => {
  if (delayMs <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));
};

const getLoginDelayMs = (failureCount: number) => {
  for (const step of LOGIN_DELAY_STEPS) {
    if (failureCount >= step.threshold) {
      return step.delayMs;
    }
  }

  return 0;
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

const getLoginRateLimitKeys = (request: NextRequest, email: string) => {
  const normalizedEmail = normalizeRateLimitEmail(email);
  const ip = resolveRateLimitIp(request);
  const ipKeyHash = hashToken(`auth:login-ip:${ip}`);
  const ipEmailKeyHash = hashToken(`auth:login-ip-email:${ip}:${normalizedEmail}`);

  return {
    normalizedEmail,
    ipKeyHash,
    ipEmailKeyHash,
  };
};

export const enforceLoginRateLimit = async ({
  request,
  email,
}: LoginRateLimitInput): Promise<AllowResult | NextResponse> => {
  const ipPolicy = RATE_LIMIT_POLICIES["auth:login-ip"];
  const ipEmailPolicy = RATE_LIMIT_POLICIES["auth:login-ip-email"];
  const failPolicy = RATE_LIMIT_POLICIES["auth:login-fail"];
  const blacklistPolicy = RATE_LIMIT_POLICIES["auth:login-blacklist"];
  const { ipKeyHash, ipEmailKeyHash } = getLoginRateLimitKeys(request, email);

  const blacklistBucket = await getBucket(blacklistPolicy, ipEmailKeyHash);
  if (blacklistBucket) {
    await sleep(LOGIN_BLACKLIST_DELAY_MS);
  }

  const failBucket = await getBucket(failPolicy, ipEmailKeyHash);
  if (!blacklistBucket && failBucket) {
    await sleep(getLoginDelayMs(failBucket.count));
  }

  const ipBucket = await ensureBucket(ipPolicy, ipKeyHash);
  const ipEmailBucket = await ensureBucket(ipEmailPolicy, ipEmailKeyHash);
  const ipHeaders = getHeaderValues(ipBucket, ipPolicy);
  const ipEmailHeaders = getHeaderValues(ipEmailBucket, ipEmailPolicy);

  if (ipBucket.count > ipPolicy.maxRequests) {
    return buildTooManyRequestsResponse("Cok fazla deneme yapildi. Lutfen biraz bekleyin.", null, ipHeaders);
  }

  if (ipEmailBucket.count > ipEmailPolicy.maxRequests) {
    return buildTooManyRequestsResponse("Cok fazla deneme yapildi. Lutfen biraz bekleyin.", null, ipEmailHeaders);
  }

  return {
    allowed: true,
    anonDeviceId: null,
    headers: ipEmailHeaders,
  };
};

export const recordFailedLoginAttempt = async ({
  request,
  email,
}: LoginStateInput) => {
  const failPolicy = RATE_LIMIT_POLICIES["auth:login-fail"];
  const blacklistPolicy = RATE_LIMIT_POLICIES["auth:login-blacklist"];
  const { ipEmailKeyHash } = getLoginRateLimitKeys(request, email);
  const failBucket = await ensureBucket(failPolicy, ipEmailKeyHash);

  if (failBucket.count >= LOGIN_BLACKLIST_THRESHOLD) {
    await setBucket(blacklistPolicy, ipEmailKeyHash, 1);
  }
};

export const clearFailedLoginState = async ({
  request,
  email,
}: LoginStateInput) => {
  const failPolicy = RATE_LIMIT_POLICIES["auth:login-fail"];
  const blacklistPolicy = RATE_LIMIT_POLICIES["auth:login-blacklist"];
  const { ipEmailKeyHash } = getLoginRateLimitKeys(request, email);

  await Promise.all([
    clearBucket(failPolicy, ipEmailKeyHash),
    clearBucket(blacklistPolicy, ipEmailKeyHash),
  ]);
};

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

  const ip = resolveRateLimitIp(request);
  const scopeKeyHash = hashToken(`${scope}:${ip}:${hashToken(token)}`);
  const scopeBucket = await ensureBucket(policy, scopeKeyHash);
  const scopeHeaders = getHeaderValues(scopeBucket, policy);

  if (scopeBucket.count > policy.maxRequests) {
    return buildTooManyRequestsResponse("Bu islem icin cok fazla istek yapildi.", null, scopeHeaders);
  }

  if (scope.startsWith("auth:") && scope !== "auth:select-company") {
    const tokenPolicy = RATE_LIMIT_POLICIES["auth:token"];
    const tokenKeyHash = hashToken(`auth:token:${ip}:${hashToken(token)}`);
    const tokenBucket = await ensureBucket(tokenPolicy, tokenKeyHash);
    const tokenHeaders = getHeaderValues(tokenBucket, tokenPolicy);

    if (tokenBucket.count > tokenPolicy.maxRequests) {
      return buildTooManyRequestsResponse("Bu islem icin cok fazla istek yapildi.", null, tokenHeaders);
    }
  }

  return {
    allowed: true,
    anonDeviceId: null,
    headers: scopeHeaders,
  };
};

export const withRateLimitHeaders = (response: NextResponse, result: AllowResult) =>
  applyAuxiliaryState(response, result.anonDeviceId, result.headers);
