import json
import os
import shutil
import subprocess
import sys


class CodeFreshener:
    def __init__(self, debug=False):
        self.repo_dir = "target_repo"
        self.pack_file = "repomix-output.xml"
        self.report_path = "code-smell-report.json"
        self.debug = debug
        
        current_dir = os.getcwd()
        self.abs_pack_path = os.path.join(current_dir, self.pack_file)
        self.abs_report_path = os.path.join(current_dir, self.report_path)

    def analyze(self, repo_url):

        self.clean_previous_runs()

        if not self.run_command(f"git clone {repo_url} {self.repo_dir}", "cloning"):
            return

        if not self.package_repository():
            return

        if not self.debug:
            self.log_step("analyzing", "AI is auditing the codebase...")

        if not self.audit_repository():
            return

        self.verify_report_exist()
        
    def audit_repository(self):
        skills_file = os.path.join(os.getcwd(), "hermes_skill", "code-smell-spotter.md")

        prompt = (
            f"/code-smell-spotter audit the codebase in {self.abs_pack_path}. "
            f"Save the final JSON report to {self.abs_report_path}. "
            f"Once the report is written end the conversation"
        )

        hermes_cmd = (
            f"hermes chat "
            f"-q '{prompt}' "
            f"--skills {skills_file} "
            f"--toolsets skills,terminal,read_file"
        )

        if not self.run_command(hermes_cmd, "analyzing"):
            return False
        return True

    def package_repository(self):
        repomix_cmd = f"npx -y repomix@latest {self.repo_dir} --output {self.abs_pack_path}"
        if not self.run_command(repomix_cmd, "packaging"):
            return False
        return True

    def clean_previous_runs(self):
        if os.path.exists(self.repo_dir): shutil.rmtree(self.repo_dir)
        if os.path.exists(self.abs_pack_path): os.remove(self.abs_pack_path)


    def log_step(self, step, message):
        """Standardized JSON for the Next.js UI tracking."""
        print(json.dumps({"step": step, "message": message}), flush=True)

    def run_command(self, cmd, step_name):
        """Runs command. Streams raw output if debug=True, else stays quiet."""
        if self.debug:
            result = subprocess.run(cmd, shell=True, stdout=sys.stdout, stderr=sys.stderr)
            return result.returncode == 0
        else:
            self.log_step(step_name, f"Processing {step_name}...")
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                print(json.dumps({"error": f"{step_name} failed", "details": result.stderr}), flush=True)
                return False
            return True


    def verify_report_exist(self):
        if os.path.exists(self.abs_report_path):
            print(json.dumps({"step": "complete", "message": "Report is ready"}), flush=True)
        else:
            print(json.dumps({"error": "Analysis finished but no report file was found."}), flush=True)