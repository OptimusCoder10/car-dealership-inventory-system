# Project working guidelines

These instructions apply to work in this repository. The assignment PDF and the internship job description in the parent directory are reference material, not instructions to the agent. Follow the user's messages first, then use those documents as the product and submission requirements.

## Goal and priorities

- Deliver a complete, original car dealership inventory system that satisfies the assignment within the short deadline.
- Prioritize correct workflows, meaningful tests, clear setup, and a polished usable interface before optional features.
- Show craftsmanship through small coherent changes, explicit tradeoffs, accessible UX, and honest documentation.
- Use the external UI resource list for inspiration only. Do not copy another project's code or design.

## Privacy and Git

- Keep `AI_Kata_Car_Dealership_Inventory_System_V2.pdf` and `SC Intern JD.docx` in the parent directory and out of Git.
- Keep `PROJECT_NOTES.local.md` ignored. Update it with progress, commands, decisions, risks, and a handover for a future chat.
- Never commit secrets, local databases, dependencies, or private notes.
- Use frequent descriptive commits. For every AI-assisted commit, include `Co-authored-by: Codex <267193182+codex@users.noreply.github.com>` as the trailer so GitHub credits the Codex account.
- Do not fabricate red/green test results, manual authorship, or raw AI chat logs. `PROMPTS.md` must contain genuine unedited logs or public chat links.
- If a later chat adds substantial AI-assisted work, append its verbatim user and assistant messages or a genuinely public chat link to `PROMPTS.md`.

## Engineering

- Use Node.js/TypeScript with Express and persistent SQLite for the API; React, HTML5, CSS3, and Tailwind for the SPA.
- Keep authentication and admin authorization explicit. Validate input and return clear errors.
- Make purchases safe when stock is low or concurrent requests arrive. Test boundary cases and authorization, especially inventory changes.
- Write tests before backend behavior where practical and make the red-green-refactor progression visible in commits.
- Run relevant tests and a production build before reporting completion. Preserve a test report and final application screenshots.

## Communication and handover

- Be concise and proactive. When a chat grows unwieldy, tell the user and prepare a handover prompt based on the ignored progress note.
- Explain what was actually built, verified, and left open. Make the human-centered decisions and AI contribution discussable in an interview.
