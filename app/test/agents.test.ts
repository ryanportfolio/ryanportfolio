import { describe, expect, it } from "vitest";
import { isAgentInvolvedCommit, isBotLogin, scanCoAuthorTrailers } from "../src/agents.js";

describe("scanCoAuthorTrailers", () => {
  it("detects Claude co-author trailer as agent", () => {
    const scan = scanCoAuthorTrailers(
      "Fix bug\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>",
    );
    expect(scan.hasAnyCoAuthorTrailer).toBe(true);
    expect(scan.hasAgentCoAuthorTrailer).toBe(true);
  });

  it("detects Copilot trailer as agent", () => {
    const scan = scanCoAuthorTrailers(
      "feat: x\n\nCo-authored-by: GitHub Copilot <copilot@github.com>",
    );
    expect(scan.hasAgentCoAuthorTrailer).toBe(true);
  });

  it("human co-author is not an agent", () => {
    const scan = scanCoAuthorTrailers("pair work\n\nCo-Authored-By: Alex Kim <alex@example.com>");
    expect(scan.hasAnyCoAuthorTrailer).toBe(true);
    expect(scan.hasAgentCoAuthorTrailer).toBe(false);
  });

  it("no trailer → no flags", () => {
    const scan = scanCoAuthorTrailers("plain commit message");
    expect(scan.hasAnyCoAuthorTrailer).toBe(false);
    expect(scan.hasAgentCoAuthorTrailer).toBe(false);
  });
});

describe("isBotLogin", () => {
  it("matches [bot] suffix and known bots", () => {
    expect(isBotLogin("github-actions[bot]")).toBe(true);
    expect(isBotLogin("dependabot")).toBe(true);
    expect(isBotLogin("renovate[bot]")).toBe(true);
  });

  it("does not match humans or null", () => {
    expect(isBotLogin("ryan")).toBe(false);
    expect(isBotLogin(null)).toBe(false);
  });
});

describe("isAgentInvolvedCommit", () => {
  it("bot author or agent trailer counts", () => {
    expect(isAgentInvolvedCommit({ authorIsBot: true, hasAgentCoAuthorTrailer: false })).toBe(true);
    expect(isAgentInvolvedCommit({ authorIsBot: false, hasAgentCoAuthorTrailer: true })).toBe(true);
    expect(isAgentInvolvedCommit({ authorIsBot: false, hasAgentCoAuthorTrailer: false })).toBe(
      false,
    );
  });
});
