# Code Freshener

An AI-powered code quality analyzer that analyze any github repository, audits its codebase for code smells and bad design practices, and produces a structured report with scores, severity ratings, and actionable refactoring suggestions.

## What It Does

Code Freshener takes a repository URL and runs it through a multi-step analysis pipeline:

1. **Clone** - Pulls the target repository into a working directory
2. **Package** - Bundles the codebase into a single XML file using [Repomix](https://github.com/yamadashy/repomix)
3. **Analyze** - Invokes [Hermes](https://github.com/nickscamara/hermes) (a local AI coding agent) with the custom made `code-smell-spotter` skill to audit the code
4. **Report** - Produces a structured JSON report with a global quality score, per-file scores, detected smell categories, and prioritized refactoring recommendations

The analysis is grounded in established software design principles:

- **Refactoring.Guru** (primary source) -- the five smell categories: Bloaters, OO-Abusers, Change Preventers, Dispensables, and Couplers
- **SOLID** principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- **YAGNI / KISS / DRY**
- **Clean Code** values and pragmatism

## Requirements

- **Node.js >= 18** and **npm** (for the web UI)
- **Python 3** (for standalone script usage)
- **Hermes Agent** installed and configured -- the analysis pipeline calls `hermes chat` under the hood, which requires the `skills` and `terminal` toolsets.

### Installing the Code Smell Spotter Skill

This project ships with a `code-smell-spotter` skill in the `hermes_assets/skills/code-smell-spotter/` folder. Hermes needs this skill installed to perform the analysis.

**Option 1 -- Install via Hermes CLI (recommended):**

```bash
hermes skills tap add /absolute/path/to/code-freshener/hermes_assets/skills
hermes skills browse  # you should now see code-smell-spotter available
hermes skills install code-smell-spotter
```

Or if the skill is already published to your local workspace, link it directly:

```bash
# Copy the skill folder into Hermes' skills directory
cp -r hermes_assets/skills/code-smell-spotter/ ~/.hermes/skills/code-smell-spotter/
```

**Option 2 -- Load inline (no install needed):**

If you don't want to install the skill globally, the Python script can reference it directly. Just make sure the path passed to `hermes chat` via `--toolsets skills,terminal,read_file` includes the `skills` toolset enabled, and that the skill folder is discoverable by Hermes.

Verify the skill is active:

```bash
hermes skills list
```

You should see `code-smell-spotter` in the output.

### Important: Hermes Write Access

Hermes must be configured so it can write files to disk. This means either:

- Running Hermes in **local mode** (default -- it has full filesystem access)
- Running Hermes in a container with a **mounted volume** pointing to the working directory where the report will be written

The `code_freshener.py` script passes an absolute path to Hermes and expects it to write the final `code-smell-report.json` at that location. If Hermes cannot write to disk, the analysis will complete but no report will be produced.

## Installation

### Web UI (Full App)

```bash
pnpm install
pnpm run dev
```

This starts the Next.js development server (default `http://localhost:3000`). 

### Standalone (Python Script Only)

If you don't need the UI and just want to run the analysis directly:

```bash
cd scripts
python code_freshener.py <repo_url>
```

The script reads a repository URL and orchestrates the full pipeline. It outputs JSON status lines to stdout so it can be consumed by the Next.js API or parsed by any consumer.

To use in your own script, pass a URL to the `analyze()` method. The report is written to the current working directory as `code-smell-report.json`.

## Output Report

The analysis produces a JSON report with the following structure:

- **global_score** (0-100) -- line-weighted average of all file scores
- **categories_found** -- which of the five smell categories were detected
- **smells[]** -- global smell-centric view, each entry spanning one or more affected files
- **files[]** -- per-file breakdown with individual scores and smell details, sorted worst-first
- **top_recommendations** -- up to five prioritized actions sorted by impact

Scores range from 0 (Critical) to 100 (Excellent), with deductions applied per smell instance based on severity (CRITICAL: -15 to -20, HIGH: -8 to -12, MEDIUM: -4 to -7, LOW: -1 to -3).

## Project Structure

```
.
├── app/                      # Next.js app (pages, API routes)
├── components/               # React UI components
├── lib/                      # Shared types and utilities
├── scripts/
│   ├── code_freshener.py     # Core analysis orchestrator
│   └── repomix-output.xml    # Packed codebase (generated at runtime)
└── hermes_assets/
    └── skills/
        └── code-smell-spotter/
            └── SKILL.md      # The AI analysis skill definition
```

## How It Works

The web UI calls an API route (`/api/analyze`) which spawns the `code_freshener.py` script as a child process. The script streams JSON progress updates to stdout, which the API pipes through a `ReadableStream` to the frontend. The frontend parses each line and updates the progress display step by step.

For demo purposes, a `/api/demo` endpoint is also available that runs the same pipeline without requiring a live Hermes connection.
