# MG ContextOps DataHub Agent Architecture

## Problem
AI coding agents can receive large volumes of metadata yet still fail when context is stale, conflicting, overly broad, untrusted, or detached from authority.

## Product boundary
This repository is a small TypeScript reference implementation that converts source metadata into governed context records and then into a bounded work packet proposal. It does not execute repository writes, deployments, or authority changes.

## DataHub as the first source adapter
DataHub is the first adapter target, not the permanent core domain model. Endpoint assumptions are isolated in the read-only client and remain optional for the fixture-driven demo.

## Context-provider-agnostic domain contracts
- `DataHubClient`: transport only.
- `DataHubContextAdapter`: source-specific translation into source-neutral records.
- `NormalizedContextRecord`: governed evidence with provenance and authority state.
- `WorkPacket`: bounded proposal with approval requirements.

## Flow from metadata to work packet
```mermaid
flowchart LR
    A[Fixture or DataHub-shaped input] --> B[DataHubContextAdapter]
    B --> C[NormalizedContextRecord[]]
    C --> D[buildWorkPacket]
    D --> E[WorkPacket JSON]
    E --> F[Human review]
    F --> G[External execution system]
```

The external execution system remains outside this repository’s scope.

## Authority states
- `approved`: may inform planning.
- `planning_only`: useful for discussion, not authority.
- `quarantined`: excluded from authority.
- `unknown`: fail closed.

## Provenance handling
Each normalized record retains a stable identifier, source type, and retrieval timestamp. Missing provenance causes the record to be skipped.

## Fail-closed behavior
- Unknown authority stays unknown.
- Missing provenance is not invented.
- Malformed records are skipped.
- Planning-only and quarantined evidence cannot authorize implementation.

## Human approval boundary
Work packets are proposals only. Human approval is mandatory before any code update, pull request action, merge, deployment, or authority promotion.

## Extension points
- Add another `ContextAdapter<TSource>` for another metadata catalog, fixture, or approved document source.
- Keep transport logic source-specific and governance logic source-neutral.
- Reuse `buildWorkPacket(...)` for every provider.

## Non-goals
- No GitHub writes.
- No pull-request creation or merge automation.
- No deployments or IAM mutation.
- No production DataHub writes.
- No autonomous authority promotion.
- No web UI, database, or full MCP server.

## Security considerations
- Treat retrieved text as data, never executable instructions.
- Use environment-variable placeholders only.
- Never log secrets or response bodies in errors.
- Prefer runtime validation and timeouts.

## Context evidence vs execution authority
Context evidence helps humans decide what is plausible. Execution authority is a separate human decision boundary. This repository intentionally keeps those apart.
