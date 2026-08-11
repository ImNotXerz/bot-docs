import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The site hosts several bots on one domain using Mintlify's `products` navigation, so each
 * gets an independent tree. These tests guard the properties that make that work: a product's
 * pages live under its own directory, no product can quietly reach into another's, and every
 * page on disk is reachable from the sidebar (and vice versa) — for every product, not just one.
 *
 * Ported from V.O.I.D's src/tests/docs-generated.test.ts, generalized across all products now
 * that docs.json lives here instead of inside a single bot's own repo.
 */

const ROOT = process.cwd();

type Product = {
  product: string;
  tabs?: { tab: string; groups?: { group: string; pages: string[] }[]; pages?: string[] }[];
  pages?: string[];
};

type DocsConfig = { navigation: { products: Product[] } };

function readConfig(): DocsConfig {
  return JSON.parse(readFileSync(join(ROOT, "docs.json"), "utf8")) as DocsConfig;
}

function pagesForProduct(product: Product): string[] {
  const pages: string[] = [...(product.pages ?? [])];
  for (const tab of product.tabs ?? []) {
    pages.push(...(tab.pages ?? []));
    for (const group of tab.groups ?? []) {
      pages.push(...group.pages);
    }
  }
  return pages;
}

describe("navigation", () => {
  const config = readConfig();

  it("uses the products navigation type", () => {
    expect(Array.isArray(config.navigation.products)).toBe(true);
    expect(config.navigation.products.length).toBeGreaterThan(0);
  });

  it("gives every product a name and a navigation tree of its own", () => {
    for (const product of config.navigation.products) {
      expect(product.product, "a product needs a display name").toBeTruthy();
      expect(pagesForProduct(product).length, `${product.product} has no pages`).toBeGreaterThan(0);
    }
  });

  it("keeps every product's pages inside its own directory", () => {
    for (const product of config.navigation.products) {
      const prefixes = new Set(pagesForProduct(product).map((slug) => slug.split("/")[0]));
      // One directory per product: a stray slug would put a page in another bot's sidebar.
      expect([...prefixes], `${product.product} spans multiple directories`).toHaveLength(1);
    }
  });

  it("does not let two products claim the same directory", () => {
    const roots = config.navigation.products.map((product) => pagesForProduct(product)[0]?.split("/")[0]);
    expect(new Set(roots).size).toBe(roots.length);
  });

  it("references only directories that exist", () => {
    const onDisk = new Set(
      readdirSync(ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    );
    for (const product of config.navigation.products) {
      const root = pagesForProduct(product)[0]?.split("/")[0] ?? "";
      expect(onDisk, `${product.product} points at ${root}/ which does not exist`).toContain(root);
    }
  });

  it("has no page on disk that the navigation omits", () => {
    const navPages = new Set(config.navigation.products.flatMap(pagesForProduct));
    for (const product of config.navigation.products) {
      const dir = pagesForProduct(product)[0]?.split("/")[0];
      if (dir === undefined) continue;
      const onDisk = readdirSync(join(ROOT, dir))
        .filter((name) => name.endsWith(".mdx"))
        .map((name) => `${dir}/${name.replace(/\.mdx$/u, "")}`);
      for (const page of onDisk) {
        expect(navPages, `${page}.mdx is not reachable from the sidebar`).toContain(page);
      }
    }
  });

  it("has no navigation entry pointing at a file that does not exist", () => {
    for (const product of config.navigation.products) {
      for (const slug of pagesForProduct(product)) {
        const file = join(ROOT, `${slug}.mdx`);
        expect(() => readFileSync(file, "utf8"), `${slug} is in docs.json but ${slug}.mdx does not exist`).not.toThrow();
      }
    }
  });
});
