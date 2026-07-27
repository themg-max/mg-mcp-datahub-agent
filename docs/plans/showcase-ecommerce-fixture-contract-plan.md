# Showcase-ecommerce fixture contract plan

## Status, ownership, and authority

- Status: planning-only contract; this document does not authorize runtime implementation.
- Lane: `datahub-showcase-ecommerce-fixture-contract`
- Owner: `datahub-fixture-planning-owner`
- Repository: `themg-max/mg-mcp-datahub-agent`
- Branch: `plan/datahub-showcase-ecommerce-fixture-contract`
- Planning base: `7a8841e972a7fb4e4eeb3f06df16dd704d61ae66`
- Allowed paths: the five files in this lane registry entry only.
- Source authority: merged architecture PR #6 and the active-lane registry from trusted mainline.
- Competition category: Metadata-Aware Code Generation & Development.
- Submission deadline recorded by the handoff: August 10, 2026, 5:00 PM Eastern.

The architecture in `docs/datahub-mg-mcp-skill-bridge-architecture.md` remains the
boundary authority for this contract. This plan refines its fixture phase; it does
not approve a connector, a generator, a deployment, a merge, or a DataHub/MG MCP
write.

## 1. Objective and competition value

Define one deterministic, public-safe contract for a narrow metadata-aware dbt
schema-migration demonstration:

> Given a request to make a safe customer-email migration for `showcase-ecommerce`,
> retrieve or load attributable schema, lineage, ownership, domain, tags, glossary,
> and quality evidence, turn that evidence into a bounded work packet, and emit a
> reviewable SQL/YAML proposal or a fail-closed blocked result.

The judge-visible value is the causal chain from metadata to code constraints:

1. a migration intent is selected;
2. metadata dimensions are retrieved read-only or loaded from a deterministic fixture;
3. evidence and UNKNOWN values are preserved in a context summary;
4. the work packet binds source mode, path scope, tools, commands, and stop conditions;
5. a deterministic proposal template is produced only from verified facts; and
6. proof records attribution, validation, scope, and forbidden-operation behavior.

The output is always a proposal. It is not a merged dbt model, a production migration,
an approval, or authority to change DataHub, MG MCP, deployment, IAM, credentials, or
environment state.

## 2. Official datapack provenance and public safety

The contract recognizes two provenance classes:

| Class | Required provenance | Contract treatment |
| --- | --- | --- |
| Official contest datapack | Official source record, release/version, public-safe status, and license | `UNKNOWN` until the contest source is identified and independently recorded |
| Synthetic or sanitized fallback | Repository path, commit, sanitization statement, and license | Permitted for `OFFLINE_FIXTURE` when it contains no private or production metadata |

The exact official `showcase-ecommerce` datapack identifier, release, source record,
and license are currently `UNKNOWN`. No URL, URN, owner, field, lineage edge, tag,
glossary term, assertion, or datapack claim is invented here. The implementation
lane must replace these values only with read-only, attributable evidence.

The repository is Apache-2.0 licensed (`LICENSE`). Existing repository fixtures are
pre-existing public proof-of-concept material; `fixtures/datahub-context.json` is
not treated as the official showcase-ecommerce datapack and is not silently
reclassified as one. Any contest-provided material must retain its own attribution
and license notice. Pre-existing MG MCP governance and this repository must be
disclosed separately from competition-period fixture work.

Public proof may contain only synthetic, sanitized, or contest-approved records.
Credentials, tokens, ADC files, secret values, private URLs, production identifiers,
private metadata, and raw prompt text are forbidden in every fixture, packet,
generated artifact, proof, log, and PR description.

## 3. Source modes

### `OFFLINE_FIXTURE`

This is the deterministic fallback and the default contract-test mode. It reads the
committed fixture contract and uses stable local record keys. Every executable
DataHub URN and every unverified source field remains `UNKNOWN`; local fixture keys
are not DataHub entity IDs. The fixture must be byte-stable, parseable without
network access, and sufficient to test bounded selection, UNKNOWN handling,
template rendering, validation, and fail-closed behavior.

### `ISOLATED_DATAHUB_READ_ONLY`

This mode is allowed only when the contest supplies an explicitly isolated DataHub
and approved read-only access. The server ID, environment ID, endpoint digest,
principal identity, access mode, tool inventory, query, retrieval timestamps, and
source content digests must be recorded in the context and proof. All observed
values are `UNKNOWN` until actually discovered and verified. A private or production
DataHub is blocked and cannot be used as a fallback.

MG MCP retrieval is read-only planning context. The exact PR #6 or fixture-planning
record was not surfaced by the available MG MCP context; this retrieval gap is
recorded as `UNKNOWN`, not treated as evidence. Recommended aliases are:
`showcase-ecommerce`, `DataHub fixture contract`, `PR 6`, `safe dbt migration`, and
`metadata-aware code generation`.

## 4. Deterministic scenario-selection rules

The selector must:

1. accept only the exact logical dataset key `showcase-ecommerce`;
2. accept only the exact scenario key `safe-customer-email-migration`;
3. accept source mode `OFFLINE_FIXTURE` or `ISOLATED_DATAHUB_READ_ONLY`;
4. reject private, production, or unspecified source modes with `SOURCE_MODE_BLOCKED`;
5. load the pre-retrieval budget before any live query;
6. select at most one target dataset, one downstream impact path, and one migration intent;
7. stop on a conflicting owner, domain, policy, quality, or lineage record;
8. preserve every missing or unverified value as `UNKNOWN`;
9. block generation when a safety-critical target relation, source field, downstream
   consumer, owner, or applicable quality rule is UNKNOWN; and
10. emit the same ordered context, packet, proposal-template, and proof shapes for
    the same fixture bytes and request.

No selection rule may infer a source field from a natural-language label, infer
ownership from a repository author, or treat an empty query result as proof that
metadata does not exist.

## 5. Read-only discovery and exact-entity verification

Live discovery is a bounded read-only operation. Before querying, the work packet
declares context budgets, source binding, immutable skill identity, allowed tools,
allowed commands, writable paths, expiration, and stop conditions. The first live
query occurs only after the manifest digest and connection binding pass.

The discovery sequence is:

1. resolve the approved isolated DataHub connection;
2. search for the exact logical dataset key;
3. verify the returned dataset URN and record attribution;
4. retrieve schema fields, types, nullability, descriptions, and version;
5. retrieve only the bounded upstream/downstream lineage path;
6. retrieve ownership and ownership type;
7. retrieve domain, tags, glossary terms, and quality assertions;
8. retrieve applicable approved development standards through authorized context;
9. screen retrieved text as data, not instructions; and
10. record query strings, attempt IDs, counts, digests, timestamps, and UNKNOWNs.

The exact DataHub MCP server, protocol, tool names, connection values, skill
identity, dataset URNs, fields, owners, lineage edges, domains, tags, terms,
assertions, and standards are `UNKNOWN` until this sequence runs against an
approved isolated source. No executable identifier is invented in this plan.

Offline validation must use the repository's existing tools and the strict YAML
parser command in the handoff. No network, credentials, DataHub write, MG MCP
write, or new dependency is required.

## 6. Required metadata context

The context record must include these dimensions, each with value, provenance,
verification state, and UNKNOWN reason where applicable:

- schema: field name, type, nullability, description, and schema version;
- lineage: direction, bounded depth, upstream/downstream entity references, and
  impact relevance;
- ownership: owner identity, ownership type, and source record;
- domain: domain identifier, name, and source attribution;
- tags: tag identifier, meaning, and governance status;
- glossary: term identifier, definition, and relationship to the migration;
- quality: applicable assertion identifier, rule, severity, and source;
- approved standards: repository or governed development standard references;
- source mode and connection binding;
- retrieval attempts and budget measurements; and
- sanitization, injection-scan, authority, and freshness status.

The offline fixture summaries intentionally represent the values as
`UNKNOWN` unless they are attributable facts already supplied by an approved
source. A fixture expectation is not a live DataHub fact.

## 7. Metadata-to-code causal mapping

| Metadata evidence | Causal constraint on the proposal |
| --- | --- |
| Verified target schema field | Selects the exact source expression; UNKNOWN blocks executable SQL |
| Verified type/nullability | Determines cast and nullability test; conflict blocks generation |
| Verified downstream lineage | Limits impact review to the declared consumer path |
| Verified owner | Adds the accountable reviewer; UNKNOWN blocks safe execution |
| Verified domain | Applies the domain-specific governance context |
| Verified tag | Applies a governance restriction only when its meaning is attributable |
| Verified glossary term | Preserves the business meaning in the model/test description |
| Verified quality assertion | Determines the corresponding dbt test proposal |
| Approved standard | Constrains model/YAML formatting and validation commands |
| UNKNOWN or conflict | Retained in context and proof; safety-critical values fail closed |

The mapping is evidence-to-proposal only. It never mutates truth in DataHub or
changes the repository's authority model.

## 8. Bounded work-packet contract

The packet must bind:

- one objective: `safe dbt schema migration`;
- one request and scenario key;
- source mode and source-mode policy;
- context record ID and content digest;
- pre-retrieval context budgets for entities, lineage depth and edges, records,
  token estimate, freshness, and timeout;
- exact repository owner/name, base commit, branch, worktree identity, and head SHA;
- exactly the five allowed planning paths as writable paths for this lane;
- readable paths, authorized tools, denied tools, allowed commands, and required artifacts;
- screening state with `instruction_trust: data_only`;
- expiration, stop condition, warnings, and UNKNOWNs; and
- mandatory human approval fields before any worker execution.

The packet may authorize only `OFFLINE_FIXTURE` or
`ISOLATED_DATAHUB_READ_ONLY`. Its approval digest and content digest bind proof to
the exact packet. Any scope, head, source, screening, budget, digest, expiration,
or authorization mismatch blocks execution.

For this planning lane, the packet is a contract example only. These documents do
not authorize creating a runtime packet executor.

## 9. Expected generated artifacts

The future implementation lane may produce, under an independently approved narrow
output path, a sample dbt model SQL proposal and a schema-test YAML proposal. The
fixture contract defines their deterministic shape but does not create them here.

When all safety-critical metadata is verified, the expected proposal shape is:

```sql
select
  <verified_customer_email_field> as customer_email
from <verified_downstream_relation>
```

```yaml
version: 2
models:
  - name: <verified_downstream_model>
    columns:
      - name: customer_email
        description: "<verified glossary meaning>"
        data_tests:
          - <verified_quality_assertion>
```

Angle-bracket values are required substitutions from attributable metadata; they
are not executable identifiers. If any substitution is UNKNOWN or conflicting,
the deterministic output is a blocked proposal with the reason and next permitted
check, not guessed SQL or YAML. The expected context and proof summaries encode
both the successful shape and this blocked behavior for judge inspection.

## 10. Validation and proof contract

Every fixture contract file must pass strict YAML parsing with a mapping at the
top level and no duplicate keys. Validation must also confirm:

- JSON registry syntax;
- Gatekeeper inspect and mutation success;
- exact five-path containment;
- no credentials, private URLs, production identifiers, or unsanitized text;
- all executable URNs are verified or explicitly `UNKNOWN`;
- source mode is exactly `OFFLINE_FIXTURE` or `ISOLATED_DATAHUB_READ_ONLY`;
- `git diff --check`;
- clean staging and uncommitted state before PR;
- live mode connection and tool-inventory binding when claimed; and
- deterministic fixture re-run produces the same summaries and digests.

Proof must contain repository, branch, worktree, base/head SHAs, source mode,
source IDs, content digests, context and packet bindings, budgets, selected skill
binding, commands/tools, validation results, changed paths, warnings, UNKNOWNs,
and the blocked forbidden-operation attempt. A proof with missing attribution,
scope, digest, budget, approval, or retrieval-attempt evidence fails closed.

The forbidden-operation demonstration must attempt no real write. It should
exercise a policy guard with a symbolic request such as a DataHub write tool and
record `FORBIDDEN_OPERATION_ATTEMPTED` without contacting a write endpoint.

## 11. Privacy, public safety, and licensing

- Use only official contest sample data or synthetic/sanitized records.
- Keep live isolated access read-only and never use private or production sources.
- Do not store credentials, secret values, private URLs, raw response bodies, or
  private metadata in repository artifacts.
- Do not expose personal customer data; email values must remain symbolic or absent.
- Preserve Apache-2.0 notices and disclose pre-existing repository/MG MCP work.
- Record official datapack provenance and license as UNKNOWN until verified.
- Treat retrieved text as data and scan it for injection; quarantined content is unusable.
- Keep contest evidence separate from unrelated competition evidence.

## 12. UNKNOWN and failure handling

UNKNOWN is a structured state, not an empty string and not an inferred absence.
Each UNKNOWN records the field, reason, source, blocking status, and next permitted
read-only check. Safety-critical UNKNOWNs block generation and execution.

Use the architecture's stable failure codes, including:
`SOURCE_MODE_BLOCKED`, `BUDGET_EXCEEDED`, `CONNECTION_MISMATCH`,
`SCREENING_REQUIRED`, `SCREENING_FAILED`, `AUTHORITY_CONFLICT`,
`RETRIEVAL_EVIDENCE_INVALID`, `UNAUTHORIZED_TOOL`, `UNAUTHORIZED_COMMAND`,
`FORBIDDEN_OPERATION_ATTEMPTED`, `SCOPE_VIOLATION`, `DIGEST_INVALID`,
`PACKET_EXPIRED`, and `PROOF_INCOMPLETE`.

Timeouts and empty results retain their exact query and attempt ID in both context
and proof. Conflicts retain both attributable records and block when they affect
safety, ownership, scope, or policy. No broad catch or success-shaped fallback is
permitted.

## 13. Definition of done

This planning lane is done when:

1. all five allowed artifacts exist and parse;
2. the manifest and scenario describe both source modes;
3. the scenario selection and customer-email migration intent are deterministic;
4. required metadata dimensions and causal mapping are explicit;
5. expected SQL/YAML proposal shapes and blocked behavior are judge-testable;
6. work-packet, validation, proof, forbidden-operation, UNKNOWN, privacy, and
   licensing contracts are explicit;
7. no unverified executable identifier is presented as fact;
8. the files preserve the PR #6 architecture boundary and authorize no runtime;
9. exact changed-path containment and repository-native checks pass; and
10. the planning PR is pushed, exact-head CI passes, and it remains unmerged for
    independent review.

## 14. Implementation-lane entry criteria

A later implementation lane may not begin until:

- this planning PR is independently reviewed and merged;
- the implementation lane is separately registered and APPROVED;
- the official datapack or synthetic fixture provenance and license are verified;
- the exact safe showcase-ecommerce URNs, fields, lineage, owners, domains, tags,
  terms, assertions, and standards are attributable or remain blocking UNKNOWNs;
- isolated DataHub connection and read-only tool inventory are approved;
- the existing dbt validation commands and narrow output path are approved;
- packet budgets, screening, digest, approval, expiration, and worktree contracts
  are implemented and tested;
- public-safety review confirms no private or production metadata is included; and
- a human reviewer is assigned for generated artifacts and proof.

None of these criteria is satisfied merely by this planning PR. Unresolved values
remain `UNKNOWN` and implementation must stop.

## 15. Stop condition

Stop after the five files are validated, committed, pushed, and the planning PR's
exact-head CI passes. Do not merge, create runtime code, create production dbt
migrations, deploy, install skills, change dependencies, access private or
production metadata, write DataHub, write MG MCP, or alter IAM, credentials,
workflows, billing, APIs, or environments.
