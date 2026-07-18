/** Detection of agent/bot identities from logins and co-author trailers. */

const AGENT_TRAILER_PATTERN =
  /claude|copilot|cursor|devin|aider|codex|openhands|sweep|gpt|assistant|\[bot\]|bot@|noreply@anthropic\.com|noreply@github\.com.*copilot/i;

const CO_AUTHOR_TRAILER = /^co-authored-by:\s*(.+)$/gim;

export function isBotLogin(login: string | null): boolean {
  if (!login) return false;
  return /\[bot\]$/i.test(login) || /^(dependabot|renovate|github-actions)/i.test(login);
}

export interface TrailerScan {
  hasAnyCoAuthorTrailer: boolean;
  hasAgentCoAuthorTrailer: boolean;
}

/** Scan a raw commit message for co-author trailers, returning derived flags
 * only. The caller must discard the message after this call (privacy boundary). */
export function scanCoAuthorTrailers(message: string): TrailerScan {
  let hasAny = false;
  let hasAgent = false;
  for (const match of message.matchAll(CO_AUTHOR_TRAILER)) {
    hasAny = true;
    const identity = match[1] ?? "";
    if (AGENT_TRAILER_PATTERN.test(identity)) hasAgent = true;
  }
  return { hasAnyCoAuthorTrailer: hasAny, hasAgentCoAuthorTrailer: hasAgent };
}

/** A commit counts as agent-involved if authored by a bot or carrying an
 * agent co-author trailer. Unattributed agent use is undetectable; scoring
 * treats this as an attribution/transparency signal, not ground truth. */
export function isAgentInvolvedCommit(fact: {
  authorIsBot: boolean;
  hasAgentCoAuthorTrailer: boolean;
}): boolean {
  return fact.authorIsBot || fact.hasAgentCoAuthorTrailer;
}
