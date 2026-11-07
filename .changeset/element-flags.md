---
"@adraw/core": minor
---

Add `setLocked` / `setVisible` and `toggleLocked` / `toggleVisible` for element flags. Group flags propagate through inherited state without rewriting descendant flags, and locking or hiding the current selection removes the affected subtree (including bound text) from the selection. Bound text now derives both its lock state and visibility from its container, so direct flag changes on bound text are rejected.
