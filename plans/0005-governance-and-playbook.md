# Plan 0005 — Governance map + pipeline playbook

**Goal:** the two remaining documents from the repo contents spec.

## `governance/README.md`

One page: every human-in-the-loop checkpoint in this repo's pipeline, what
the audit trail consists of (and where each artifact lives), and a short
mapping of each control to NIST AI RMF function vocabulary (Govern / Map /
Measure / Manage). Facts about *this* repo only — no claims that other
projects run the full pipeline.

## `playbook.md`

How to run this pipeline on any repo: prerequisites, the five lanes
(plan, build, review, gate, merge), copy-paste setup of the two workflows,
conventions (plans/, small batches, honest verification), and what to adapt.
Written so it could be republished as a corewise.academy guide.

## Verification

Docs only — gate + suite must stay green; claims cross-checked against what
the repo actually contains.
