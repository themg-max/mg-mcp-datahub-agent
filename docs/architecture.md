# MG ContextOps DataHub Agent Architecture

## Problem
AI coding agents can receive large volumes of metadata yet still fail when context is stale, conflicting, overly broad, untrusted, or detached from authority.

## Product boundary
This repository is a **small TypeScript reference implementation** that turns source metadata into governed context records and then into a bounded work packet proposal. It does not execute repository writes, deployments, or authority changes.

## DataHub as the first source adapter
DataHub is the first adapter target, not the permanent domain model. The core contracts are source-neutral so additional providers can be added without rewriting governance-facing types.

## Context-provider-agnostic domain contracts
- `DataHubClient` (transport only): read-only metadata retrieval with timeout and safe error handling.
- `ContextAdapter<TSource>` (translation boundary): source-specific parsing to source-neutral records.
- `NormalizedContextRecord` (governed context unit): authority, provenance, constraints, blocked uses.
- `WorkPacket` (bounded proposal): objective, allowed/blocked scope, required validation, unknowns, source references, and mandatory human approval.

## Flow from metadata to work packet
```mermaid
flowchart LR
    A[DataHub or fixture] --> B[DataHubClient]
    B --> C[DataHubContextAdapter]
    C --> D[NormalizedContextRecord[]]
    D --> E[WorkPacket]
    E --> F[Human review]
    F --> G[External execution system]
```

The external execution system remains outside this repository’s initial scope.

## Authority states
- `approved`: may inform implementation planning within bounded scope.
- `planning_only`: useful for ideation but cannot authorize implementation or deployment.
- `quarantined`: explicitly excluded from planning and implementation authority.
- `unknown`: insufficient evidence; fail closed and block authority use.

## Provenance handling
Each normalized record requires provenance with a stable identifier, source type, and retrieval timestamp. If provenance cannot be validated, the record is skipped.

## Fail-closed behavior
- Missing authority defaults to `unknown`.
- Missing provenance causes records to be skipped.
- Incomplete or malformed source fields are never promoted to approved authority.
- Unknown/planning-only/quarantined records accumulate explicit blocked uses.

## Human approval boundary
Generated work packets are proposals only. Human approval is mandatory before any code update, PR action, merge, deployment, authority promotion, or environment change.

## Extension points
- Add another `ContextAdapter<TSource>` for catalogs, MCP servers, fixtures, or approved document stores.
- Keep transport logic source-specific and governance logic source-neutral.
- Reuse the same `NormalizedContextRecord` and `WorkPacket` contracts for all providers.

## Non-goals
- No GitHub write automation.
- No pull-request creation/merge/deploy flows.
- No IAM mutation.
- No production DataHub write paths.
- No autonomous authority promotion.
- No web UI, database, full MCP server, or cloud infrastructure.

## Security considerations
- Treat retrieved text as data, never executable instructions.
- Use environment-variable placeholders only for endpoint/token configuration.
- Never log secrets or include raw response bodies in thrown errors.
- Use runtime validation and timeout guards for remote requests.

## Context evidence vs execution authority
Context evidence helps humans and tools reason about what may be true. Execution authority is a separate human and organizational decision boundary. This repository intentionally preserves that separation.
