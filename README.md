# TCGame - AI Cofounder SaaS Demo Game

An interactive expo/demo game where players act as a founder building an AI Cofounder SaaS. Players progress through five game levels, making A/B choices that affect a sophisticated scaling meter based on a hidden five-dimensional state system.

## Overview

This is a Next.js-based interactive demo designed for expo kiosks and presentations. The game features:

- **5 Progressive Levels**: Each with meaningful A/B choices that impact your startup's trajectory
- **Junie Console**: Agent-like visualizations with streaming logs, code diffs, and artifact previews
- **Scaling Meter**: Dynamic progress tracking based on 5 hidden dimensions (R, U, S, C, I) with diminishing returns
- **Personalized Endings**: Tiered outcomes based on final meter score and dimensional strengths
- **Content Packs**: Hot-swappable JSON/YAML content for easy iteration and A/B testing
- **Kiosk-Friendly**: Local persistence with optional server sessions and analytics consent
- **Accessibility**: Full keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Frontend**: React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Code Quality**: Biome (linting & formatting)
- **Additional Libraries**: 
  - `html-to-image` - For shareable summary cards
  - `js-yaml` - Content pack parsing
  - `zod` - Schema validation

## Requirements

- Node.js 18+ 
- npm, yarn, pnpm, or bun

## Setup & Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tcgame
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run unit tests with Vitest UI
- `npm run test:run` - Run unit tests once
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run typecheck` - Run TypeScript type checking

## Environment Variables

<!-- TODO: Document any environment variables once they are added -->
Currently, no environment variables are required for basic operation.

## Testing

The project uses a comprehensive testing setup:

### Unit Tests (Vitest)
- **Framework**: Vitest with jsdom environment
- **Setup**: Tests configured in `vitest.config.ts`
- **Location**: Component tests in `src/components/__tests__/`
- **Run**: `npm run test` or `npm run test:ui` for interactive mode

### E2E Tests (Playwright)
- **Framework**: Playwright with accessibility testing via @axe-core/playwright
- **Configuration**: `playwright.config.ts`
- **Location**: `tests/` directory
- **Run**: `npm run test:e2e` or `npm run test:e2e:ui` for interactive mode

## Project Structure

```
tcgame/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main entry point
│   ├── components/            # React components
│   │   ├── StartScreen.tsx    # Initial game screen
│   │   ├── StepScreen.tsx     # Individual game steps
│   │   ├── FeedbackScreen.tsx # Choice feedback display
│   │   ├── FinaleScreen.tsx   # Game ending screen
│   │   ├── ScalingMeter.tsx   # Progress meter component
│   │   ├── GameLayout.tsx     # Main game layout
│   │   └── __tests__/         # Component unit tests
│   ├── contexts/              # React contexts
│   │   └── RunStateContext.tsx # Game state management
│   └── lib/                   # Core game logic
│       ├── scaling-meter.ts   # 5-dimensional scoring system
│       ├── content-pack.ts    # Content pack types & validation
│       ├── pack-manager.ts    # Content pack management
│       ├── content-loader.ts  # Dynamic content loading
│       └── default-pack.ts    # Default game content
├── docs/                      # Comprehensive documentation
│   ├── requirements.md        # Detailed requirements
│   ├── spec.md               # Technical specifications
│   ├── plan.md               # Development plan
│   ├── scaling-meter.md      # Meter system design
│   ├── game-levels.md        # Level content design
│   ├── content-packs.md      # Content pack system
│   └── tasks.md              # Development tasks
├── tests/                     # E2E tests
├── public/                    # Static assets
└── Configuration files
    ├── next.config.ts         # Next.js configuration
    ├── tailwind.config.js     # Tailwind CSS config
    ├── vitest.config.ts       # Unit test configuration
    ├── playwright.config.ts   # E2E test configuration
    └── biome.json            # Code quality configuration
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Requirements](docs/requirements.md)** - Detailed functional requirements
- **[Technical Spec](docs/spec.md)** - Technical specifications
- **[Scaling Meter Design](docs/scaling-meter.md)** - Meter system documentation
- **[Game Levels](docs/game-levels.md)** - Level content and design
- **[Content Packs](docs/content-packs.md)** - Content management system
- **[Development Plan](docs/plan.md)** - Project roadmap
- **[Tasks](docs/tasks.md)** - Development task tracking

## License

<!-- TODO: Add license information -->
License information not yet specified.

## Contributing

This project follows the task workflow documented in `docs/tasks.md`. Please refer to the comprehensive documentation in the `docs/` directory for development guidelines and project context.