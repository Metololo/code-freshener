"use client";

import { useState } from "react";
import { AnalyzerForm } from "@/components/analyzer-form";
import { ProgressSteps } from "@/components/progress-steps";
import { ReportView } from "@/components/report-view";
import { Header } from "@/components/header";
import type { Report, AnalysisStep } from "@/lib/types";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AnalysisStep | null>(null);
  const [stepMessage, setStepMessage] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState<string>("");

  const handleAnalyze = async (url: string, isDemo = false) => {
    setRepoUrl(url);
    setIsAnalyzing(true);
    setReport(null);
    setError(null);
    setCurrentStep("cloning");

    try {
      const endpoint = isDemo ? "/api/demo" : "/api/analyze";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start analysis");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.step) {
              setCurrentStep(data.step as AnalysisStep);
              if (data.message) setStepMessage(data.message);
            }

            if (data.error) {
              setError(data.error);
              setIsAnalyzing(false);
              return;
            }

            if (data.report) {
              setReport(data.report);
              setCurrentStep("complete");
              setIsAnalyzing(false);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(null);
    setStepMessage("");
    setIsAnalyzing(false);
    setReport(null);
    setError(null);
    setRepoUrl("");
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!isAnalyzing && !report && !error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
                Freshen Up Your Code
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
                Analyze your GitHub repository for code smells and get AI-powered suggestions to improve code quality.
              </p>
            </div>
            <AnalyzerForm onAnalyze={handleAnalyze} />
            <button
              onClick={() => handleAnalyze("https://github.com/demo/repository", true)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Try with demo repository
            </button>
          </div>
        )}

        {isAnalyzing && currentStep && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <ProgressSteps currentStep={currentStep} repoUrl={repoUrl} message={stepMessage} />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 max-w-lg text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Analysis Failed</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {report && !isAnalyzing && (
          <ReportView report={report} repoUrl={repoUrl} onReset={handleReset} />
        )}
      </div>
    </main>
  );
}
