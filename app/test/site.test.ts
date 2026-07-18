import { describe, expect, it } from "vitest";
import {
  assertUniqueSlugs,
  esc,
  generateIndexHtml,
  generateReportHtml,
  slugOf,
} from "../src/site/generate.js";
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

  it("null overall renders the en-dash placeholder in the grade chip", () => {
    expect(thin.overall).toBeNull();
    const html = generateReportHtml(thin);
    expect(html).toContain(">–<");
    expect(html).not.toContain("\u2014");
  });

  it("escapes hostile repo-derived strings through the real render path", () => {
    const hostile = structuredClone(thin);
    (hostile as { repo: string }).repo = `ryanportfolio/<script>alert("x")</script>`;
    hostile.dimensions[0]!.detail = `<img src=x onerror="pwn()">`;
    const html = generateReportHtml(hostile);
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain(`<img src=x`);
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;pwn()&quot;&gt;");
  });

  it("score 0 renders an empty bar, not a fake sliver", () => {
    const zeroed = structuredClone(thin);
    zeroed.dimensions[0]!.score = 0;
    const html = generateReportHtml(zeroed);
    expect(html).toContain(`style="width:0%"`);
  });

  it("slug collisions throw instead of silently overwriting", () => {
    const a = structuredClone(healthy);
    const b = structuredClone(healthy);
    (a as { repo: string }).repo = "o/My Repo";
    (b as { repo: string }).repo = "o/My-Repo";
    expect(() => assertUniqueSlugs([a, b])).toThrow(/slug collision/);
    expect(() => assertUniqueSlugs([healthy, thin])).not.toThrow();
  });
});
