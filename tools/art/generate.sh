#!/bin/sh
# Generates one picture with the Codex CLI and its imagegen skill.
#
#   tools/art/generate.sh <job> [reference picture ...]
#
# <job> names a prompt in tools/art/prompts. The work happens in a scratch
# folder outside the repo; the result is left there for you to look at before
# you copy it into tools/art/sheets. Nothing is overwritten.
set -e
job="$1"; shift
here="$(cd "$(dirname "$0")" && pwd)"
work="${TMPDIR:-/tmp}/taiko-nights-art/$job"
mkdir -p "$work"
cp "$here/prompts/$job.md" "$work/prompt.md"
images=""
for picture in "$@"; do
  cp "$picture" "$work/"
  images="$images -i $work/$(basename "$picture")"
done
cd "$work"
# shellcheck disable=SC2086
codex exec --skip-git-repo-check --sandbox workspace-write -C "$work" -c model_reasoning_effort="medium" $images -o result.md - < prompt.md > codex.log 2>&1
echo "Finished. Look in $work"
