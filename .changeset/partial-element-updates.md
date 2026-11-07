---
"@adraw/core": minor
---

Add `updateElement` and `updateElements` for validated partial element updates. Patches reject immutable (`id`, `type`) and derived fields, re-synchronize arrow bindings, bound text and group bounds, record one history checkpoint and publish one state snapshot per call. Groups translate their subtree with `x`/`y`, restack as a unit with `zIndex`, propagate `opacity` to leaves and can rewire `children`. Media `src` changes now update the mounted SVG image in place.
