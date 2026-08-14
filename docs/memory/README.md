# Claude Code memory — backup

Backup of this project's Claude Code auto-memory (persists agent context across
sessions). It normally lives **outside** the repo, so it is copied here so it
travels with the clone.

## Restore on a new machine

Copy these files back to Claude Code's per-project memory directory:

```bash
# Path is derived from the working directory (-Users-achisty == /Users/achisty).
DEST=~/.claude/projects/-Users-achisty/memory
mkdir -p "$DEST"
cp docs/memory/*.md "$DEST"/
```

If your new machine uses a different home directory, adjust the
`-Users-<name>` segment to match (Claude Code slugifies the working dir path).

`MEMORY.md` is the index loaded each session; the other files are one fact each.
