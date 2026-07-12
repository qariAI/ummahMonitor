import { describe, it, expect } from "vitest";
import {
  PUBLISH_THRESHOLD,
  assessTrust,
  classifyStatus,
  computeConfidence,
  isPublishable,
  tierOf,
} from "./confidence";
import type { SourceInput } from "./types";

const th = PUBLISH_THRESHOLD;

describe("classifyStatus (the shared threshold branch)", () => {
  it("withholds below threshold regardless of conflict", () => {
    expect(classifyStatus(th - 1, false)).toBe("withheld");
    expect(classifyStatus(th - 1, true)).toBe("withheld");
    expect(classifyStatus(0, false)).toBe("withheld");
  });

  it("publishes at/above threshold when sources agree", () => {
    expect(classifyStatus(th, false)).toBe("published");
    expect(classifyStatus(100, false)).toBe("published");
  });

  it("flags developing at/above threshold when sources conflict", () => {
    expect(classifyStatus(th, true)).toBe("developing");
    expect(classifyStatus(100, true)).toBe("developing");
  });

  it("treats the threshold boundary as inclusive (>= publishes)", () => {
    expect(classifyStatus(th, false)).not.toBe("withheld");
    expect(classifyStatus(th - 0.01, false)).toBe("withheld");
  });
});

describe("dossier and moderation-queue surfaces can never disagree", () => {
  // The public dossier renders assessTrust().status; the moderation queue
  // renders a "would publish / withheld" pill from classifyStatus(trustScore).
  // Both must agree for EVERY confidence/conflict pair — this is the core
  // guarantee the shared service exists to provide.
  it("agrees across every score 0..100 and both conflict states", () => {
    for (let score = 0; score <= 100; score++) {
      for (const conflicting of [false, true]) {
        // Public dossier path: derive via override, then classify internally.
        const dossier = assessTrust({ sources: [], conflicting, confidenceOverride: score }).status;
        // Moderation queue path: classify the precomputed trustScore directly.
        const queue = classifyStatus(score, conflicting);
        expect(queue).toBe(dossier);
      }
    }
  });
});

describe("computeConfidence (tiered corroboration)", () => {
  const official: SourceInput = { name: "UN OCHA", verified: true }; // tier official (42)
  const wire: SourceInput = { name: "Reuters", verified: true }; // tier wire (36)
  const community: SourceInput = { name: "Moonsighting.com", verified: false }; // community (10)

  it("infers tiers from the source directory", () => {
    expect(tierOf(official)).toBe("official");
    expect(tierOf(wire)).toBe("wire");
    expect(tierOf(community)).toBe("community");
    expect(tierOf({ name: "Some Unknown Blog", verified: true })).toBe("regional");
  });

  it("crosses threshold with two verified high-tier sources of distinct types", () => {
    // official(42) + wire(36) + diversity bonus(6) = 84 → publishable
    const conf = computeConfidence({ sources: [official, wire] });
    expect(conf).toBeGreaterThanOrEqual(th);
    expect(isPublishable(conf, false)).toBe(true);
  });

  it("holds an unverified community-only report below threshold (withheld)", () => {
    const conf = computeConfidence({ sources: [community] });
    expect(conf).toBeLessThan(th);
    expect(classifyStatus(conf, false)).toBe("withheld");
  });

  it("caps pending community submissions at 32 and forces sources unverified", () => {
    const conf = computeConfidence({
      sources: [official, wire],
      pending: true,
    });
    expect(conf).toBeLessThanOrEqual(32);
    const a = assessTrust({ sources: [official, wire], pending: true });
    expect(a.status).toBe("withheld");
    expect(a.independent).toBe(0); // pending → nothing corroborates yet
  });

  it("honors an explicit confidence override", () => {
    expect(computeConfidence({ sources: [], confidenceOverride: 96 })).toBe(96);
  });
});

describe("assessTrust corroboration metadata", () => {
  it("reports independent count and tier diversity", () => {
    const a = assessTrust({
      sources: [
        { name: "UN OCHA", verified: true }, // official
        { name: "Reuters", verified: true }, // wire
        { name: "MSF", verified: true }, // relief
      ],
    });
    expect(a.independent).toBe(3);
    expect(a.diversity).toBe(3);
    expect(a.corroborationLine).toBe("3 independent · 3 types");
    expect(a.status).toBe("published");
    expect(a.requirement).toBeNull();
  });

  it("produces a developing requirement banner when conflicting", () => {
    const a = assessTrust({
      sources: [
        { name: "UN OCHA", verified: true },
        { name: "Reuters", verified: true },
      ],
      conflicting: true,
    });
    expect(a.status).toBe("developing");
    expect(a.requirement?.title).toMatch(/developing/i);
  });
});
