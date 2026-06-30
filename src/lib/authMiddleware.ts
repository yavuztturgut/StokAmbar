import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, TokenPayload, AUTH_COOKIE_NAME } from './auth';
import { prisma } from './prisma';

export const extractRequestToken = (request: NextRequest) =>
  extractTokenFromHeader(request.headers.get('authorization')) ??
  request.cookies.get(AUTH_COOKIE_NAME)?.value ??
  null;

export const authMiddleware = async (request: NextRequest) => {
  const token = extractRequestToken(request);

  if (!token) {
    return {
      isValid: false,
      payload: null,
      error: 'Token not found',
      token: null,
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      isValid: false,
      payload: null,
      error: 'Invalid or expired token',
      token: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, tokenVersion: true },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return {
      isValid: false,
      payload: null,
      error: 'Invalid or expired token',
      token: null,
    };
  }

  return {
    isValid: true,
    payload,
    error: null,
    token,
  };
};

export const requireAuth = async (request: NextRequest) => {
  const auth = await authMiddleware(request);

  if (!auth.isValid) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  return auth.payload as TokenPayload;
};

