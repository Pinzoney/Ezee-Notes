# Restoring this memory on another machine

These `.md` files are a snapshot of the Claude Code auto-memory for this project. They
are NOT auto-loaded from here — Claude reads project memory from your **home**
directory, keyed by a hash of the repo's absolute path. To use them on a new machine:

1. Clone/pull the repo. If you clone it to the **same absolute path** as the original
   (`C:\Projects\Ezee-Notes`), the hash folder name matches: `c--Projects-Ezee-Notes`.
   A different path → a different hash folder name (Claude creates it on first use;
   check `~/.claude/projects/` for the folder matching this repo).

2. Copy every `.md` here (except this file) into:
   `C:\Users\<you>\.claude\projects\<hash-for-this-repo>\memory\`

   PowerShell, same-path clone:
   ```powershell
   $dst = "$env:USERPROFILE\.claude\projects\c--Projects-Ezee-Notes\memory"
   New-Item -ItemType Directory -Force $dst | Out-Null
   Copy-Item ".\.claude\memory\*.md" $dst -Exclude "HOW-TO-RESTORE.md"
   ```

3. Everything in these files is also in the repo-root `CLAUDE.md`, which *does* load
   automatically — so even without step 2 the laptop gets the context. Restoring the
   raw files just makes the laptop's memory *system* (future recalls/updates) start
   from the same state.

Once your laptop has these, you can stop tracking this folder:
```
git rm -r --cached .claude/memory
echo ".claude/memory/" >> .gitignore
```
