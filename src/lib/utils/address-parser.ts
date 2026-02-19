export interface ParsedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  raw: string | null;
}

const FL_PATTERN =
  /^(.*?),?\s+([A-Za-z][A-Za-z\s]*?)\s+(FL|Florida)\s+(\d{5})(?:-\d{4})?$/i;

const ZIP_ONLY = /(\d{5})(?:-\d{4})?/;

export function parseAddress(raw: string | null | undefined): ParsedAddress {
  if (!raw || !raw.trim()) {
    return { street: null, city: null, state: null, zip: null, raw: null };
  }

  const trimmed = raw.trim();
  const flMatch = trimmed.match(FL_PATTERN);

  if (flMatch) {
    return {
      street: flMatch[1]?.trim() || null,
      city: flMatch[2]?.trim() || null,
      state: "FL",
      zip: flMatch[4],
      raw: trimmed,
    };
  }

  // Fallback: extract ZIP only
  const zipMatch = trimmed.match(ZIP_ONLY);
  return {
    street: null,
    city: null,
    state: null,
    zip: zipMatch ? zipMatch[1] : null,
    raw: trimmed,
  };
}
