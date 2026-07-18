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

  it("index and report pages carry the plain-language meaning and limits", () => {
    for (const html of [generateIndexHtml([healthy]), generateReportHtml(healthy)]) {
      expect(html).toContain("What this score means");
      expect(html).toContain("process discipline, not code quality");
      expect(html).toContain("What this score cannot see");
      expect(html).toContain("no GitHub artifact is invisible");
      expect(html).toContain("Solo accounts have a built-in blind spot");
    }
    expect(generateReportHtml(healthy)).toContain(
      "how many carry a recorded review by anyone other than the author?",
    );
  });

  it("owner attestation renders with the not-verified label; absent renders nothing", () => {
    const withAtt = {
      ...healthy,
      attestation: { text: "Reviews happen in fresh AI sessions.", verified: false, scored: false },
    };
    const html = generateReportHtml(withAtt);
    expect(html).toContain("Owner attestation");
    expect(html).toContain("has not verified this and it earns no score credit");
    expect(html).toContain("Reviews happen in fresh AI sessions.");
    expect(generateReportHtml(healthy)).not.toContain("Owner attestation");
  });

  it("legacy bare-string attestations still render and escape", () => {
    const legacy = { ...healthy, attestation: `Legacy <b>"note"</b>` };
    const html = generateReportHtml(legacy);
    expect(html).toContain("Owner attestation");
    expect(html).toContain("Legacy &lt;b&gt;&quot;note&quot;&lt;/b&gt;");
    expect(html).not.toContain(`Legacy <b>`);
  });

  it("limits callout sits upfront: before the scoreboard and the dimension table", () => {
    const index = generateIndexHtml([healthy]);
    expect(index.match(/What this score cannot see/g)).toHaveLength(1);
    expect(index.indexOf("What this score cannot see")).toBeLessThan(index.indexOf("Scoreboard"));
    expect(index).toContain("almost always run as handoff audits");
    // The practice claim stays attributed and conditional, never site-voice fact.
    expect(index).toContain("The owner states that");
    expect(index).toContain("The tool has not verified that claim");
    expect(index).toContain("if the claim is accurate");
    const page = generateReportHtml(healthy);
    expect(page.match(/What this score cannot see/g)).toHaveLength(1);
    expect(page.indexOf("What this score cannot see")).toBeLessThan(page.indexOf("Dimensions"));
    // Report pages stay repo-agnostic: no fleet-specific practice claims.
    expect(page).not.toContain("handoff audits");
  });

  it("chrome invariants: brand-font origin, fallback stacks, zero scripts", () => {
    for (const html of [generateIndexHtml([healthy]), generateReportHtml(healthy)]) {
      expect(html).toContain("https://corewise.academy/fonts/");
      expect(html).toContain("Georgia,serif");
      expect(html).toContain("ui-monospace");
      expect(html).not.toContain("<script");
      expect(html).toContain(`class="masthead"`);
      expect(html).toContain(`href="https://corewise.academy/"`);
    }
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
