"use client";

import { useEffect, useState } from "react";
import { GitBranch, Package, Search, FileText, Check } from "lucide-react";
import type { AnalysisStep } from "@/lib/types";

interface ProgressStepsProps {
  currentStep: AnalysisStep;
  repoUrl: string;
  message?: string;
}

const steps = [
  { id: "cloning", label: "Cloning", description: "Fetching repository", icon: GitBranch },
  { id: "packaging", label: "Packaging", description: "Preparing for analysis", icon: Package },
  { id: "analyzing", label: "Analyzing", description: "Detecting code smells", icon: Search },
  { id: "reporting", label: "Reporting", description: "Generating report", icon: FileText },
] as const;

const stepOrder: AnalysisStep[] = ["cloning", "packaging", "analyzing", "reporting", "complete"];

export function ProgressSteps({ currentStep, repoUrl, message }: ProgressStepsProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getStepStatus = (stepId: string) => {
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId as AnalysisStep);

    if (currentStep === "complete" || stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const repoName = repoUrl.split("/").slice(-2).join("/");

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mb-4">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground font-mono">{repoName}</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Analyzing Repository{dots}
        </h2>
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
        <div
          className="absolute left-8 top-0 w-0.5 bg-primary transition-all duration-500"
          style={{
            height: `${(stepOrder.indexOf(currentStep) / (steps.length - 1)) * 100}%`,
          }}
        />

        <div className="space-y-6">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`relative flex items-center gap-6 pl-4 transition-opacity duration-300 ${
                  status === "pending" ? "opacity-40" : "opacity-100"
                }`}
              >
                {/* Icon circle */}
                <div
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    status === "complete"
                      ? "bg-primary text-primary-foreground"
                      : status === "active"
                      ? "bg-primary/20 text-primary ring-4 ring-primary/20"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {status === "complete" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className={`w-4 h-4 ${status === "active" ? "animate-pulse" : ""}`} />
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 py-4 px-5 rounded-xl transition-all duration-300 ${
                    status === "active"
                      ? "bg-card border border-primary/30 shadow-lg shadow-primary/10"
                      : status === "complete"
                      ? "bg-card/50 border border-border"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{step.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {status === "active" && message ? message : step.description}
                      </p>
                    </div>
                    {status === "active" && (
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                    {status === "complete" && (
                      <span className="text-xs text-primary font-medium">Done</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-muted-foreground text-sm mt-10">
        This may take a few minutes depending on the repository size
      </p>
    </div>
  );
}
