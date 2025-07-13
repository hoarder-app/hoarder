# Gemini Code Assistant Workspace Context

This document provides context about the Karakeep project for the Gemini Code Assistant.

## Project Overview

Karakeep is a monorepo project managed with Turborepo. It appears to be a web application with a focus on collecting and organizing information, possibly a bookmarking or "read-it-later" service. The project is built with a modern tech stack, including:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Hono (a lightweight web framework), tRPC
- **Database:** Drizzle ORM (likely with a relational database like PostgreSQL or SQLite)
- **Tooling:** Prettier, ESLint (via oxlint), Vitest, pnpm

## Project Structure

The project is organized into `apps` and `packages`:

### Applications (`apps/`)

- **`web`:** The main web application, built with Next.js.
- **`browser-extension`:** A browser extension, likely for saving content to karakeep.
- **`cli`:** A command-line interface for interacting with the service.
- **`landing`:** A landing page for the project.
- **`mobile`:** A mobile application (details unknown).
- **`mcp`:** The Model Context Protocol (MCP) server to communicate with Karakeep.
- **`workers`:** Background workers for processing tasks.

### Packages (`packages/`)

- **`api`:** The main API, built with Hono and tRPC.
- **`db`:** Database schema and migrations, using Drizzle ORM.
- **`e2e_tests`:** End-to-end tests for the project.
- **`open-api`:** OpenAPI specifications for the API.
- **`sdk`:** A software development kit for interacting with the API.
- **`shared`:** Shared code and types between packages.
- **`shared-react`:** Shared React components and hooks.
- **`trpc`:** tRPC router and procedures. Most of the business logic is here.

### Docs

- **docs/docs/03-configuration.md**: Explains configuration options for the project.

## Development Workflow

- **Package Manager:** pnpm
- **Build System:** Turborepo
- **Code Formatting:** Prettier
- **Linting:** oxlint
- **Testing:** Vitest

## Other info

- This project uses shadcn/ui. The shadcn components in the web app are in `packages/web/components/ui`.
- This project uses Tailwind CSS.
- For the mobile app, we use [expo](https://expo.dev/).

### Common Commands

- `pnpm typecheck`: Typecheck the codebase.
- `pnpm lint`: Lint the codebase.
- `pnpm lint:fix`: Fix linting issues.
- `pnpm format`: Format the codebase.
- `pnpm format:fix`: Fix formatting issues.
- `pnpm test`: Run tests.

Starting services:
- `pnpm web`: Start the web application (this doesn't return, unless you kill it).
- `pnpm workers`: Starts the background workers (this doesn't return, unless you kill it).

## Development Notes

- When making schema changes, refer to the instructions in docs/docs/07-Development/03-database.md