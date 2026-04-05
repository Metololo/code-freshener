"use client";

import { useState } from "react";
import { ArrowLeft, FileCode, AlertTriangle, Lightbulb, ChevronDown, ChevronRight, Clock, Code, FileStack, ExternalLink, ArrowUpDown } from "lucide-react";
import type { Report, Severity, SmellCategory, CodeSmell } from "@/lib/types";
import { ScoreGauge } from "@/components/score-gauge";
import { Button } from "@/components/ui/button";

interface ReportViewProps {
  report: Report;
  repoUrl: string;
  onReset: () => void;
}

type SortOption = "severity" | "category" | "files";
const severityOrder: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const severityColors: Record<Severity, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  MEDIUM: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" },
  LOW: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const categoryLabels: Record<SmellCategory, string> = {
  bloater: "Bloaters",
  "oo-abuser": "OO Abusers",
  "change-preventer": "Change Preventers",
  dispensable: "Dispensables",
  coupler: "Couplers",
};

const categoryDescriptions: Record<SmellCategory, string> = {
  bloater: "Code that has grown too large to handle",
  "oo-abuser": "Incorrect application of OO principles",
  "change-preventer": "Changes in one place require changes elsewhere",
  dispensable: "Code that could be removed to improve quality",
  coupler: "Excessive coupling between classes",
};

export function ReportView({ report, repoUrl, onReset }: ReportViewProps) {
  const [expandedSmells, setExpandedSmells] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<SmellCategory | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("severity");

  const toggleSmell = (index: number) => {
    const newExpanded = new Set(expandedSmells);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSmells(newExpanded);
  };

  const filteredSmells = (activeCategory === "all" 
    ? report.smells 
    : report.smells.filter(smell => smell.category === activeCategory)
  ).sort((a, b) => {
    if (sortBy === "severity") return severityOrder[a.severity] - severityOrder[b.severity];
    if (sortBy === "category") return a.category.localeCompare(b.category);
    return b.files_affected.length - a.files_affected.length;
  });

  const severityCounts = report.smells.reduce((acc, smell) => {
    acc[smell.severity] = (acc[smell.severity] || 0) + 1;
    return acc;
  }, {} as Record<Severity, number>);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Analyze Another
        </Button>
        <div className="flex items-center gap-4">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Repository
          </a>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{new Date(report.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Score and Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <ScoreGauge score={report.global_score} />
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-foreground">Code Health Score</h3>
              <p className="text-sm text-muted-foreground">
                {report.global_score >= 80 ? "Excellent" : report.global_score >= 60 ? "Good" : report.global_score >= 40 ? "Fair" : "Needs Work"}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6 h-full">
            <h3 className="text-lg font-semibold text-foreground mb-3">Summary</h3>
            <p className="text-muted-foreground leading-relaxed text-pretty">{report.summary}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={<FileStack className="w-5 h-5" />}
          label="Files Analyzed"
          value={report.codebase.total_files}
        />
        <StatCard 
          icon={<Code className="w-5 h-5" />}
          label="Lines of Code"
          value={report.codebase.total_lines.toLocaleString()}
        />
        <StatCard 
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Issues Found"
          value={report.smells.length}
        />
        <StatCard 
          icon={<FileCode className="w-5 h-5" />}
          label="Languages"
          value={report.codebase.languages.join(", ")}
        />
      </div>

      {/* Severity Breakdown */}
      <div className="flex flex-wrap gap-3 mb-8">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((severity) => (
          <div
            key={severity}
            className={`px-4 py-2 rounded-lg border ${severityColors[severity].bg} ${severityColors[severity].border}`}
          >
            <span className={`font-medium ${severityColors[severity].text}`}>
              {severityCounts[severity] || 0} {severity}
            </span>
          </div>
        ))}
      </div>

      {/* Category Filter + Sort */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 rounded-lg text-sm bg-secondary text-foreground border border-border mr-2"
        >
          <option value="severity">Sort: Severity</option>
          <option value="category">Sort: Category</option>
          <option value="files">Sort: Files Affected</option>
        </select>
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({report.smells.length})
        </button>
        {report.categories_found.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {categoryLabels[category]} ({report.smells.filter(s => s.category === category).length})
          </button>
        ))}
      </div>

      {/* Smells List */}
      <div className="space-y-4">
        {filteredSmells.map((smell, index) => (
          <SmellCard
            key={index}
            smell={smell}
            isExpanded={expandedSmells.has(index)}
            onToggle={() => toggleSmell(index)}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SmellCard({ smell, isExpanded, onToggle }: { smell: CodeSmell; isExpanded: boolean; onToggle: () => void }) {
  const colors = severityColors[smell.severity];

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${colors.border} ${isExpanded ? colors.bg : "bg-card"}`}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="font-semibold text-foreground">{smell.type}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
              {smell.severity}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
              {categoryLabels[smell.category]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {smell.files_affected.join(", ")}
          </p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Description
            </h5>
            <p className="text-sm text-muted-foreground leading-relaxed">{smell.description}</p>
          </div>

          <div>
            <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Suggestion
            </h5>
            <p className="text-sm text-muted-foreground leading-relaxed">{smell.suggestion}</p>
          </div>

          <div>
            <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-muted-foreground" />
              Affected Files
            </h5>
            <div className="flex flex-wrap gap-2">
              {smell.files_affected.map((file, i) => (
                <code key={i} className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-foreground font-mono">
                  {file}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
