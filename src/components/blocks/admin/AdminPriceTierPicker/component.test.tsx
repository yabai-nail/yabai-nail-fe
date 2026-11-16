import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// React is partly mocked so the component can also run as a plain function with chosen state:
// `harness.states` is [open, query, active] and each setter is recorded. Markup tests render for
// real through react-dom/server with the actual hooks.
const harness = vi.hoisted(() => ({ mocked: false, states: [] as unknown[], setters: [] as ReturnType<typeof vi.fn>[], next: 0 }));
vi.mock("react", async (load) => {
  const actual = await load<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (!harness.mocked) return actual.useState(initial);
      const index = harness.next++;
      const setter = vi.fn();
      harness.setters[index] = setter;
      return [index in harness.states ? harness.states[index] : initial, setter];
    },
    useEffect: (...args: Parameters<typeof actual.useEffect>) => (harness.mocked ? undefined : actual.useEffect(...args)),
    useMemo: <T,>(fn: () => T, deps: ReadonlyArray<unknown>) => (harness.mocked ? fn() : actual.useMemo(fn, deps)),
    useId: () => (harness.mocked ? "pk" : actual.useId()),
  };
});
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => (values ? `${key}:${JSON.stringify(values)}` : key),
}));

import { AdminPriceTierPicker, priceTierOptionLabel } from "./component";

const tier = (id: string, name: string, amount: number, isPinned?: boolean) => ({ id, name, amount, isPinned });
const tiers = [tier("a", "Basic", 6600), tier("b", "Gel", 8800, true), tier("c", "Art", 9900), tier("d", "Long", 7700, true)];
const [OPEN, QUERY, ACTIVE] = [0, 1, 2];

type Props = Parameters<typeof AdminPriceTierPicker>[0];
const props = (overrides: Partial<Props> = {}): Props => ({ label: "Tier", tiers, value: "c", onChange: vi.fn(), ...overrides });

type Node = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
function find(node: ReactNode, predicate: (node: Node) => boolean): Node | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Node;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}
function findAll(node: ReactNode, predicate: (node: Node) => boolean, found: Node[] = []): Node[] {
  if (Array.isArray(node)) node.forEach((child) => findAll(child, predicate, found));
  else if (node && typeof node === "object" && "props" in node) {
    const element = node as Node;
    if (predicate(element)) found.push(element);
    findAll(element.props.children, predicate, found);
  }
  return found;
}
/** Runs the component with chosen [open, query, active] state and returns its tree. */
function run(states: unknown[], overrides: Partial<Props> = {}) {
  harness.mocked = true;
  harness.next = 0;
  harness.states = states;
  harness.setters = [];
  const tree = AdminPriceTierPicker(props(overrides)) as ReactNode;
  const input = find(tree, (node) => node.props.role === "combobox")!;
  const options = findAll(tree, (node) => node.props.role === "option");
  return { tree, input, options };
}
const key = (name: string) => ({ key: name, preventDefault: vi.fn(), stopPropagation: vi.fn() });

beforeEach(() => { harness.mocked = false; vi.clearAllMocks(); });

describe("price tier picker markup", () => {
  it("renders an ARIA combobox that is closed and shows the picked tier", () => {
    const html = renderToStaticMarkup(<AdminPriceTierPicker {...props()} />);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toMatch(/<label for="[^"]+-input"[^>]*>Tier<\/label>/);
    expect(html).toContain(`value="${priceTierOptionLabel(tiers[2])}"`);
    expect(html).toMatch(/role="listbox"[^>]*hidden=""/);
  });

  it("lists pinned tiers first and marks only the picked tier selected", () => {
    const html = renderToStaticMarkup(<AdminPriceTierPicker {...props()} />);
    const order = [...html.matchAll(/role="option" aria-selected="(true|false)"[^>]*>.*?<span class="min-w-0 flex-1 truncate">([^<]+)</g)]
      .map((match) => [match[2], match[1]]);
    expect(order).toEqual([["Long", "false"], ["Gel", "false"], ["Basic", "false"], ["Art", "true"]]);
  });

  it.each([
    ["loading", { status: "loading" as const }, 'role="status"', "loading"],
    ["failed", { status: "failed" as const }, 'role="alert"', "failed"],
    ["no tiers", { tiers: [] }, 'role="status"', "empty"],
    ["screen wording", { tiers: [], messages: { empty: "Add a tier first" } }, 'role="status"', "Add a tier first"],
  ])("shows the %s state instead of the box", (_name, overrides, role, text) => {
    const html = renderToStaticMarkup(<AdminPriceTierPicker {...props(overrides)} />);
    expect(html).toContain(role);
    expect(html).toContain(text);
    expect(html).not.toContain('role="combobox"');
  });
});

describe("price tier picker behaviour", () => {
  it("keeps the pick by id when the list is re-ordered", () => {
    const reordered = [...tiers].reverse().map((item) => (item.id === "c" ? { ...item, isPinned: true } : item));
    expect(run([false, "", -1], { tiers: reordered }).input.props.value).toBe(priceTierOptionLabel(tiers[2]));
  });

  it("filters by what is typed and points the active option at it", () => {
    const { input, options } = run([true, "88", 0]);
    expect(input.props.value).toBe("88");
    expect(input.props["aria-expanded"]).toBe(true);
    expect(options.map((option) => option.props.id)).toEqual(["pk-option-b"]);
    expect(input.props["aria-activedescendant"]).toBe("pk-option-b");
  });

  it("highlights the picked tier when typing still matches it, so Enter keeps it", () => {
    const { input } = run([true, "", 0]);
    (input.props.onChange as (event: unknown) => void)({ target: { value: "a" } });
    // "a" matches Basic and Art; Art (the pick) is second, so it stays highlighted.
    expect(harness.setters[QUERY]).toHaveBeenCalledWith("a");
    expect(harness.setters[ACTIVE]).toHaveBeenCalledWith(1);
  });

  it("says when nothing matches", () => {
    const { tree, options } = run([true, "zzz", -1]);
    expect(options).toHaveLength(0);
    expect(find(tree, (node) => node.props.children === 'noMatch:{"query":"zzz"}')).toBeDefined();
  });

  it("caps the options and says how many more there are", () => {
    const many = Array.from({ length: 30 }, (_, index) => tier(`t${index}`, `Tier ${index}`, 1000 + index));
    const { tree, options } = run([true, "", 0], { tiers: many, value: "", limit: 12 });
    expect(options).toHaveLength(12);
    expect(find(tree, (node) => node.props.children === 'more:{"shown":12,"total":30}')).toBeDefined();
  });

  it("opens on ArrowDown and moves the highlight once open", () => {
    const closed = run([false, "", -1]);
    const down = key("ArrowDown");
    (closed.input.props.onKeyDown as (event: unknown) => void)(down);
    expect(down.preventDefault).toHaveBeenCalled();
    expect(harness.setters[OPEN]).toHaveBeenCalledWith(true);
    expect(harness.setters[ACTIVE]).toHaveBeenCalledWith(3); // Art, the pick, is 4th in pinned-first order.

    const open = run([true, "", 3]);
    (open.input.props.onKeyDown as (event: unknown) => void)(key("ArrowDown"));
    const update = harness.setters[ACTIVE].mock.calls[0][0] as (current: number) => number;
    expect(update(3)).toBe(0);
  });

  it("picks the highlighted tier on Enter without submitting the form", () => {
    const onChange = vi.fn();
    const { input } = run([true, "", 1], { onChange });
    const enter = key("Enter");
    (input.props.onKeyDown as (event: unknown) => void)(enter);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("b");
    expect(harness.setters[OPEN]).toHaveBeenCalledWith(false);
  });

  it("leaves Enter to the form while the list is closed", () => {
    const onChange = vi.fn();
    const { input } = run([false, "", -1], { onChange });
    const enter = key("Enter");
    (input.props.onKeyDown as (event: unknown) => void)(enter);
    expect(enter.preventDefault).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes on Escape without closing the surrounding modal or changing the pick", () => {
    const onChange = vi.fn();
    const { input } = run([true, "ge", 0], { onChange });
    const escape = key("Escape");
    (input.props.onKeyDown as (event: unknown) => void)(escape);
    expect(escape.stopPropagation).toHaveBeenCalled();
    expect(harness.setters[OPEN]).toHaveBeenCalledWith(false);
    expect(harness.setters[QUERY]).toHaveBeenCalledWith("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("picks with the mouse without stealing focus from the box", () => {
    const onChange = vi.fn();
    const { options } = run([true, "", 0], { onChange });
    const mouseDown = { preventDefault: vi.fn() };
    (options[2].props.onMouseDown as (event: unknown) => void)(mouseDown);
    expect(mouseDown.preventDefault).toHaveBeenCalled();
    (options[2].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
