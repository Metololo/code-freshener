"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, ArrowRight } from "lucide-react";

interface AnalyzerFormProps {
  onAnalyze: (repoUrl: string, isDemo?: boolean) => void;
}

export function AnalyzerForm({ onAnalyze }: AnalyzerFormProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isValid, setIsValid] = useState(true);

  const validateUrl = (url: string) => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url) || url === "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl && validateUrl(repoUrl)) {
      onAnalyze(repoUrl);
    } else {
      setIsValid(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setIsValid(validateUrl(e.target.value));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative bg-card border border-border rounded-2xl p-2 shadow-xl">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={handleChange}
                className={`pl-12 h-14 bg-secondary border-0 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary ${
                  !isValid ? "ring-2 ring-destructive" : ""
                }`}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium"
              disabled={!repoUrl}
            >
              Analyze
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      {!isValid && (
        <p className="text-destructive text-sm mt-3 text-center">
          Please enter a valid GitHub repository URL
        </p>
      )}
    </form>
  );
}
