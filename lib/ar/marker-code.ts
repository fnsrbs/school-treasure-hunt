const MARKER_CODE_PREFIX = 'school-treasure-hunt:';

export function markerPayloadFor(markerId: string): string {
  return `${MARKER_CODE_PREFIX}${markerId}`;
}

export function parseMarkerPayload(value: string): string | null {
  const payload = value.trim();

  if (payload.startsWith(MARKER_CODE_PREFIX)) {
    return payload.slice(MARKER_CODE_PREFIX.length) || null;
  }

  // Raw IDs remain supported for early printed markers and local testing.
  if (/^(hint|treasure|marker)-[a-z0-9-]+$/i.test(payload)) {
    return payload;
  }

  return null;
}
