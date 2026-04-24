/**
 * PII Scrubbing Utility for AI Edge Functions
 *
 * Removes or redacts personally identifiable information from text
 * before sending to AI to comply with privacy requirements.
 */

export interface ScrubResult {
  original: string;
  scrubbed: string;
}

const PATTERNS = [
  // Email addresses
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },

  // US Phone: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXX XXX XXXX
  { regex: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: "[PHONE]" },

  // EIN (XX-XXXXXXX)
  { regex: /\d{2}-\d{7}/g, replacement: "[EIN]" },

  // VIN (17 alphanumeric, excluding I, O, Q)
  { regex: /[A-HJ-NPR-Z0-9]{17}/gi, replacement: "[VIN]" },

  // Full name: First Last (capitalized words pattern — simple)
  { regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, replacement: "[NAME]" },

  // Street address: 123 Main St (simplified)
  {
    regex: /\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
    replacement: "[ADDRESS]",
  },

  // SSN-like pattern (XXX-XX-XXXX)
  { regex: /\d{3}-\d{2}-\d{4}/g, replacement: "[SSN]" },
];

/**
 * Scrub PII from text
 * @param text Input string from user
 * @returns New string with PII redacted
 */
export function scrubPII(text: string): string {
  let result = text;
  for (const { regex, replacement } of PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Scrub with metadata (dev mode only)
 * @param text Input string
 * @returns Object with original, scrubbed, and pattern count info
 */
export function scrubPIIWithInfo(text: string): ScrubResult & { replacements: number } {
  const original = text;
  let totalReplacements = 0;
  let result = text;
  for (const { regex, replacement } of PATTERNS) {
    const matches = result.match(regex);
    if (matches) {
      totalReplacements += matches.length;
      result = result.replace(regex, replacement);
    }
  }
  return { original, scrubbed: result, replacements: totalReplacements };
}

// Dev-mode test — runs when NODE_ENV=development or SUPABASE_LOCAL=true
if (Deno.env.get("SUPABASE_LOCAL") === "true") {
  console.debug("Running PII scrubber self-test...");
  const testCases = [
    {
      input: "John Doe john.doe@example.com 555-123-4567",
      expectedHas: ["[EMAIL]", "[PHONE]"],
    },
    { input: "VIN: 1HGCM82633A123456", expectedHas: ["[VIN]"] },
    { input: "EIN: 12-3456789", expectedHas: ["[EIN]"] },
    { input: "123 Main Street, Springfield", expectedHas: ["[ADDRESS]"] },
    { input: " Jane Smith  ", expectedHas: ["[NAME]"] },
    { input: "SSN: 123-45-6789", expectedHas: ["[SSN]"] },
  ];

  for (const { input, expectedHas } of testCases) {
    const { scrubbed, replacements } = scrubPIIWithInfo(input);
    const missing = expectedHas.filter((token) => !scrubbed.includes(token));
    if (missing.length > 0) {
      console.error(
        `PII scrubber test FAILED: "${input}" → "${scrubbed}" (missing ${missing.join(
          ", "
        )})`
      );
    } else if (replacements === 0) {
      console.error(
        `PII scrubber test FAILED: no replacements for "${input}" → "${scrubbed}"`
      );
    } else {
      console.debug(
        `PII scrubber test OK: "${input}" → "${scrubbed}" (${replacements} repl.)`
      );
    }
  }
}
