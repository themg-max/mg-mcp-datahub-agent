MG MCP Alignment and Public Adapter Notes

This document explains how this public repository relates to the pre-existing MG MCP (Managed Governance — Multi-Context Platform) architecture, what was contributed in this public implementation, and what remains private or out-of-scope.

1. MG MCP as Pre-existing Governed Context Architecture

- MG MCP is an existing governance and context architecture used internally to provide authoritative, governed context for agent workflows.
- It provides lane/worktree discipline, authority classifications, handoffs, and the policy model that determines when evidence may be used to grant implementation or deployment authority.
- This repository does not re-implement MG MCP. Instead it provides a narrow, public-facing adapter that demonstrates how DataHub-shaped metadata can be translated into the MG MCP `NormalizedContextRecord[]` shape and a bounded `WorkPacket` for human review.

2. Purpose of this Repository (Public DataHub Adapter / Proof)

- This project is a public TypeScript reference implementation that:
  - Accepts synthetic or DataHub-shaped metadata.
  - Produces deterministic, reviewable work packets that conform to the MG MCP governance model (authority states, provenance, blocked uses, required validation).
  - Preserves provenance so human reviewers can trace decisions back to evidence sources.
- The repository is intentionally small and fixture-driven to facilitate public review and reuse during competitions and demos.

3. Private vs Public Boundaries

- Private repositories and internal MG MCP implementations remain the authoritative source of policy, lane artifacts, and production integration logic.
- This public adapter is explicitly scoped to: translation, canonicalization, deterministic packet generation, and demo fixtures.
- No production DataHub credentials, MCP server, private data, or operational secrets are included in this repository.
- No code from private repositories is copied into this public project.

4. DataHub Signals vs MG Authority Policy

- DataHub (or other metadata providers) can provide signals (tags, descriptions, canonical URLs, timestamps) that help build context.
- Signals are not authority by themselves. The MG MCP policy model classifies evidence into authority states (`approved`, `planning_only`, `quarantined`, `unknown`).
- This adapter maps provider signals into the `NormalizedContextRecord` model and marks authority accordingly; downstream governance decisions (approval, merge, deployment) remain human-controlled and are outside the adapter.

5. No Live Integration in This Phase

- The demo is fixture-driven by default. The included `DataHubClient` is a read-only, optional transport; speculative REST path defaults were removed from the client to avoid making assumptions about private deployments.
- Live, production-grade DataHub MCP Server integration is part of a future phase and requires an official MCP server, credentials, and explicit integration authority.

6. Next Phase: Official DataHub MCP Server Integration

- The next phase will integrate this adapter with an official DataHub MCP Server (or a certified MG MCP server) in a separate, authorized repository and workstream.
- That integration will include:
  - Proper server endpoints and transport configuration managed by the owning team.
  - Deployment and IAM changes performed under the appropriate governance and approval process.
  - Additional tests and validation in a private integration environment.

7. Summary

This repository is a public, minimal, and reviewable proof-of-concept adapter that demonstrates how DataHub-shaped metadata can be mapped into governed context for MG MCP-style review workflows. It is intentionally conservative: no defaults for live REST paths, no private data, and a fixture-first demo mode to keep the public surface small and safe.
