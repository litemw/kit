import type { Component, Token } from "@litemw/iocc";
import type { Module } from "./module";

export type ContainerGraphParams = {
  modules?: readonly Module[];
  components?: readonly Component[];
};

export type ContainerGraphOptions = {
  /** Graph layout direction, defaults to "LR". */
  rankdir?: "LR" | "RL" | "TB" | "BT";
  /** Group module components into subgraph clusters, defaults to true. */
  clusters?: boolean;
};

const escapeLabel = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Multi/optional variants share the base token symbol; their names are
// derived as `${name}[]` and `${name}?`, so strip the suffix back off.
const baseName = (token: Token): string => {
  if (token.kind === "multi" && token.name.endsWith("[]")) {
    return token.name.slice(0, -2);
  }
  if (token.kind === "optional" && token.name.endsWith("?")) {
    return token.name.slice(0, -1);
  }
  return token.name;
};

export function containerGraphToDot(
  params: ContainerGraphParams,
  options: ContainerGraphOptions = {},
): string {
  const { rankdir = "LR", clusters = true } = options;
  const modules = params.modules ?? [];
  const components = params.components ?? [];

  const allComponents = [
    ...modules.flatMap((m) => m.components),
    ...components,
  ];

  const componentIds = new Map<symbol, string>();
  for (const component of allComponents) {
    if (!componentIds.has(component.key)) {
      componentIds.set(component.key, `c${componentIds.size}`);
    }
  }

  const interfaces = new Map<symbol, { id: string; label: string }>();
  const interfaceNode = (token: Token): string => {
    const existing = interfaces.get(token.key);
    if (existing) return existing.id;
    const id = `i${interfaces.size}`;
    interfaces.set(token.key, { id, label: baseName(token) });
    return id;
  };

  const implemented = new Set<symbol>();
  const required = new Set<symbol>();
  const edges: string[] = [];

  const uniqueComponents = [
    ...new Map(allComponents.map((c) => [c.key, c])).values(),
  ];

  for (const component of uniqueComponents) {
    const id = componentIds.get(component.key)!;

    for (const token of component.tokens) {
      if (token.key === component.key) continue;
      implemented.add(token.key);
      edges.push(
        `${id} -> ${interfaceNode(token)} [style=dashed, arrowhead=empty];`,
      );
    }

    for (const dep of component.deps) {
      const target = componentIds.get(dep.key) ?? interfaceNode(dep);
      const attrs: string[] = [];
      if (dep.kind === "multi") attrs.push('label="[]"');
      if (dep.kind === "optional") attrs.push("style=dotted", 'label="?"');
      if (dep.kind === "singular") required.add(dep.key);
      const suffix = attrs.length > 0 ? ` [${attrs.join(", ")}]` : "";
      edges.push(`${id} -> ${target}${suffix};`);
    }
  }

  const componentNode = (component: Component, indent: string) =>
    `${indent}${componentIds.get(component.key)} [label="${escapeLabel(
      component.name,
    )}", shape=box];`;

  const lines: string[] = [];
  lines.push("digraph Container {");
  lines.push(`  rankdir=${rankdir};`);
  lines.push('  node [fontname="Helvetica"];');

  const emitted = new Set<symbol>();
  modules.forEach((module, index) => {
    const fresh = module.components.filter((c) => !emitted.has(c.key));
    for (const component of fresh) emitted.add(component.key);
    if (clusters) {
      lines.push(`  subgraph cluster_${index} {`);
      lines.push(
        `    label="${escapeLabel(module.name ?? `module ${index + 1}`)}";`,
      );
      for (const component of fresh) {
        lines.push(componentNode(component, "    "));
      }
      lines.push("  }");
    } else {
      for (const component of fresh) {
        lines.push(componentNode(component, "  "));
      }
    }
  });

  for (const component of components) {
    if (emitted.has(component.key)) continue;
    emitted.add(component.key);
    lines.push(componentNode(component, "  "));
  }

  for (const [key, intf] of interfaces) {
    const attrs = [`label="${escapeLabel(intf.label)}"`, "shape=ellipse"];
    if (required.has(key) && !implemented.has(key)) attrs.push("color=red");
    lines.push(`  ${intf.id} [${attrs.join(", ")}];`);
  }

  for (const edge of edges) lines.push(`  ${edge}`);
  lines.push("}");
  return lines.join("\n") + "\n";
}
