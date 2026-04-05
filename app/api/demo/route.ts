import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Demo report data for testing the UI
const demoReport = {
  timestamp: new Date().toISOString(),
  codebase: {
    path: "/workspace/demo-repository",
    total_files: 7,
    languages: ["TypeScript", "JavaScript"],
    total_lines: 329,
  },
  global_score: 53,
  categories_found: ["bloater", "oo-abuser", "change-preventer", "dispensable", "coupler"],
  summary:
    "This Node.js/Express REST API for managing a book collection is a functional student project with significant architectural deficiencies. The primary concern is the monolithic route handler (src/handlers/route.ts, 163 lines) that centralizes all CRUD operations, violating Single Responsibility and causing extensive code duplication across request handlers. Combined with direct database coupling throughout the codebase, a data-only entity model, hardcoded credentials, and dead code (an empty route file), the codebase scores 53/100 (Fair). Refactoring towards a layered architecture with controllers, services, and a repository abstraction would substantially improve maintainability and testability.",
  smells: [
    {
      category: "dispensable",
      type: "Dead Code",
      severity: "HIGH",
      files_affected: ["src/handlers/collection/post/route.ts"],
      description:
        "An entirely empty file exists in the handlers directory. Its presence creates confusion about project structure — is it incomplete work, a stub for future development, or a mistake? Dead files add cognitive overhead for anyone new to the codebase.",
      suggestion:
        "Delete src/handlers/collection/post/route.ts immediately. If the intent is to eventually move the POST handler here (extracting it from the monolithic route.ts), create a skill or tracking issue rather than leaving a dead file. YAGNI: do not create empty placeholders for speculative future work.",
    },
    {
      category: "change-preventer",
      type: "Divergent Change",
      severity: "CRITICAL",
      files_affected: ["src/handlers/route.ts"],
      description:
        "The file src/handlers/route.ts (163 lines) contains five distinct CRUD route handlers (GET all, GET by ID, POST, PATCH, DELETE), each with its own validation, database access, error handling, and response logic. This file changes for five different and unrelated reasons: modifying any single endpoint requires editing this same file, risking regressions in unrelated endpoints.",
      suggestion:
        "Apply Extract Class (refactoring.guru) to split each route handler into its own file under src/handlers/collection/. For example: src/handlers/collection/get-all.ts, get-by-id.ts, create.ts, update.ts, remove.ts. Each file should import a collection service and contain only request parsing, service delegation, and HTTP response.",
    },
    {
      category: "coupler",
      type: "Tight Coupling / Feature Envy",
      severity: "HIGH",
      files_affected: [
        "src/handlers/route.ts",
        "src/database/database.ts",
        "src/database/entities/collection.ts",
      ],
      description:
        "Every route handler in src/handlers/route.ts directly accesses AppDataSource.getRepository(Collection) to perform database operations. This tightly couples the HTTP layer to the database layer, making unit testing impossible without a real database connection.",
      suggestion:
        "Introduce a CollectionService class in src/services/collection.service.ts that encapsulates all CRUD operations. Route handlers should only parse requests, call service methods, and map responses to HTTP status codes. Apply Dependency Inversion Principle (SOLID 'D').",
    },
    {
      category: "dispensable",
      type: "Duplicate Code",
      severity: "MEDIUM",
      files_affected: ["src/handlers/route.ts"],
      description:
        "The try-catch pattern with 500 error responses is duplicated across all five route handlers. Each handler also repeats the pattern of getting the repository via AppDataSource.getRepository(Collection). This duplication increases the effort to make cross-cutting changes.",
      suggestion:
        "Extract the error handling into a centralized Express error-handling middleware function. Create an asyncHandler wrapper. This eliminates all try-catch blocks and routes errors to the middleware.",
    },
    {
      category: "bloater",
      type: "Primitive Obsession",
      severity: "MEDIUM",
      files_affected: [
        "src/database/entities/collection.ts",
        "src/handlers/validators/collectionValidator.ts",
      ],
      description:
        "The price and rating fields are stored as plain integers with implicit semantic meaning (price as cents? rating as 1-5?). There are no value objects or type aliases to enforce domain constraints.",
      suggestion:
        "Create a Rating value type (e.g., type Rating = 1 | 2 | 3 | 4 | 5) and use it in the entity and DTOs. For price, consider a Money value object class. This enforces domain invariants at the type level.",
    },
    {
      category: "bloater",
      type: "Long Method",
      severity: "MEDIUM",
      files_affected: ["src/handlers/route.ts"],
      description:
        "The initRoutes function spans approximately 163 lines, handling five distinct business operations. Each route handler block is 15-30 lines long, making the overall function difficult to scan and understand.",
      suggestion:
        "Apply Extract Method to break initRoutes into five small functions, each handling one route. Even better, apply Extract Class to create a CollectionController class with five methods.",
    },
    {
      category: "dispensable",
      type: "Magic Numbers",
      severity: "MEDIUM",
      files_affected: ["src/app.ts", "src/handlers/route.ts", "src/database/database.ts"],
      description:
        "Several magic numbers appear throughout the codebase: port 3001 in app.ts, HTTP status codes (200, 201, 400, 404, 500) hardcoded directly in response.send() calls, port 3306 and hostname 'localhost' in database.ts.",
      suggestion:
        "Extract configuration to a config file (src/config.ts) using environment variables with defaults. For HTTP status codes, define a constant object or use http.STATUS_CODES. This centralizes configuration.",
    },
    {
      category: "oo-abuser",
      type: "Data Class",
      severity: "LOW",
      files_affected: ["src/handlers/error-handler.ts"],
      description:
        "The error-handler.ts file exports a single function that maps ZodError.paths to a plain object. The function uses .map() as if it were .forEach() — it ignores the return value of map, which is semantically incorrect.",
      suggestion:
        "Replace error.errors.map(...) with error.errors.forEach(...) for semantic correctness. Define a proper type for the error response.",
    },
  ],
  files: [
    {
      path: "src/handlers/route.ts",
      lines: 163,
      smells_count: 5,
      smells: [
        { type: "Divergent Change", severity: "CRITICAL", line_hint: "1-163" },
        { type: "Duplicate Code", severity: "MEDIUM", line_hint: "34-39, 68-72" },
        { type: "Long Method", severity: "MEDIUM", line_hint: "1-163" },
      ],
    },
    {
      path: "src/database/entities/collection.ts",
      lines: 25,
      smells_count: 2,
      smells: [
        { type: "Data Class", severity: "MEDIUM" },
        { type: "Primitive Obsession", severity: "MEDIUM" },
      ],
    },
    {
      path: "src/handlers/collection/post/route.ts",
      lines: 0,
      smells_count: 2,
      smells: [
        { type: "Dead Code", severity: "HIGH" },
        { type: "Lazy Class", severity: "HIGH" },
      ],
    },
  ],
};

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Simulate the analysis steps with delays
      const steps = [
        { step: "cloning", delay: 1500 },
        { step: "packaging", delay: 1200 },
        { step: "analyzing", delay: 2000 },
        { step: "reporting", delay: 1000 },
      ];

      for (const { step, delay } of steps) {
        controller.enqueue(encoder.encode(JSON.stringify({ step }) + "\n"));
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Send the final report
      controller.enqueue(
        encoder.encode(JSON.stringify({ report: demoReport, step: "complete" }) + "\n")
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
