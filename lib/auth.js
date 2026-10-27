import { createHash, timingSafeEqual } from 'node:crypto';

function digest(value) {
  return createHash('sha256').update(String(value), 'utf8').digest();
}

export function isControllerConfigured() {
  return typeof process.env.CONTROLLER_SECRET === 'string' && process.env.CONTROLLER_SECRET.length >= 8;
}

// Constant-time-ish comparison via fixed-length digests.
export function verifyControllerSecret(candidate) {
  if (!isControllerConfigured() || typeof candidate !== 'string' || !candidate) return false;
  const a = digest(candidate);
  const b = digest(process.env.CONTROLLER_SECRET);
  return timingSafeEqual(a, b);
}

/**
 * Extracts the controller secret from either the Authorization header
 * (`Bearer <secret>` or `Controller <secret>`) or the `x-controller-secret` header.
 */
export function extractControllerSecret(request) {
  const direct = request.headers.get('x-controller-secret');
  if (direct) return direct.trim();
  const auth = request.headers.get('authorization') || '';
  const match = auth.match(/^(?:Bearer|Controller)\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

export function requireController(request) {
  return verifyControllerSecret(extractControllerSecret(request));
}
