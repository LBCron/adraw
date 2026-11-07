import { describe, expect, it, vi } from "vitest"

import { AdrawCanvas } from "../canvas"
import {
  createArrow,
  createDiamond,
  createEllipse,
  createGroup,
  createLine,
  createMedia,
  createNote,
  createPath,
  createRectangle,
  createText,
  getElementAtPoint,
} from "../elements"
import { AdrawStore } from "../store"
import type {
  ArrowElement,
  CanvasElement,
  DiamondElement,
  EllipseElement,
  GroupElement,
  LineElement,
  MediaElement,
  NoteElement,
  PathElement,
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

function ellipse(
  id: string,
  overrides: Partial<EllipseElement> = {},
): EllipseElement {
  return createEllipse({
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

function diamond(
  id: string,
  overrides: Partial<DiamondElement> = {},
): DiamondElement {
  return createDiamond({
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

function line(id: string, overrides: Partial<LineElement> = {}): LineElement {
  return createLine({
    endX: 100,
    endY: 50,
    height: 50,
    id,
    locked: false,
    rotation: 0,
    startX: 0,
    startY: 0,
    strokeColor: "#000",
    strokeWidth: 2,
    visible: true,
    width: 100,
    x: 0,
    y: 0,
    zIndex: 1,
    ...overrides,
  })
}

function arrow(
  id: string,
  overrides: Partial<ArrowElement> = {},
): ArrowElement {
  return createArrow({
    endArrowhead: true,
    endBinding: null,
    endX: 50,
    endY: 10,
    height: 1,
    id,
    locked: false,
    rotation: 0,
    startArrowhead: false,
    startBinding: null,
    startX: -50,
    startY: 10,
    strokeColor: "#000",
    strokeWidth: 2,
    visible: true,
    width: 100,
    x: -50,
    y: 10,
    zIndex: 2,
    ...overrides,
  })
}

function path(id: string, overrides: Partial<PathElement> = {}): PathElement {
  return createPath({
    height: 10,
    id,
    locked: false,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    rotation: 0,
    smoothing: 0.5,
    strokeColor: "#000",
    strokeWidth: 2,
    visible: true,
    width: 10,
    x: 0,
    y: 0,
    zIndex: 1,
    ...overrides,
  })
}

function media(
  id: string,
  overrides: Partial<MediaElement> = {},
): MediaElement {
  return createMedia({
    height: 50,
    id,
    locked: false,
    mimeType: "image/png",
    naturalHeight: 100,
    naturalWidth: 200,
    rotation: 0,
    src: "data:image/png;base64,old",
    visible: true,
    width: 100,
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
    zIndex: 1,
    ...overrides,
  })
}

function note(id: string, overrides: Partial<NoteElement> = {}): NoteElement {
  return createNote({
    cornerRadius: 10,
    fillColor: "#ffd43b",
    fontSize: 20,
    height: 200,
    id,
    locked: false,
    padding: 16,
    rotation: 0,
    strokeColor: "#000",
    text: "Hi",
    visible: true,
    width: 200,
    x: 0,
    y: 0,
    zIndex: 1,
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

describe("updateElement", () => {
  it("updates a rectangle, preserves identity and records one checkpoint", () => {
    const canvas = setup([
      rectangle("rect", { height: 50, width: 100, x: 10, y: 20 }),
    ])
    canvas.setSelectedIds(new Set(["rect"]))

    const updated = canvas.updateElement("rect", {
      fillColor: "#ffd43b",
      opacity: 0.5,
      strokeWidth: 4,
      x: 40,
    })

    expect(updated).toMatchObject({
      fillColor: "#ffd43b",
      height: 50,
      id: "rect",
      opacity: 0.5,
      strokeWidth: 4,
      type: "rectangle",
      width: 100,
      x: 40,
      y: 20,
    })
    expect(canvas.getElements().get("rect")).toBe(updated)
    expect(canvas.getSelectedIds()).toEqual(new Set(["rect"]))
    expect(canvas.canUndo()).toBe(true)

    canvas.undo()
    expect(canvas.getElements().get("rect")).toMatchObject({
      strokeWidth: 1,
      x: 10,
    })
    expect(
      (canvas.getElements().get("rect") as RectangleElement).fillColor,
    ).toBeUndefined()
  })

  it("normalizes rotation and updates z-order", () => {
    const canvas = setup([rectangle("rect")])

    const updated = canvas.updateElement("rect", { rotation: 450, zIndex: 5 })

    expect(updated).toMatchObject({ rotation: 90, zIndex: 5 })
  })

  it("updates ellipse and diamond fields", () => {
    const canvas = setup([ellipse("ellipse"), diamond("diamond")])

    const updatedEllipse = canvas.updateElement("ellipse", {
      fillColor: "#f00",
      strokeWidth: 3,
    })
    const updatedDiamond = canvas.updateElement("diamond", {
      fillColor: "#0f0",
      opacity: 0.4,
    })

    expect(updatedEllipse).toMatchObject({ fillColor: "#f00", strokeWidth: 3 })
    expect(updatedDiamond).toMatchObject({ fillColor: "#0f0", opacity: 0.4 })
  })

  it("updates line endpoints, recomputes bounds and translates the line", () => {
    const canvas = setup([line("line")])

    const resized = canvas.updateElement("line", {
      endX: 120,
      endY: 60,
      startX: 20,
      startY: 10,
    })
    expect(resized).toMatchObject({
      endX: 120,
      endY: 60,
      height: 50,
      startX: 20,
      startY: 10,
      width: 100,
      x: 20,
      y: 10,
    })

    const moved = canvas.updateElement("line", { x: 30, y: 20 })
    expect(moved).toMatchObject({
      endX: 130,
      endY: 70,
      startX: 30,
      startY: 20,
      x: 30,
      y: 20,
    })

    expect(() => canvas.updateElement("line", { width: 300 })).toThrow(
      /derived from the line endpoints/,
    )
  })

  it("updates arrow bindings and follows a moved target", () => {
    const canvas = setup([
      rectangle("target", { height: 20, width: 20 }),
      arrow("arrow", {
        endBinding: { elementId: "target" },
      }),
    ])

    const before = canvas.getElements().get("arrow") as ArrowElement
    expect(before.endX).toBe(-4)
    expect(before.endY).toBe(10)

    canvas.updateElement("target", { x: 100 })

    const followed = canvas.getElements().get("arrow") as ArrowElement
    expect(followed.endX).toBe(96)
    expect(followed.endY).toBe(10)
    expect(followed.endBinding).toEqual({ elementId: "target" })

    const detached = canvas.updateElement("arrow", {
      endBinding: null,
      endX: 200,
      endY: 30,
    }) as ArrowElement
    expect(detached.endBinding).toBeNull()
    expect(detached).toMatchObject({ endX: 200, endY: 30, x: -50, y: 10 })

    expect(() =>
      canvas.updateElement("arrow", {
        endBinding: { elementId: "missing" },
      }),
    ).toThrow(/does not exist or is not bindable/)
  })

  it("updates path points and translates them with x/y", () => {
    const canvas = setup([path("path")])

    const resized = canvas.updateElement("path", {
      points: [
        { x: 5, y: 5 },
        { x: 25, y: 15 },
      ],
    }) as PathElement
    expect(resized.points).toEqual([
      { x: 5, y: 5 },
      { x: 25, y: 15 },
    ])
    expect(resized).toMatchObject({ height: 10, width: 20, x: 5, y: 5 })

    const moved = canvas.updateElement("path", { x: 10, y: 20 }) as PathElement
    expect(moved.points).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 30 },
    ])
    expect(moved).toMatchObject({ height: 10, width: 20, x: 10, y: 20 })

    expect(() => canvas.updateElement("path", { width: 100 })).toThrow(
      /derived from the path points/,
    )
    expect(() =>
      canvas.updateElement("path", { points: [{ x: 0, y: 0 }] }),
    ).toThrow(/at least two points/)
  })

  it("updates media fields", () => {
    const canvas = setup([media("media")])

    const updated = canvas.updateElement("media", {
      height: 60,
      mimeType: "image/webp",
      naturalHeight: 200,
      naturalWidth: 400,
      src: "data:image/webp;base64,new",
      width: 120,
    })

    expect(updated).toMatchObject({
      height: 60,
      mimeType: "image/webp",
      naturalHeight: 200,
      naturalWidth: 400,
      src: "data:image/webp;base64,new",
      width: 120,
    })
    expect(() => canvas.updateElement("media", { naturalWidth: 0 })).toThrow(
      /greater than 0/,
    )
  })

  it("updates free text, re-measures it and switches to fixed width", () => {
    const canvas = setup([text("text")])

    const longer = canvas.updateElement("text", {
      text: "Hello world",
    }) as TextElement
    expect(longer.width).toBeGreaterThan(60)
    expect(longer.height).toBe(25)
    expect(longer.autoSize).toBe(true)

    const bigger = canvas.updateElement("text", {
      fontSize: 40,
    }) as TextElement
    expect(bigger.height).toBe(50)
    expect(bigger.width).toBeGreaterThan(longer.width)

    const fixed = canvas.updateElement("text", { width: 100 }) as TextElement
    expect(fixed.autoSize).toBe(false)
    expect(fixed.width).toBe(100)
    expect(fixed.height).toBeGreaterThan(50)

    expect(() => canvas.updateElement("text", { height: 80 })).toThrow(
      /derived from the text layout/,
    )
    expect(() => canvas.updateElement("text", { wrapWidth: 100 })).toThrow(
      /derived from the text layout/,
    )
    expect(() =>
      canvas.updateElement("text", { autoSize: true, width: 100 }),
    ).toThrow(/cannot be combined/)

    const autosized = canvas.updateElement("text", {
      autoSize: true,
    }) as TextElement
    expect(autosized.autoSize).toBe(true)
    expect(autosized.width).toBeGreaterThan(100)
  })

  it("updates bound text through its container and rejects derived fields", () => {
    const canvas = setup([
      rectangle("container", { height: 100, width: 100 }),
      rectangle("other", { height: 100, width: 100, x: 200 }),
      text("label", {
        containerId: "container",
        height: 25,
        text: "Hi",
        width: 40,
      }),
    ])

    const bound = canvas.getElements().get("label") as TextElement
    expect(bound.autoSize).toBe(false)
    expect(bound.wrapWidth).toBe(90)
    expect(bound.x + bound.width / 2).toBeCloseTo(50)
    expect(bound.y + bound.height / 2).toBeCloseTo(50)

    const longer = canvas.updateElement("label", {
      text: "A much longer label",
    }) as TextElement
    expect(longer.width).toBeLessThanOrEqual(90)
    expect(longer.height).toBeGreaterThan(25)
    expect(longer.x + longer.width / 2).toBeCloseTo(50)
    expect(longer.y + longer.height / 2).toBeCloseTo(50)

    canvas.updateElement("container", { width: 200 })
    const rewrapped = canvas.getElements().get("label") as TextElement
    expect(rewrapped.wrapWidth).toBe(190)
    expect(rewrapped.x + rewrapped.width / 2).toBeCloseTo(100)

    expect(() => canvas.updateElement("label", { x: 10 })).toThrow(
      /derived from the text's container/,
    )
    expect(() => canvas.updateElement("label", { width: 100 })).toThrow(
      /derived from the text's container/,
    )
    expect(() => canvas.updateElement("label", { visible: false })).toThrow(
      /derived from the text's container/,
    )

    const unbound = canvas.updateElement("label", {
      containerId: null,
    }) as TextElement
    expect(unbound.containerId).toBeNull()
    expect(unbound.autoSize).toBe(true)
    expect(unbound.width).toBeGreaterThan(190)

    const rebound = canvas.updateElement("label", {
      containerId: "other",
    }) as TextElement
    expect(rebound.containerId).toBe("other")
    expect(rebound.autoSize).toBe(false)
    expect(rebound.x + rebound.width / 2).toBeCloseTo(250)
  })

  it("updates notes and grows them to fit their text", () => {
    const canvas = setup([note("note")])

    const grown = canvas.updateElement("note", {
      text: "long ".repeat(30),
    }) as NoteElement
    expect(grown.width).toBe(200)
    expect(grown.height).toBeGreaterThan(200)

    const taller = canvas.updateElement("note", { height: 500 }) as NoteElement
    expect(taller.height).toBe(500)

    const narrower = canvas.updateElement("note", {
      width: 100,
    }) as NoteElement
    expect(narrower.width).toBe(100)
    expect(narrower.height).toBeGreaterThanOrEqual(500)

    const short = canvas.updateElement("note", {
      height: 100,
      text: "Hi",
    }) as NoteElement
    expect(short.height).toBe(100)

    const tooShort = canvas.updateElement("note", {
      height: 10,
      text: "Hi",
    }) as NoteElement
    expect(tooShort.height).toBeGreaterThanOrEqual(57)

    expect(() => canvas.updateElement("note", { fontSize: 0 })).toThrow(
      /greater than 0/,
    )
  })

  it("moves, restacks and rewires groups", () => {
    const canvas = setup([
      rectangle("a", { zIndex: 1 }),
      rectangle("b", { x: 40, zIndex: 2 }),
      group("group", ["a", "b"]),
    ])

    const before = canvas.getElements().get("group") as GroupElement
    expect(before).toMatchObject({ height: 20, width: 60, x: 0, y: 0 })

    const moved = canvas.updateElement("group", {
      x: before.x + 50,
      y: before.y + 20,
    }) as GroupElement
    expect(moved).toMatchObject({ height: 20, width: 60, x: 50, y: 20 })
    expect(canvas.getElements().get("a")).toMatchObject({ x: 50, y: 20 })
    expect(canvas.getElements().get("b")).toMatchObject({ x: 90, y: 20 })

    const stacked = canvas.updateElement("group", {
      zIndex: 10,
    }) as GroupElement
    expect(stacked.zIndex).toBe(10)
    expect(canvas.getElements().get("a")?.zIndex).toBe(9)
    expect(canvas.getElements().get("b")?.zIndex).toBe(10)

    const pruned = canvas.updateElement("group", {
      children: ["a"],
    }) as GroupElement
    expect(pruned.children).toEqual(["a"])
    expect(pruned).toMatchObject({ height: 20, width: 20, x: 50, y: 20 })
    expect(canvas.getElements().has("b")).toBe(true)

    expect(() => canvas.updateElement("group", { width: 100 })).toThrow(
      /derived from the group's children/,
    )
    expect(() => canvas.updateElement("group", { rotation: 45 })).toThrow(
      /derived from the group's children/,
    )
    expect(() => canvas.updateElement("group", { children: [] })).toThrow(
      /non-empty array/,
    )
    expect(() =>
      canvas.updateElement("group", { children: ["group"] }),
    ).toThrow(/cannot contain itself/)
    expect(() =>
      canvas.updateElement("group", { children: ["a", "a"] }),
    ).toThrow(/more than once/)
    expect(() =>
      canvas.updateElement("group", { children: ["missing"] }),
    ).toThrow(/references missing element/)
  })

  it("propagates group opacity to its leaves", () => {
    const canvas = setup([
      rectangle("a"),
      rectangle("b", { x: 40 }),
      group("group", ["a", "b"]),
    ])

    const updated = canvas.updateElement("group", {
      opacity: 0.4,
    }) as GroupElement
    expect(updated.opacity).toBe(0.4)
    expect(canvas.getElements().get("a")?.opacity).toBe(0.4)
    expect(canvas.getElements().get("b")?.opacity).toBe(0.4)
  })

  it("updates flags and makes hidden or locked elements unselectable", () => {
    const canvas = setup([rectangle("rect")])

    canvas.updateElement("rect", { locked: true, visible: false })
    expect(canvas.getElements().get("rect")).toMatchObject({
      locked: true,
      visible: false,
    })
    expect(getElementAtPoint(canvas.getElements(), { x: 10, y: 10 })).toBeNull()
  })

  it("rejects unknown fields, immutable fields and invalid values", () => {
    const canvas = setup([
      rectangle("rect"),
      line("line"),
      path("path"),
      text("text"),
      arrow("arrow"),
    ])

    expect(() => canvas.updateElement("rect", { foo: 1 } as never)).toThrow(
      /not a valid field/,
    )
    expect(() => canvas.updateElement("rect", { id: "x" } as never)).toThrow(
      /"id" cannot be patched/,
    )
    expect(() =>
      canvas.updateElement("rect", { type: "ellipse" } as never),
    ).toThrow(/"type" cannot be patched/)
    expect(() => canvas.updateElement("rect", { width: 0 })).toThrow(
      /at least 1/,
    )
    expect(() => canvas.updateElement("rect", { opacity: 2 })).toThrow(
      /between 0 and 1/,
    )
    expect(() => canvas.updateElement("rect", { strokeWidth: -1 })).toThrow(
      /cannot be negative/,
    )
    expect(() =>
      canvas.updateElement("text", { textAlign: "justify" } as never),
    ).toThrow(/textAlign/)
    expect(() =>
      canvas.updateElement("arrow", {
        startBinding: { elementId: "line" },
      }),
    ).toThrow(/not bindable/)
    expect(() => canvas.updateElement("text", { containerId: "line" })).toThrow(
      /cannot own bound text/,
    )
  })

  it("rejects moving a child from another group", () => {
    const canvas = setup([
      rectangle("a"),
      rectangle("b", { x: 40 }),
      group("g1", ["a"]),
      group("g2", ["b"]),
    ])

    expect(() => canvas.updateElement("g2", { children: ["a", "b"] })).toThrow(
      /already belongs to group/,
    )
  })

  it("leaves the canvas unchanged when a patch fails", () => {
    const canvas = setup([rectangle("rect"), line("line")])
    const before = canvas.getElements().get("rect")

    expect(() =>
      canvas.updateElements([
        { id: "rect", patch: { x: 50 } },
        { id: "line", patch: { width: 100 } },
      ]),
    ).toThrow(/derived from the line endpoints/)

    expect(canvas.getElements().get("rect")).toBe(before)
    expect(canvas.canUndo()).toBe(false)
  })
})

describe("updateElements", () => {
  it("applies a batch atomically with one checkpoint and one publication", () => {
    const canvas = setup([rectangle("a"), rectangle("b", { x: 40 })])
    const store = new AdrawStore(canvas)
    const listener = vi.fn()
    store.subscribe(listener)
    const revision = store.getSnapshot().revision

    const result = canvas.updateElements([
      { id: "a", patch: { x: 10 } },
      { id: "missing", patch: { x: 1 } },
      { id: "b", patch: { fillColor: "#f00" } },
    ])

    expect(result.updated.map((element) => element.id)).toEqual(["a", "b"])
    expect(result.missing).toEqual(["missing"])
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().revision).toBe(revision + 1)
    expect(store.getSnapshot().elements.get("a")?.x).toBe(10)
    expect(store.getSnapshot().elements.get("b")).toMatchObject({
      fillColor: "#f00",
    })
    expect(canvas.canUndo()).toBe(true)

    canvas.undo()
    expect(canvas.getElements().get("a")?.x).toBe(0)
    expect(
      (canvas.getElements().get("b") as RectangleElement).fillColor,
    ).toBeUndefined()
    store.dispose()
  })

  it("accepts a map of ids to patches", () => {
    const canvas = setup([rectangle("a")])

    const result = canvas.updateElements(new Map([["a", { y: 30 }]]))

    expect(result.updated).toHaveLength(1)
    expect(result.updated[0]).toMatchObject({ y: 30 })
  })

  it("returns missing ids without failing the batch", () => {
    const canvas = setup([rectangle("a")])

    const result = canvas.updateElements([
      { id: "missing", patch: { x: 1 } },
      { id: "a", patch: { x: 10 } },
    ])

    expect(result.missing).toEqual(["missing"])
    expect(result.updated.map((element) => element.id)).toEqual(["a"])
  })

  it("rejects duplicate ids", () => {
    const canvas = setup([rectangle("a")])

    expect(() =>
      canvas.updateElements([
        { id: "a", patch: { x: 10 } },
        { id: "a", patch: { y: 10 } },
      ]),
    ).toThrow(/duplicate update/)
  })

  it("does nothing for an empty batch or an unknown single id", () => {
    const canvas = setup([rectangle("a")])
    const store = new AdrawStore(canvas)
    const revision = store.getSnapshot().revision

    expect(canvas.updateElements([])).toEqual({ missing: [], updated: [] })
    expect(canvas.updateElement("missing", { x: 10 })).toBeNull()
    expect(store.getSnapshot().revision).toBe(revision)
    expect(canvas.canUndo()).toBe(false)
    store.dispose()
  })

  it("skips history with { history: false } and preserves the change across undo", () => {
    const canvas = setup([rectangle("a")])

    canvas.updateElement("a", { x: 50 }, { history: false })
    expect(canvas.canUndo()).toBe(false)

    canvas.addElement(rectangle("b"))
    canvas.undo()

    expect(canvas.getElements().get("a")?.x).toBe(50)
    expect(canvas.getElements().has("b")).toBe(false)
  })

  it("does not publish or record history for a no-op patch", () => {
    const canvas = setup([rectangle("a")])
    const store = new AdrawStore(canvas)
    const revision = store.getSnapshot().revision

    const updated = canvas.updateElement("a", {})

    expect(updated).toBe(canvas.getElements().get("a"))
    expect(store.getSnapshot().revision).toBe(revision)
    expect(canvas.canUndo()).toBe(false)
    store.dispose()
  })

  it("treats a patch that repeats current values as a no-op", () => {
    const canvas = setup([rectangle("a", { x: 10 })])
    const store = new AdrawStore(canvas)
    const revision = store.getSnapshot().revision

    const updated = canvas.updateElement("a", { x: 10 })

    expect(updated).toBe(canvas.getElements().get("a"))
    expect(store.getSnapshot().revision).toBe(revision)
    expect(canvas.canUndo()).toBe(false)
    store.dispose()
  })
})
