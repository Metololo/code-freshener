import { spawn } from "child_process";
import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for analysis

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: "Repository URL is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate GitHub URL
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubRegex.test(repoUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid GitHub repository URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const scriptPath = path.join(process.cwd(), "scripts", "main.py");

        // Check if script exists
        try {
          await fs.access(scriptPath);
        } catch {
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: "Analysis script not found. Please ensure main.py is in the scripts folder." }) + "\n")
          );
          controller.close();
          return;
        }

        const pythonProcess = spawn("python", [scriptPath, repoUrl], {
          cwd: path.join(process.cwd(), "scripts"),
        });

        let reportPath: string | null = null;

        pythonProcess.stdout.on("data", (data: Buffer) => {
          const output = data.toString();
          console.log("[v0] Python stdout:", output);

          // Parse JSON log lines
          const lines = output.split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.step) {
                controller.enqueue(encoder.encode(JSON.stringify({ 
                  step: parsed.step, 
                  message: parsed.message 
                }) + "\n"));
              }
            } catch {
              // Not JSON, check for report path
              const reportMatch = line.match(/Report saved to: (.+\.json)/);
              if (reportMatch) {
                reportPath = reportMatch[1];
              }
            }
          }
        });

        pythonProcess.stderr.on("data", (data: Buffer) => {
          const error = data.toString();
          console.error("[v0] Python stderr:", error);
          
          // Only send actual errors, not warnings
          if (error.toLowerCase().includes("error") || error.toLowerCase().includes("exception")) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ error: `Analysis error: ${error}` }) + "\n")
            );
          }
        });

        pythonProcess.on("close", async (code) => {
          console.log("[v0] Python process exited with code:", code);

          if (code !== 0) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ error: `Analysis failed with exit code ${code}` }) + "\n")
            );
            controller.close();
            return;
          }

          // Try to find and read the report
          try {
            const scriptsDir = path.join(process.cwd(), "scripts");
            // The Python script writes to code-smell-report.json
            const defaultReportPath = path.join(scriptsDir, "code-smell-report.json");
            const finalReportPath = reportPath || defaultReportPath;
            
            console.log("[v0] Looking for report at:", finalReportPath);
            
            const reportContent = await fs.readFile(finalReportPath, "utf-8");
            console.log("[v0] Report content length:", reportContent.length);
            
            const report = JSON.parse(reportContent);
            console.log("[v0] Report parsed, smells count:", report.smells?.length);

            controller.enqueue(
              encoder.encode(JSON.stringify({ report, step: "complete" }) + "\n")
            );

            // Clean up report file
            try {
              await fs.unlink(finalReportPath);
              console.log("[v0] Cleaned up report file");
            } catch {
              // Ignore cleanup errors
            }
          } catch (err) {
            console.error("[v0] Error reading report:", err);
            controller.enqueue(
              encoder.encode(JSON.stringify({ error: "Failed to read analysis report" }) + "\n")
            );
          }

          controller.close();
        });

        pythonProcess.on("error", (err) => {
          console.error("[v0] Python process error:", err);
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: `Failed to start analysis: ${err.message}` }) + "\n")
          );
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[v0] API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
