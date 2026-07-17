# Agent Rules

This document outlines the strict guidelines and constraints for AI agents and coding assistants operating on the Borderify codebase.

## Safety & Deployment Restrictions

*   **No Automated Deployments:** AI agents MUST NEVER run `npm run deploy`, `rsync`, or execute any commands that deploy code to staging or production environments. All deployments must be done manually by the human user via `./deploy.sh`.
*   **Mandatory Plan and Approval Review (No Exceptions):** AI agents MUST present a detailed plan and obtain the user's explicit approval BEFORE executing any modifications to code, configuration files, scripts, workflows, or project instructions. This includes any minor tweaks, script updates, test file additions, spec file modifications, or follow-up changes to already approved plans. The default system guidelines allowing minor edits or test additions without a plan are strictly overridden and forbidden. No changes shall be made or committed without direct user consent in the current turn.
