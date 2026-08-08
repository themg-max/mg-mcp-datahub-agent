# MG MCP Alignment and Public Adapter Notes

This document explains how this public repository relates to the pre-existing MG MCP architecture, what was contributed in this public implementation, and what remains private or out-of-scope.

## 1. MG MCP as Pre-existing Governed Context Architecture

- MG MCP is an existing governance and context architecture used internally to provide authoritative, governed context for agent workflows.
- It provides lane/worktree discipline, authority classifications, handoffs, and the policy model that determines when evidence may be used to grant implementation or deployment authority.
- This repository does not re-implement MG MCP. Instead it provides a narrow, public-facing adapter that demonstrates how DataHub-shaped metadata can be translated into a public model inspired by MG MCP: `NormalizedContextRecord[]` and a bounded `WorkPacket` for human review.

## 2. Purpose of this Repository (Public DataHub Adapter / Proof)

- This project is a public TypeScript reference implementation that:
  - Accepts synthetic or DataHub-shaped metadata.
  - Produces deterministic, reviewable work packets that follow the public model inspired by MG MCP (authority states, provenance, blocked uses, required validation).
  - Preserves provenance so human reviewers can trace decisions back to evidence sources.
- The repository is intentionally small and fixture-driven to facilitate public review and reuse during competitions and demos.

## 3. Private vs Public Boundaries

- Private repositories and internal MG MCP implementations remain the authoritative source of policy, lane artifacts, and production integration logic.
- This public adapter is explicitly scoped to: translation, canonicalization, deterministic packet generation, demo fixtures, judge packaging, and optional local-OSS read-only verification.
- No production DataHub credentials, private data, or operational secrets are included in this repository.
- No code from private repositories is copied into this public project.

## 4. DataHub Signals vs MG Authority Policy

- DataHub (or other metadata providers) can provide signals (tags, descriptions, canonical URLs, timestamps) that help build context.
- Signals are not authority by themselves. The MG MCP policy model classifies evidence into authority states (`approved`, `planning_only`, `quarantined`, `unknown`).
- This adapter maps provider signals into the `NormalizedContextRecord` model and marks authority accordingly; downstream governance decisions (approval, merge, deployment) remain human-controlled and are outside the adapter.

## 5. Mode A vs Mode B integration status

| Mode | Status | Runtime |
|------|--------|---------|
| A — fixture / recorded-response harness | Default judge path; verified in-repo | `MODE_A_RUNTIME=UNKNOWN` (no live invocation claim) |
| B — local DataHub OSS + official `mcp-server-datahub==0.6.0` over HTTP | Public implementation verified; fail-closed unless `DATAHUB_LOCAL_MCP_ALLOW=true` | `MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY` |

The public implementation was verified against local DataHub OSS using the official
mcp-server-datahub server over HTTP. The validation discovered the live MCP tool
inventory, selected a server-annotated read-only tool, executed exactly one
attributable metadata retrieval, and preserved downstream authority as `PROPOSED`.

## 6. What remains out of scope (not a “next phase” claim inside this adapter)

Still **not claimed** by this public repository:

- Managed Cloud OAuth / production tenant activation
- DataHub writes or MG MCP writes
- Deployment, IAM, or secret mutation
- Autonomous merge
- Treating optional local-OSS reads as production authority

Any future production integration requires separate explicit authority outside this
competition packaging surface.

## 7. Summary

This repository is a public, minimal, and reviewable proof-of-concept adapter that demonstrates how DataHub-shaped metadata can be mapped into governed context for MG MCP-style review workflows. It is intentionally conservative: Mode A remains fixture-first and zero-secret; Mode B is optional, local-only, read-only, and fail-closed by default; human approval remains mandatory.
