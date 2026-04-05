# 🧼 Code Freshener

An AI-powered code quality analyzer that inspects any GitHub repository, detects code smells and bad design practices, and produces a structured, actionable report.

---

## 🚀 What It Does

Code Freshener takes a repository URL and runs it through a multi-step analysis pipeline:

1. **Clone** – Pulls the target repository into a working directory
2. **Package** – Bundles the codebase into a single XML file using Repomix
3. **Analyze** – Uses Hermes (local AI agent) with a custom `code-smell-spotter` skill
4. **Report** – Generates a structured JSON report with scores and recommendations

---


## 📚 Analysis Principles

The analysis is grounded in well-known software engineering practices:

* **Refactoring Guru (primary reference)**
  👉 https://refactoring.guru/
  Covers the 5 smell categories:

  * Bloaters
  * Object-Oriented Abusers
  * Change Preventers
  * Dispensables
  * Couplers

* **SOLID Principles**

* **DRY (Don’t Repeat Yourself)**

* **KISS (Keep It Simple, Stupid)**

* **YAGNI (You Aren’t Gonna Need It)**

* **Clean Code philosophy**

---

## ⚠️ Disclaimer (Token Usage)

> This project relies on an AI agent (Hermes) to analyze your codebase.

* Large repositories can result in **high token usage**, depending on the size and complexity of the code.
* This may lead to **longer processing times** and **increased costs** if you're using a paid model.

---

## ⚙️ Requirements

Make sure you have:

* 🟢 **Node.js >= 18**
* 📦 **npm**

### Run the Web App

```bash
npm install
npm run dev
```

### For the Analysis Script

* 🐍 **Python 3**
* 🤖 **Hermes Agent installed**
* 🔐 Hermes must have **read/write access** to the `scripts/` folder

---

## 🧪 Running the Analyzer (Python)

Navigate to the scripts folder and run:

```bash
cd scripts
python main.py <repo_url>
```

### 🐞 Debug Mode (Verbose Logs)

```bash
python main.py <repo_url> --debug
```

📄 The report will be generated as:

```
scripts/code-smell-report.json
```

---

## 📊 Output Report Structure

The analysis produces a detailed JSON report:

```json
{
  "timestamp": "<ISO 8601 datetime>",
  "codebase": {
    "path": "<path analyzed>",
    "total_files": 0,
    "languages": ["<lang>"],
    "total_lines": 0
  },
  "global_score": 0,
  "categories_found": ["bloater", "oo-abuser", "change-preventer", "dispensable", "coupler"],
  "summary": "High-level assessment",
  "smells": [
    {
      "category": "bloater",
      "type": "Long Method",
      "severity": "HIGH",
      "files_affected": ["file1.py"],
      "description": "What and why",
      "suggestion": "How to fix"
    }
  ],
  "files": [
    {
      "path": "file.py",
      "score": 75,
      "language": "Python",
      "lines": 120,
      "smells": [
        {
          "category": "bloater",
          "type": "Long Method",
          "severity": "HIGH",
          "location": "lines 10-80",
          "description": "Issue explanation",
          "suggestion": "Refactoring advice"
        }
      ]
    }
  ],
  "top_recommendations": [
    {
      "priority": 1,
      "action": "Break large functions into smaller ones",
      "impact": "HIGH",
      "smell_type": "Long Method",
      "files_affected": ["file.py"]
    }
  ]
}
```

---

## 📁 Project Structure

```
.
├── app/                      # Next.js app (UI + API)
├── components/               # React components
├── lib/                      # Shared utilities/types
├── scripts/
│   ├── main.py               # Core analysis script
│   ├── code-smell-report.json# Generated report
│   └── hermes_assets/
│       └── skills/
│           └── code-smell-spotter/  # Custom Hermes skill
```

---

## 🎉 About the Project

This project is a simple project i made for fun and to test hermes agent. It's far from a "production ready" tool so feel free to:

* 🍴 Fork it
* 🛠 Modify it
* 🚀 Extend it
* 🤓 Experiment with it

If you have ideas, suggestions, or feedback — don’t hesitate to share!

## 💡 Future Ideas

* Integration in github CI (trigger in pull request for example)
* Dockerize the tool
* Provide a "Fix" functionality to fix the code smell, run tests and create a pull request. 

---