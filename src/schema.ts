/**
 * A small JSON Schema subset validator for module payloads (06 §8: "The payload validator rejects
 * malformed packages"). Supports type (incl. arrays of types), required, properties, items, enum and
 * additionalProperties (object schema). The schemas live in docs/modules/schema/*.json.
 */
export interface Schema {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: unknown[];
  additionalProperties?: Schema | boolean;
  $defs?: Record<string, Schema>;
  $ref?: string;
  [k: string]: unknown;
}

const typeOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);

/** First problem as `path: message`, or null when `data` conforms. */
export function validate(schema: Schema, data: unknown, root: Schema = schema, path = '$'): string | null {
  if (schema.$ref) {
    const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
    const target = m ? root.$defs?.[m[1]] : undefined;
    if (!target) return `${path}: unknown $ref ${schema.$ref}`;
    return validate(target, data, root, path);
  }
  if (schema.type) {
    const want = Array.isArray(schema.type) ? schema.type : [schema.type];
    const got = typeOf(data);
    const ok = want.some((t) => t === got || (t === 'number' && got === 'integer'));
    if (!ok) return `${path}: expected ${want.join(' or ')}, got ${got}`;
  }
  if (schema.enum && !schema.enum.some((e) => e === data)) return `${path}: not one of ${schema.enum.map(String).join(', ')}`;
  if (typeOf(data) === 'object') {
    const o = data as Record<string, unknown>;
    for (const r of schema.required ?? []) if (!(r in o) || o[r] === undefined) return `${path}.${r}: required`;
    for (const [k, v] of Object.entries(o)) {
      if (v === undefined) continue; // absent, as it would be after JSON
      const ps = schema.properties?.[k];
      if (ps) { const e = validate(ps, v, root, `${path}.${k}`); if (e) return e; }
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        const e = validate(schema.additionalProperties, v, root, `${path}.${k}`); if (e) return e;
      }
    }
  }
  if (typeOf(data) === 'array' && schema.items) {
    const a = data as unknown[];
    for (let i = 0; i < a.length; i++) { const e = validate(schema.items, a[i], root, `${path}[${i}]`); if (e) return e; }
  }
  return null;
}
