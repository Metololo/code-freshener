export type AnalysisStep = "cloning" | "packaging" | "analyzing" | "reporting" | "complete";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SmellCategory = 
  | "bloater" 
  | "oo-abuser" 
  | "change-preventer" 
  | "dispensable" 
  | "coupler";

export interface CodeSmell {
  category: SmellCategory;
  type: string;
  severity: Severity;
  files_affected: string[];
  description: string;
  suggestion: string;
}

export interface FileInfo {
  path: string;
  lines: number;
  smells_count: number;
  smells: Array<{
    type: string;
    severity: Severity;
    line_hint?: string;
  }>;
}

export interface Codebase {
  path: string;
  total_files: number;
  languages: string[];
  total_lines: number;
}

export interface Report {
  timestamp: string;
  codebase: Codebase;
  global_score: number;
  categories_found: SmellCategory[];
  summary: string;
  smells: CodeSmell[];
  files: FileInfo[];
}
