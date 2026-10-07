import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Adds `.openapi()` to zod schemas. Every DTO module imports `z` from here so
// the extension is in place before any schema is built.
extendZodWithOpenApi(z);

export { z };
