import { describe, expect, it } from "vitest";
import { esc, generateIndexHtml, generateReportHtml, slugOf } from "../src/site/generate.js";
import { scoreRepo } from "../src/score/index.js";
import { makeFacts, makePull } from "./helpers.js";

const healthy = scoreRepo(makeFacts({ pullRequests: [makePull(), makePull({ number: 2 })] }));
const thin = scoreRepo(
  makeFacts({
    repo: {
      owner: "ryanportfolio",
      name: "Thin.Repo",
      defaultBranch: "main",
      isPrivate: true,
      collectedAt: "2026-03-01T00:00:00Z",
      headSha: "t1",
    },
    pullRequests: [],
  }),
);

describe("esc / slugOf", () => {
  it("escapes html metacharacters", () => {
    expect(esc(`<b>&"x"`)).toBe("&lt;b&gt;&amp;&quot;x&quot;");
  });
  it("slugs repo names safely", () => {
    expect(slugOf(thin)).toBe("thin.repo");
    expect(slugOf(healthy)).toBe("example");
  });
});

describe("generateIndexHtml", () => {
  it("empty fleet → honest pending state, no fake rows", () => {
    const html = generateIndexHtml([]);
    expect(html).toContain("Fleet audit pending");
    expect(html).not.toContain("<tbody>");
  });

  it("renders sorted scoreboard rows with report links", () => {
    const html = generateIndexHtml([thin, healthy]);
    expect(html.indexOf("ryanportfolio/example")).toBeLessThan(
      html.indexOf("ryanportfolio/Thin.Repo"),
    );
    expect(html).toContain(`href="example.html"`);
    expect(html).toContain(`href="thin.repo.html"`);
    expect(html).toContain("Unflattering scores stay in");
  });

  it("is deterministic", () => {
    expect(generateIndexHtml([healthy, thin])).toBe(generateIndexHtml([healthy, thin]));
  });
});

describe("generateReportHtml", () => {
  it("renders grade chip, provenance, and dimension bars", () => {
    const html = generateReportHtml(healthy);
    expect(html).toContain(`${healthy.grade}</span>`);
    expect(html).toContain("abc1234");
    expect(html).toContain(`style="width:`);
  });

  it("unscorable dims render as could-not-verify, and section lists them", () => {
    const html = generateReportHtml(thin);
    expect(html).toContain("could not verify");
    expect(html).toContain("Could not verify");
    expect(html).toContain("Excluded from the overall score rather than guessed");
  });

  it("escapes repo-derived strings", () => {
    const html = generateReportHtml(thin);
    expect(html).not.toContain("<script");
    expect(html).toContain("ryanportfolio/Thin.Repo");
  });
});
