import { describe, expect, it } from "vitest";
import { formatSql } from "@/lib/sql-tools";

describe("formatSql", () => {
  it("formats clauses, CTEs, joins, and nested queries", () => {
    const result = formatSql(
      "with x as (select id from users where active=true) select x.id from x left join orders o on o.user_id=x.id order by x.id;",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("\nSELECT");
      expect(result.output).toContain("\nLEFT JOIN");
      expect(result.output).toContain("\nORDER BY");
    }
  });
  it("preserves strings, quoted identifiers, comments, and placeholders", () => {
    const input = `select 'it''s -- text', "User Name", \`mysql_name\`, [sql name], $1, :name, @id, ? -- note\nfrom users;`;
    const result = formatSql(input);
    expect(result.ok).toBe(true);
    if (result.ok)
      for (const value of [
        "'it''s -- text'",
        '"User Name"',
        "`mysql_name`",
        "[sql name]",
        "$1",
        ":name",
        "@id",
        "?",
        "-- note",
      ])
        expect(result.output).toContain(value);
  });
  it("supports keyword case and indentation settings", () => {
    const result = formatSql("select * from (select id from users) x", {
      keywordCase: "lower",
      indentation: 4,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("select");
      expect(result.output).toContain("    select");
    }
  });
  it("minifies without removing comments or changing literals", () => {
    const result = formatSql("select 'a b' /* keep */ from users;", {
      minify: true,
    });
    expect(result).toEqual({
      ok: true,
      output: "SELECT 'a b' /* keep */ FROM users;",
    });
  });
  it.each(["select 'unterminated", "select /* missing", "select [missing"])(
    "rejects incomplete lexical input: %s",
    (input) => {
      const result = formatSql(input);
      expect(result.ok).toBe(false);
    },
  );
});
