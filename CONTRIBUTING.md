# Contributing to Borderify

You are interested in contributing? Cool! 

## Code of Conduct

Please be respectful, kind, and collaborative in all issues, discussions, and pull requests.

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing issues to ensure the bug hasn't already been reported.
- Open a new issue with a clear title, description, steps to reproduce, and any relevant logs or screenshots.

### 2. Suggesting Enhancements
- Open an issue explaining the proposed feature, why it's useful, and how you envision it working.

### 3. Submitting Pull Requests
- Fork the repository and create your branch from `main`.
- Install dependencies: `npm install`
- Run the app locally to test your changes: `npm run dev`
- Ensure tests pass: `npm run test`
- Make sure code is linted: `npm run lint`
- Commit your changes with clear, descriptive commit messages.
- Submit a Pull Request describing what changes you made and why.

## Development Guidelines

- **Stack:** React, TypeScript, Vite, Vitest.
- **Styling:** Vanilla CSS. Keep layouts responsive and polished.
- **Canvas API:** High-resolution edits are performed on off-screen canvases. Ensure your changes do not degrade performance or leak memory.
- **EXIF Preservation:** Any changes to image scaling/compression must preserve EXIF tags via the pipeline in `src/utils.ts` and `src/exif.ts`.
