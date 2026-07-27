#!/usr/bin/env bash

mode="${1:-inspect}"
expected_slug="themg-max/mg-mcp-datahub-agent"
expected_commit="1e5e7a19bfff280d351373ae43c41cefeaab56f9"
expected_package="@themg/contextops-datahub-agent"
architecture_artifact="docs/datahub-skill-execution-architecture.md"
registry_path=".ai/active-lanes/datahub-devpost.json"

case "$mode" in
  inspect|mutation|merge|cleanup) ;;
  *) printf 'ERROR invalid mode: %s\nUsage: %s [inspect|mutation|merge|cleanup]\n' "$mode" "$0" >&2; exit 2 ;;
esac

root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  printf '%s\n' 'ERROR not inside a Git repository' >&2
  exit 10
}
proposal_registry="$root/$registry_path"

normalize_remote() {
  value="$1"
  value="${value#git@github.com:}"
  value="${value#ssh://git@github.com/}"
  value="${value#https://github.com/}"
  value="${value#http://github.com/}"
  value="${value%/}"
  value="${value%.git}"
  printf '%s\n' "$value"
}

origin="$(git -C "$root" remote get-url origin 2>/dev/null || true)"
identity_mode=""
normalized_slug=""
if [ -n "$origin" ]; then
  normalized_slug="$(normalize_remote "$origin")"
  if [ "$normalized_slug" != "$expected_slug" ]; then
    printf 'ERROR wrong repository: expected %s, found %s\n' "$expected_slug" "$normalized_slug" >&2
    exit 11
  fi
  identity_mode="REMOTE_VERIFIED"
else
  if [ ! -f "$root/$architecture_artifact" ] || [ ! -f "$root/package.json" ]; then
    printf '%s\n' 'ERROR required snapshot identity artifact missing' >&2
    exit 16
  fi
  if ! command -v node >/dev/null 2>&1; then
    printf '%s\n' 'ERROR required dependency missing: node' >&2
    exit 16
  fi
  package_name="$(node -p "require(process.argv[1]).name" "$root/package.json" 2>/dev/null || true)"
  if [ "$package_name" != "$expected_package" ] || ! git -C "$root" merge-base --is-ancestor "$expected_commit" HEAD 2>/dev/null; then
    printf '%s\n' 'ERROR snapshot repository identity verification failed' >&2
    exit 11
  fi
  identity_mode="SNAPSHOT_VERIFIED"
fi

branch="$(git -C "$root" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
authority_source="UNRESOLVED"
authority_ref="NONE"
authority_commit="NONE"
authority_error=""
authority_registry=""

cleanup_authority_registry() {
  if [ -n "$authority_registry" ]; then
    rm -f "$authority_registry"
  fi
}
trap cleanup_authority_registry EXIT

resolve_authority() {
  candidate=""
  if [ "$identity_mode" = "REMOTE_VERIFIED" ]; then
    if [ "${GATEKEEPER_CI_PR_BASE_SHA+x}" = "x" ]; then
      authority_source="CI_PR_BASE_SHA"
      authority_ref="GATEKEEPER_CI_PR_BASE_SHA"
      candidate="$GATEKEEPER_CI_PR_BASE_SHA"
      trusted_main_commit="$(git -C "$root" rev-parse --verify "origin/main^{commit}" 2>/dev/null || true)"
      if [ -z "$trusted_main_commit" ]; then
        authority_error="origin/main is unavailable"
        return
      fi
      if [[ ! "$candidate" =~ ^[0-9A-Fa-f]{40}$ ]]; then
        authority_error="GATEKEEPER_CI_PR_BASE_SHA must be exactly 40 hexadecimal characters"
        return
      fi
      if [ "$(git -C "$root" cat-file -t "$candidate" 2>/dev/null || true)" != "commit" ]; then
        authority_error="GATEKEEPER_CI_PR_BASE_SHA is not a commit in the expected repository"
        return
      fi
      if ! git -C "$root" merge-base --is-ancestor "$candidate" HEAD 2>/dev/null; then
        authority_error="GATEKEEPER_CI_PR_BASE_SHA is not an ancestor of HEAD"
        return
      fi
      if ! git -C "$root" merge-base --is-ancestor "$candidate" "$trusted_main_commit" 2>/dev/null; then
        authority_error="GATEKEEPER_CI_PR_BASE_SHA is not an ancestor of trusted origin/main"
        return
      fi
      authority_commit="$candidate"
    else
      authority_source="ORIGIN_MAIN"
      authority_ref="origin/main"
      authority_commit="$(git -C "$root" rev-parse --verify "origin/main^{commit}" 2>/dev/null || true)"
      if [ -z "$authority_commit" ]; then
        authority_commit="NONE"
        authority_error="origin/main is unavailable"
        return
      fi
      if ! git -C "$root" merge-base --is-ancestor "$authority_commit" HEAD 2>/dev/null; then
        authority_error="origin/main is not an ancestor of HEAD"
        return
      fi
    fi
  else
    authority_source="SNAPSHOT_BASE"
    authority_ref="$expected_commit"
    authority_commit="$expected_commit"
    if [ "$(git -C "$root" cat-file -t "$authority_commit" 2>/dev/null || true)" != "commit" ] || \
       ! git -C "$root" merge-base --is-ancestor "$authority_commit" HEAD 2>/dev/null; then
      authority_commit="NONE"
      authority_error="snapshot base authority is unavailable"
      return
    fi
  fi

  authority_registry="$(mktemp "${TMPDIR:-/tmp}/gatekeeper-authority.XXXXXX")" || {
    authority_registry=""
    authority_error="unable to create the authority registry buffer"
    return
  }
  if ! git -C "$root" show "$authority_commit:$registry_path" >"$authority_registry" 2>/dev/null; then
    rm -f "$authority_registry"
    authority_registry=""
    authority_error="trusted authority does not contain the active-lane registry"
  fi
}

resolve_lane() {
  node -e '
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const [registryPath, expectedSlug, branch, root, authorityCommit] = process.argv.slice(1);
const statuses = ["PROPOSED", "PLANNING_ONLY", "APPROVED", "VERIFIED", "SUPERSEDED", "UNKNOWN"];
let registry;
try { registry = JSON.parse(fs.readFileSync(registryPath, "utf8")); } catch { process.exit(2); }
if (!registry || registry.repository !== expectedSlug) process.exit(3);
if (!Array.isArray(registry.allowed_statuses) || registry.allowed_statuses.length !== statuses.length ||
    statuses.some((status, index) => registry.allowed_statuses[index] !== status) || !Array.isArray(registry.lanes)) process.exit(2);

const branchFields = ["durable_branch", "managed_workspace_branch", "branch"];
const invalidPatternChars = /[*?[\]{}^$|()+\\]/;
const cleanText = (value) => typeof value === "string" && value.length > 0 && !/[\r\n\t\0]/.test(value);
const validateAllowedPaths = (lane) => {
  if (!Array.isArray(lane.allowed_paths) || lane.allowed_paths.length === 0) return false;
  const seen = new Set();
  for (const entry of lane.allowed_paths) {
    if (!cleanText(entry) || path.posix.isAbsolute(entry) || /^[A-Za-z]:[\\/]/.test(entry) ||
        entry.endsWith("/") || path.posix.normalize(entry) !== entry ||
        entry.split("/").some((part) => part === "" || part === "." || part === ".." || part.toLowerCase() === ".git") ||
        invalidPatternChars.test(entry) || seen.has(entry)) return false;
    seen.add(entry);
    const objectType = spawnSync("git", ["-C", root, "cat-file", "-t", `${authorityCommit}:${entry}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (objectType.status === 0 && objectType.stdout.trim() === "tree") return false;
  }
  return true;
};

for (const lane of registry.lanes) {
  if (!lane || !cleanText(lane.id) || typeof lane.status !== "string" || !statuses.includes(lane.status)) process.exit(2);
  const mappedFields = branchFields.filter((field) => lane[field] !== undefined);
  if (mappedFields.some((field) => !cleanText(lane[field]))) process.exit(2);
}

const matches = registry.lanes.filter((lane) => lane && branchFields.some((field) => lane[field] === branch));
if (matches.length !== 1) process.exit(1);
const lane = matches[0];
if (lane.status === "APPROVED" && (!cleanText(lane.owner) || !validateAllowedPaths(lane))) process.exit(2);
const field = (value) => String(value || "").replace(/[\r\n\t]/g, " ");
process.stdout.write([field(lane.id), field(lane.status), field(lane.owner)].join("\t") + "\n");
if (Array.isArray(lane.allowed_paths)) {
  for (const allowedPath of lane.allowed_paths) process.stdout.write(allowedPath + "\n");
}
' "$authority_registry" "$expected_slug" "$branch" "$root" "$authority_commit"
}

# Validate committed changes between authority_commit and HEAD against allowed_paths
# Returns 0 on pass, exits with 14 for out-of-scope, 15 for collection/parsing error
validate_committed_scope() {
  if [ -z "$authority_commit" ] || [ "$authority_commit" = "NONE" ]; then
    printf '%s\n' 'ERROR trusted authority commit is unavailable for committed-scope validation' >&2
    exit 15
  fi
  committed_file="$(mktemp "${TMPDIR:-/tmp}/gatekeeper-committed.XXXXXX")" || {
    printf '%s\n' 'ERROR unable to buffer committed-diff' >&2
    exit 15
  }
  if ! git -C "$root" diff --name-status -z "$authority_commit" HEAD >"$committed_file" 2>/dev/null; then
    rm -f "$committed_file"
    printf '%s\n' 'ERROR unable to collect committed diff between authority and HEAD' >&2
    exit 15
  fi
  committed_paths=()
  while IFS= read -r -d '' status_code; do
    case "${status_code:0:1}" in
      R|C)
        IFS= read -r -d '' src || { rm -f "$committed_file"; printf '%s\n' 'ERROR malformed committed-diff rename record' >&2; exit 15; }
        IFS= read -r -d '' dst || { rm -f "$committed_file"; printf '%s\n' 'ERROR malformed committed-diff rename record' >&2; exit 15; }
        committed_paths+=("$src")
        committed_paths+=("$dst")
        ;;
      *)
        IFS= read -r -d '' p || { rm -f "$committed_file"; printf '%s\n' 'ERROR malformed committed-diff record' >&2; exit 15; }
        committed_paths+=("$p")
        ;;
    esac
  done <"$committed_file"
  rm -f "$committed_file"

  for changed_path in "${committed_paths[@]}"; do
    path_allowed=false
    for allowed_path in "${allowed_paths[@]}"; do
      if [ "$changed_path" = "$allowed_path" ]; then
        path_allowed=true
        break
      fi
    done
    if [ "$path_allowed" != true ]; then
      printf 'ERROR committed path is outside the active lane scope: %s\n' "$changed_path" >&2
      exit 14
    fi
  done
  return 0
}

resolve_authority
lane_id="NONE"
lane_status="UNKNOWN"
lane_owner=""
lane_data=""
lane_result=1
if [ -n "$authority_registry" ]; then
  lane_data="$(resolve_lane 2>/dev/null)"
  lane_result=$?
fi

authority_invalid=false
case "$lane_result" in
  0) IFS=$'\t' read -r lane_id lane_status lane_owner <<< "$lane_data" ;;
  1) ;;
  3)
    printf '%s\n' 'ERROR active-lane authority repository does not match the durable repository' >&2
    exit 11
    ;;
  *)
    authority_invalid=true
    authority_error="trusted active-lane authority is malformed"
    ;;
esac

allowed_paths=()
if [ "$lane_result" -eq 0 ]; then
  while IFS= read -r allowed_path; do
    allowed_paths+=("$allowed_path")
  done < <(printf '%s\n' "$lane_data" | tail -n +2)
fi

printf 'mode=%s\nroot=%s\nidentity=%s\nrepository=%s\nbranch=%s\n' \
  "$mode" "$root" "$identity_mode" "$expected_slug" "${branch:-DETACHED}"
printf 'authority_source=%s\nauthority_ref=%s\nauthority_commit=%s\nproposal_registry=%s\n' \
  "$authority_source" "$authority_ref" "$authority_commit" "$proposal_registry"
printf 'lane=%s\nstatus=%s\nowner=%s\nallowed_paths=%s\n' \
  "$lane_id" "$lane_status" "${lane_owner:-NONE}" "${#allowed_paths[@]}"

if [ "$mode" = "inspect" ]; then
  if [ -n "$authority_error" ]; then
    printf 'authority_note=%s\n' "$authority_error"
  fi
  if [ "$authority_invalid" = true ]; then
    printf '%s\n' 'ERROR trusted active-lane authority is malformed' >&2
    exit 15
  fi
  printf '%s\n' 'result=PASS (read-only inspection)'
  exit 0
fi

if [ -z "$branch" ]; then
  printf '%s\n' 'ERROR detached HEAD is not allowed for this mode' >&2
  exit 12
fi

if [ "$mode" = "mutation" ]; then
  if [ "$branch" = "main" ]; then
    printf '%s\n' 'ERROR mutation on main is prohibited' >&2
    exit 13
  fi
  if [ "$identity_mode" = "SNAPSHOT_VERIFIED" ]; then
    printf '%s\n' 'ERROR mutation requires REMOTE_VERIFIED trusted-mainline authority' >&2
    exit 15
  fi
  if [ -n "$authority_error" ] || [ "$authority_invalid" = true ]; then
    printf 'ERROR mutation authority is unavailable or invalid: %s\n' "${authority_error:-unknown authority error}" >&2
    exit 15
  fi
  if [ "$lane_id" = "NONE" ] || [ "$lane_status" != "APPROVED" ] || [ -z "$lane_owner" ]; then
    printf '%s\n' 'ERROR current branch requires an approved lane from trusted mainline authority with an owner' >&2
    exit 15
  fi

  # Collect worktree status (staged, unstaged, untracked) using fail-closed semantics
  status_file="$(mktemp "${TMPDIR:-/tmp}/gatekeeper-status.XXXXXX")" || {
    printf '%s\n' 'ERROR unable to buffer Git worktree status' >&2
    exit 15
  }
  git -C "$root" status --porcelain=v1 -z --untracked-files=all >"$status_file"
  status_result=$?
  if [ "$status_result" -ne 0 ]; then
    rm -f "$status_file"
    printf '%s\n' 'ERROR unable to read Git worktree status' >&2
    exit 15
  fi

  # Parse worktree status into changed_paths. Porcelain v1 -z entries are NUL-delimited
  changed_paths=()
  while IFS= read -r -d '' status_record; do
    # status_record structure: XY<space>path (but with -z the record contains the two-letter status and a space then path)
    status_code="${status_record:0:2}"
    changed_paths+=("${status_record:3}")
    if [[ "$status_code" == *R* || "$status_code" == *C* ]]; then
      # For renames/copies the porcelain output pairs source and destination as subsequent NUL entries
      IFS= read -r -d '' source_path || {
        rm -f "$status_file"
        printf '%s\n' 'ERROR malformed Git porcelain rename record' >&2
        exit 15
      }
      changed_paths+=("$source_path")
    fi
  done <"$status_file"
  rm -f "$status_file"

  # Collect committed changes between trusted authority_commit and HEAD using NUL-delimited diff to preserve spaces and rename pairs
  committed_file="$(mktemp "${TMPDIR:-/tmp}/gatekeeper-committed.XXXXXX")" || {
    printf '%s\n' 'ERROR unable to buffer committed-diff' >&2
    exit 15
  }
  # Use --name-status -z to get status codes and NUL-separated path records; this preserves rename pairs and spaces
  if ! git -C "$root" diff --name-status -z "$authority_commit" HEAD >"$committed_file" 2>/dev/null; then
    rm -f "$committed_file"
    printf '%s\n' 'ERROR unable to collect committed diff between authority and HEAD' >&2
    exit 15
  fi

  committed_paths=()
  # Parse NUL-delimited name-status records
  while IFS= read -r -d '' status_code; do
    case "${status_code:0:1}" in
      R|C)
        # rename/copy: next two NUL entries are source and destination
        IFS= read -r -d '' src || { rm -f "$committed_file"; printf '%s\n' 'ERROR malformed committed-diff rename record' >&2; exit 15; }
        IFS= read -r -d '' dst || { rm -f "$committed_file"; printf '%s\n' 'ERROR malformed committed-diff rename record' >&2; exit 15; }
        committed_paths+=("$src")
        committed_paths+=("$dst")
        ;;
      *)
        # single-path records (A, M, D, etc.)
        IFS= read -r -d '' p || { rm -f "$committed_file"; printf '%s\n' 'ERROR malformed committed-diff record' >&2; exit 15; }
        committed_paths+=("$p")
        ;;
    esac
  done <"$committed_file"
  rm -f "$committed_file"

  # Form the union of committed_paths and worktree changed_paths (deduplicate)
  declare -A effective_map
  for p in "${committed_paths[@]}"; do effective_map["$p"]=1; done
  for p in "${changed_paths[@]}"; do effective_map["$p"]=1; done

  effective_paths=()
  for p in "${!effective_map[@]}"; do effective_paths+=("$p"); done

  # Validate every effective path literally against trusted allowed_paths
  for changed_path in "${effective_paths[@]}"; do
    path_allowed=false
    for allowed_path in "${allowed_paths[@]}"; do
      if [ "$changed_path" = "$allowed_path" ]; then
        path_allowed=true
        break
      fi
    done
    if [ "$path_allowed" != true ]; then
      printf 'ERROR path is outside the active lane scope: %s\n' "$changed_path" >&2
      exit 14
    fi
  done

  printf '%s\n' 'result=PASS (validation only; no mutation performed)'
  exit 0
fi

if [ "$identity_mode" != "REMOTE_VERIFIED" ]; then
  if [ "$mode" = "merge" ]; then
    printf '%s\n' 'ERROR merge validation requires REMOTE_VERIFIED identity; no merge was performed' >&2
    exit 17
  fi
  printf '%s\n' 'ERROR cleanup validation requires REMOTE_VERIFIED identity; nothing was deleted' >&2
  exit 18
fi

if [ "$mode" = "merge" ]; then
  if [ -n "$authority_error" ] || [ "$authority_invalid" = true ]; then
    printf 'ERROR merge authority is unavailable or invalid: %s\n' "${authority_error:-unknown authority error}" >&2
    exit 15
  fi

  # Require committed-scope validation before merge may return success
  if ! validate_committed_scope; then
    # validate_committed_scope will exit with appropriate code on failure
    # but in case it returns non-zero without exiting, fail closed with 15
    printf '%s\n' 'ERROR committed-scope validation failed during merge' >&2
    exit 15
  fi

  if [[ "$GATEKEEPER_PR_NUMBER" =~ ^[0-9]+$ ]] && \
     [[ "$GATEKEEPER_EXPECTED_HEAD" =~ ^[0-9A-Fa-f]{40}$ ]] && \
     [[ "$GATEKEEPER_CURRENT_HEAD" = "$GATEKEEPER_EXPECTED_HEAD" ]] && \
     [ "$GATEKEEPER_CHECKS_STATUS" = "SUCCESS" ] && \
     [ "$GATEKEEPER_REVIEW_THREADS" = "RESOLVED" ] && \
     { [ "$GATEKEEPER_DISPOSITION" = "APPROVE" ] || [ "$GATEKEEPER_DISPOSITION" = "APPROVE_WITH_FOLLOW_UP" ]; } && \
     [ "$GATEKEEPER_HUMAN_AUTHORIZED" = "true" ]; then
    printf '%s\n' 'result=PASS (merge evidence complete; no merge performed)'
    exit 0
  fi
  printf '%s\n' 'ERROR merge evidence is incomplete or invalid; no merge was performed' >&2
  exit 17
fi

if [ "$GATEKEEPER_PR_STATE" = "MERGED" ] && \
   [[ "$GATEKEEPER_MERGE_COMMIT" =~ ^[0-9A-Fa-f]{40}$ ]] && \
   git -C "$root" cat-file -e "${GATEKEEPER_MERGE_COMMIT}^{commit}" 2>/dev/null; then
  main_ref="origin/main"
  if ! git -C "$root" rev-parse --verify --quiet "$main_ref" >/dev/null; then
    main_ref="main"
  fi
  if git -C "$root" rev-parse --verify --quiet "$main_ref" >/dev/null && \
     git -C "$root" merge-base --is-ancestor "$GATEKEEPER_MERGE_COMMIT" "$main_ref"; then
    printf '%s\n' 'result=PASS (cleanup evidence complete; nothing was deleted)'
    exit 0
  fi
fi
printf '%s\n' 'ERROR cleanup evidence is incomplete or invalid; nothing was deleted' >&2
exit 18
