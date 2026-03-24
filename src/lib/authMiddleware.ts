import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, TokenPayload } from './auth';

export const authMiddleware = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      isValid: false,
      payload: null,
      error: 'Token not found',
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      isValid: false,
      payload: null,
      error: 'Invalid or expired token',
    };
  }

  return {
    isValid: true,
    payload,
    error: null,
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

