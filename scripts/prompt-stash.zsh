#!/usr/bin/env zsh
# Prompt Stash shell helpers.
#
#   source ~/prompt-stash.env         # sets PROMPT_STASH_BASE and PROMPT_STASH_API_KEY
#   source /path/to/prompt-stash.zsh  # or symlink into ~/.zshrc
#
# Functions:
#   ps-config       — print the configured endpoint and mask the key
#   ps-add          — capture a prompt (stdin, file, or inline text)
#   ps-add-file     — capture a prompt using file contents as the body
#   ps-upload-skill — upload a .zip package to /api/skills
#   ps-list         — list prompts (requires task 1: Bearer on all API paths)
#   ps-get          — fetch one prompt by id
#   ps-delete       — delete a prompt by id
#
# All functions read PROMPT_STASH_BASE and PROMPT_STASH_API_KEY. If unset, they
# fall back to http://localhost:3000 and no auth, which matches `npm run dev`.

_ps_base() { print -r -- "${PROMPT_STASH_BASE:-http://localhost:3000}"; }

_ps_headers() {
  local -a headers
  headers=(-H "Content-Type: application/json")
  if [[ -n "${PROMPT_STASH_API_KEY:-}" ]]; then
    headers+=(-H "Authorization: Bearer ${PROMPT_STASH_API_KEY}")
  fi
  print -r -- "${headers[@]}"
}

_ps_curl() {
  local url="$1"; shift
  if [[ -n "${PROMPT_STASH_API_KEY:-}" ]]; then
    curl -fsSL -H "Authorization: Bearer ${PROMPT_STASH_API_KEY}" "$@" "$url"
  else
    curl -fsSL "$@" "$url"
  fi
}

ps-config() {
  local base="$(_ps_base)"
  local key="${PROMPT_STASH_API_KEY:-}"
  if [[ -n "$key" ]]; then key="${key:0:6}…${key: -4}"; else key="(unset)"; fi
  print -r -- "PROMPT_STASH_BASE=$base"
  print -r -- "PROMPT_STASH_API_KEY=$key"
}

ps-add() {
  emulate -L zsh
  local title="" source_url="" ai_organize=true type="prompt" file=""
  while (( $# )); do
    case "$1" in
      -t|--title) title="$2"; shift 2;;
      -u|--url) source_url="$2"; shift 2;;
      -f|--file) file="$2"; shift 2;;
      --type) type="$2"; shift 2;;
      --no-organize) ai_organize=false; shift;;
      -h|--help)
        cat <<'USAGE'
ps-add [-t title] [-u source_url] [-f file | -] [--type prompt|template] [--no-organize] [text ...]
  Read prompt content from a file, stdin ("-"), or trailing args.
  Examples:
    ps-add "Draft a release note from the merged PRs"
    pbpaste | ps-add -t "Release notes"
    ps-add -f ~/notes/release.md --type template
USAGE
        return 0;;
      --) shift; break;;
      *) break;;
    esac
  done
  local content
  if [[ -n "$file" ]]; then
    if [[ "$file" == "-" ]]; then content="$(cat)"; else content="$(cat "$file")"; fi
  elif (( $# )); then
    content="$*"
  elif [[ ! -t 0 ]]; then
    content="$(cat)"
  else
    print -u2 -- "ps-add: no content (pass text, -f FILE, or pipe stdin)"; return 2
  fi
  local payload
  payload=$(python3 -c '
import json, sys
data = {"content": sys.argv[1], "type": sys.argv[2], "aiOrganize": sys.argv[3] == "true"}
if sys.argv[4]: data["title"] = sys.argv[4]
if sys.argv[5]: data["sourceUrl"] = sys.argv[5]
print(json.dumps(data))
' "$content" "$type" "$ai_organize" "$title" "$source_url") || return $?
  _ps_curl "$(_ps_base)/api/prompts" -X POST \
    -H "Content-Type: application/json" \
    --data-binary "$payload"
  print
}

ps-add-file() {
  if (( $# < 1 )); then print -u2 -- "usage: ps-add-file <path> [-t title] [--type ...]"; return 2; fi
  local path="$1"; shift
  ps-add -f "$path" "$@"
}

ps-upload-skill() {
  if (( $# < 1 )); then print -u2 -- "usage: ps-upload-skill <path/to/skill.zip>"; return 2; fi
  local path="$1"
  if [[ ! -f "$path" ]]; then print -u2 -- "ps-upload-skill: file not found: $path"; return 1; fi
  _ps_curl "$(_ps_base)/api/skills" -X POST -F "package=@${path}"
  print
}

ps-list() {
  _ps_curl "$(_ps_base)/api/prompts"
  print
}

ps-get() {
  if (( $# < 1 )); then print -u2 -- "usage: ps-get <id>"; return 2; fi
  _ps_curl "$(_ps_base)/api/prompts/$1"
  print
}

ps-delete() {
  if (( $# < 1 )); then print -u2 -- "usage: ps-delete <id>"; return 2; fi
  _ps_curl "$(_ps_base)/api/prompts/$1" -X DELETE
  print
}
