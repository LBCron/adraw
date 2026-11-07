import { describe, expect, it, vi } from "vitest"

import { AdrawCanvas } from "../canvas"
import {
  createGroup,
  createRectangle,
  createText,
  getElementAtPoint,
} from "../elements"
import { AdrawStore } from "../store"
import type {
  CanvasElement,
  GroupElement,
  RectangleElement,
  TextElement,
} from "../types"

function rectangle(
  id: string,
  overrides: Partial<RectangleElement> = {},
): RectangleElement {
  return createRectangle({
    cornerRadius: 0,
    height: 20,
    id,
    locked: false,
    rotation: 0,
    strokeColor: "#000",
    strokeWidth: 1,
    visible: true,
    width: 20,
    x: 0,
    y: 0,
    zIndex: 1,
    ...overrides,
  })
}

function text(id: string, overrides: Partial<TextElement> = {}): TextElement {
  return createText({
    autoSize: true,
    fontSize: 20,
    height: 25,
    id,
    locked: false,
    rotation: 0,
    strokeColor: "#000",
    text: "Hello",
    visible: true,
    width: 60,
    x: 0,
    y: 0,
    zIndex: 2,
    ...overrides,
  })
}

function group(
  id: string,
  children: string[],
  overrides: Partial<GroupElement> = {},
): GroupElement {
  return createGroup({
    children,
    height: 0,
    id,
    locked: false,
    rotation: 0,
    visible: true,
    width: 0,
    x: 0,
    y: 0,
    zIndex: 0,
    ...overrides,
  })
}

function setup(elements: CanvasElement[]): AdrawCanvas {
  const canvas = new AdrawCanvas()
  canvas.addElement(elements, { history: false })
  canvas.clearHistory()
  return canvas
}

describe("setLocked", () => {
  it("locks and unlocks an element with one checkpoint and one publication", () => {
    const canvas = setup([rectangle("a")])
    const store = new AdrawStore(canvas)
    const listener = vi.fn()
    store.subscribe(listener)
    const revision = store.getSnapshot().revision

    const locked = canvas.setLocked("a", true)

    expect(locked.map((element) => element.id)).toEqual(["a"])
    expect(locked[0]).toMatchObject({ locked: true })
    expect(getElementAtPoint(canvas.getElements(), { x: 10, y: 10 })).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().revision).toBe(revision + 1)
    expect(canvas.canUndo()).toBe(true)

    canvas.undo()
    expect(canvas.getElements().get("a")?.locked).toBe(false)
    expect(
      getElementAtPoint(canvas.getElements(), { x: 10, y: 10 }),
    ).not.toBeNull()
    store.dispose()
  })

  it("locks a group subtree without rewriting descendant flags", () => {
    const canvas = setup([
      rectangle("a"),
      rectangle("b", { x: 40 }),
      group("group", ["a", "b"]),
    ])
    canvas.setSelectedIds(new Set(["group", "a", "b"]))

    const updated = canvas.setLocked("group", true)

    expect(updated[0]).toMatchObject({ id: "group", locked: true })
    expect(canvas.getElements().get("a")?.locked).toBe(false)
    expect(canvas.getElements().get("b")?.locked).toBe(false)
    expect(getElementAtPoint(canvas.getElements(), { x: 10, y: 10 })).toBeNull()
    expect(getElementAtPoint(canvas.getElements(), { x: 50, y: 10 })).toBeNull()
    expect(canvas.getSelectedIds().size).toBe(0)

    canvas.setLocked("group", false)
    expect(
      getElementAtPoint(canvas.getElements(), { x: 10, y: 10 }),
    ).not.toBeNull()
  })

  it("removes locked elements from the selection", () => {
    const canvas = setup([rectangle("a"), rectangle("b", { x: 40 })])
    canvas.setSelectedIds(new Set(["a", "b"]))

    canvas.setLocked("b", true)

    expect([...canvas.getSelectedIds()]).toEqual(["a"])
  })

  it("rejects bound text lock targets", () => {
    const canvas = setup([
      rectangle("container", { height: 100, width: 100 }),
      text("label", { containerId: "container", text: "Hi" }),
    ])

    expect(() => canvas.setLocked("label", true)).toThrow(
      /derived from its container/,
    )
  })
})

describe("setVisible", () => {
  it("hides and shows an element", () => {
    const canvas = setup([rectangle("a")])

    const hidden = canvas.setVisible("a", false)

    expect(hidden[0]).toMatchObject({ visible: false })
    expect(getElementAtPoint(canvas.getElements(), { x: 10, y: 10 })).toBeNull()
    expect(canvas.toDocument().elements).toHaveLength(1)

    canvas.setVisible("a", true)
    expect(
      getElementAtPoint(canvas.getElements(), { x: 10, y: 10 }),
    ).not.toBeNull()
  })

  it("hides a group subtree without rewriting descendant flags", () => {
    const canvas = setup([
      rectangle("a"),
      rectangle("b", { x: 40 }),
      group("group", ["a", "b"]),
    ])
    canvas.setSelectedIds(new Set(["group", "a", "b"]))

    const updated = canvas.setVisible("group", false)

    expect(updated[0]).toMatchObject({ id: "group", visible: false })
    expect(canvas.getElements().get("a")?.visible).toBe(true)
    expect(canvas.getElements().get("b")?.visible).toBe(true)
    expect(getElementAtPoint(canvas.getElements(), { x: 10, y: 10 })).toBeNull()
    expect(getElementAtPoint(canvas.getElements(), { x: 50, y: 10 })).toBeNull()
    expect(canvas.getSelectedIds().size).toBe(0)

    canvas.setVisible("group", true)
    expect(
      getElementAtPoint(canvas.getElements(), { x: 10, y: 10 }),
    ).not.toBeNull()
  })

  it("removes hidden elements from the selection", () => {
    const canvas = setup([rectangle("a"), rectangle("b", { x: 40 })])
    canvas.setSelectedIds(new Set(["a", "b"]))

    canvas.setVisible("a", false)

    expect([...canvas.getSelectedIds()]).toEqual(["b"])

    // Re-selecting a hidden element and hiding it again still clamps the
    // selection even though the flag itself did not change.
    canvas.setSelectedIds(new Set(["a", "b"]))
    canvas.setVisible("a", false)
    expect([...canvas.getSelectedIds()]).toEqual(["b"])
  })

  it("derives bound text visibility from its container", () => {
    const canvas = setup([
      rectangle("container", { height: 100, width: 100 }),
      text("label", { containerId: "container", text: "Hi" }),
    ])
    canvas.setSelectedIds(new Set(["label"]))

    canvas.setVisible("container", false)

    const hidden = canvas.getElements().get("label") as TextElement
    expect(hidden.visible).toBe(false)
    expect(canvas.getSelectedIds().size).toBe(0)
    expect(getElementAtPoint(canvas.getElements(), { x: 50, y: 50 })).toBeNull()

    canvas.setVisible("container", true)
    expect((canvas.getElements().get("label") as TextElement).visible).toBe(
      true,
    )

    expect(() => canvas.setVisible("label", false)).toThrow(
      /derived from its container/,
    )
  })

  it("rejects bound text targets before mutating the batch", () => {
    const canvas = setup([
      rectangle("a"),
      rectangle("container", { height: 100, width: 100 }),
      text("label", { containerId: "container", text: "Hi" }),
    ])
    const before = canvas.getElements().get("a")

    expect(() => canvas.setVisible(["a", "label"], false)).toThrow(
      /derived from its container/,
    )
    expect(() => canvas.setLocked(["a", "label"], true)).toThrow(
      /derived from its container/,
    )

    expect(canvas.getElements().get("a")).toBe(before)
    expect(canvas.getElements().get("a")?.visible).toBe(true)
  })
})

describe("flag toggles", () => {
  it("flips each element's own locked and visible flags", () => {
    const canvas = setup([rectangle("a"), rectangle("b", { x: 40 })])

    expect(canvas.toggleLocked("a")[0]).toMatchObject({ locked: true })
    expect(canvas.toggleLocked("a")[0]).toMatchObject({ locked: false })

    canvas.toggleLocked(["a", "b"])
    expect(canvas.getElements().get("a")?.locked).toBe(true)
    expect(canvas.getElements().get("b")?.locked).toBe(true)

    canvas.toggleLocked(["a", "b"])
    expect(canvas.getElements().get("a")?.locked).toBe(false)
    expect(canvas.getElements().get("b")?.locked).toBe(false)

    canvas.toggleVisible(["a", "b"])
    expect(canvas.getElements().get("a")?.visible).toBe(false)
    expect(canvas.getElements().get("b")?.visible).toBe(false)

    canvas.toggleVisible(["a", "b"])
    expect(canvas.getElements().get("a")?.visible).toBe(true)
    expect(canvas.getElements().get("b")?.visible).toBe(true)
  })
})

describe("flag history and no-ops", () => {
  it("ignores empty, missing and already-applied targets", () => {
    const canvas = setup([rectangle("a")])
    const store = new AdrawStore(canvas)
    const revision = store.getSnapshot().revision

    expect(canvas.setLocked([], true)).toEqual([])
    expect(canvas.setVisible("missing", false)).toEqual([])
    expect(canvas.setLocked("a", false)).toHaveLength(1)

    expect(store.getSnapshot().revision).toBe(revision)
    expect(canvas.canUndo()).toBe(false)
    store.dispose()
  })

  it("skips history with { history: false } and keeps the change across undo", () => {
    const canvas = setup([rectangle("a")])

    canvas.setVisible("a", false, { history: false })
    expect(canvas.canUndo()).toBe(false)

    canvas.addElement(rectangle("b", { x: 40 }))
    canvas.undo()

    expect(canvas.getElements().get("a")?.visible).toBe(false)
    expect(canvas.getElements().has("b")).toBe(false)
  })
})
