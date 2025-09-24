import { ContentPack, createDelta } from './content-pack';

/**
 * Default Content Pack - AI Cofounder
 * 
 * Based on docs/game-levels.md with deltas from docs/scaling-meter.md
 * This serves as the fallback content pack and reference implementation.
 */

export const DEFAULT_PACK: ContentPack = {
  id: 'ai-cofounder-default',
  version: '1.0.0',
  title: 'AI Cofounder Startup Simulation',
  description: 'Navigate the journey of building an AI Cofounder startup from seed funding to global expansion.',
  author: 'JetBrains',
  steps: [
    {
      id: 1,
      title: 'Early Maturity Stage',
      subtitle: 'Securing the Base',
      scenario: 'Congrats! You just raised your Seed round 🥳. Time to show progress building AI Cofounder.',
      optionA: {
        label: 'Add subscription payments feature',
        body: 'Add a subscription payments feature so founders can pay monthly for their AI buddy. Junie integrates Stripe subscriptions, sets up billing tiers for Solo, Team, and Enterprise.',
        delta: createDelta({ R: 10, U: 4, I: -2 }), // Revenue focus, slight investor visibility lag
        unluckMessages: [
          "Stripe pushed a surprise API change — half your subscriptions failed. Gains halved.",
          "Billing portal worked… until compliance flagged you. Revenue paused until lawyers finish their coffee."
        ]
      },
      optionB: {
        label: 'Launch MVP dashboard for investors',
        body: 'Launch an MVP dashboard for investors to show how many founders are already using their AI Cofounder. Junie spins up an investor dashboard with real-time charts for "Founder Signups," "Feature Requests," and "Founder Happiness Index."',
        delta: createDelta({ I: 10, R: -3 }), // Investor confidence boost, delay monetization
        unluckMessages: [
          "Dashboard looked slick… then crashed five minutes before your board call. Investors stared at 404s.",
          "Charts were perfect — until the data pipeline broke and showed churn at 200%. Panic."
        ]
      }
    },
    {
      id: 2,
      title: 'First Customers & Onboarding',
      subtitle: 'Making Cofounder Sticky',
      scenario: 'Early adopters are trying your AI Cofounder. The big challenge: do they stick around?',
      optionA: {
        label: 'Create a compelling landing page',
        body: 'Create a landing page to pitch "Your Cofounder Who Never Sleeps." Junie generates a bold, funny landing page with "🔥 Replace your cofounder with AI (without the equity drama)."',
        delta: createDelta({ U: 8, C: -2 }), // User growth boost, onboarding gap
        unluckMessages: [
          "Your landing page looked great… until Google Ads flagged it as spam. Zero clicks.",
          "Competitor bought your domain typo — half your leads are now on ‘aicofounderr.com.’ Brutal."
        ]
      },
      optionB: {
        label: 'Build automated onboarding flow',
        body: 'Build an automated onboarding flow where AI Cofounder greets new founders and teaches them what it can do. Junie codes an onboarding flow: Welcome email, product tour, and a snarky first chat from AI Cofounder ("Hi, I\'m your smarter half.").',
        delta: createDelta({ C: 8, U: -2 }), // Customer love boost, top-funnel slower
        unluckMessages: [
          "Emails queued nicely… straight into Gmail’s spam folder. New users ghosted.",
          "AWS SES flagged your emails as ‘suspicious activity.’ Welcome sequence = blocked."
        ]
      }
    },
    {
      id: 3,
      title: 'Growth Stage',
      subtitle: 'Expanding Capabilities',
      scenario: 'Founders love AI Cofounder, but now they\'re asking: Can it do more?',
      optionA: {
        label: 'Add collaboration features',
        body: 'Add collaboration features so multiple founders (or teams) can share one AI Cofounder account. Junie builds multi-user support with role-based access and shared workspaces.',
        delta: createDelta({ U: 6, R: 5, S: -3 }), // User growth + revenue, heavier system load
        unluckMessages: [
          "Collaboration worked… until an intern accidentally deleted half the projects.",
          "Launch was hyped — but Slack went down the same day. Everyone blamed you."
        ]
      },
      optionB: {
        label: 'Add analytics dashboard',
        body: 'Add analytics so founders can see what their Cofounder has done: "Decks Generated, Bugs Fixed, Ideas Suggested." Junie adds a metrics dashboard with charts: "Code Commits by AI Cofounder," "Investor Emails Drafted," and "Arguments Resolved."',
        delta: createDelta({ C: 6, I: 4, U: -2 }), // Customer love + investor confidence
        unluckMessages: [
          "Analytics dashboard impressed — until investors misread the churn chart. Panic ensued.",
          "Charts worked — until a timezone bug doubled daily active users. Nobody trusts numbers now."
        ]
      }
    },
    {
      id: 4,
      title: 'Viral Growth Spike',
      subtitle: 'When Founders Tell Founders',
      scenario: 'AI Cofounder gets featured on Product Hunt 🚀. Thousands of desperate founders sign up overnight.',
      optionA: {
        label: 'Handle server scaling crisis',
        body: 'Handle a server crash as thousands of AI Cofounders argue with themselves. Junie spins up autoscaling, adds monitoring, and jokes: "Don\'t worry, I gave Cofounders extra coffee. They\'ll scale too."',
        delta: createDelta({ S: 10, I: 3 }), // System reliability + investor confidence
        unluckMessages: [
          "Autoscaling kicked in — and wiped half your staging data. Chaos at scale.",
          "Traffic surge handled — but you forgot rate limits. Bots ate your free tier."
        ]
      },
      optionB: {
        label: 'Set up automated customer support',
        body: 'Set up automated customer support so users can ask, "Why is my Cofounder recommending blockchain pivots?" Junie launches a chatbot inside the product that can answer FAQs like, "Can my Cofounder raise funding for me while I sleep?"',
        delta: createDelta({ C: 7, I: 4, S: -5 }), // Customer love + investor confidence, system load risk
        unluckMessages: [
          "Chatbot replied honestly: ‘Have you tried shutting down your company?’ Support tickets exploded.",
          "Bot answered everything — then went offline mid-surge. Customers angry, humans swamped."
        ]
      }
    },
    {
      id: 5,
      title: 'Global Expansion',
      subtitle: 'Cofounders Everywhere',
      scenario: 'Founders around the world want their own AI Cofounder 🌍. Time to globalize.',
      optionA: {
        label: 'Add multilingual support',
        body: 'Add multilingual support so Cofounder can brainstorm in Spanish, Japanese, or Estonian. Junie auto-translates AI Cofounder\'s witty comments into multiple languages, keeping the humor intact.',
        delta: createDelta({ U: 6, C: 5 }), // User growth + customer love, no immediate revenue
        unluckMessages: [
          "Great translations — except Japanese tagline now reads: ‘Hire a Goat as Cofounder.’",
          "Spanish users thrilled… until accents broke the UI. Half the text boxes overflow."
        ]
      },
      optionB: {
        label: 'Enable international payments',
        body: 'Enable international payments so Cofounder can bill in EUR, JPY, BRL. Junie integrates global payment providers so a founder in Berlin can split equity arguments with their AI Cofounder.',
        delta: createDelta({ R: 8, I: 3, C: -2 }), // Revenue + investor confidence, UX gaps
        unluckMessages: [
          "Payments launched globally — then processor froze funds for ‘suspicious founder activity.’ Customers paid, you didn’t.",
          "Currency detection worked — until VAT compliance email landed in spam. Surprise bill incoming."
        ]
      }
    }
  ],
  metadata: {
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: ['startup', 'ai', 'simulation', 'default']
  }
};

/**
 * Get the default content pack
 * This is the fallback pack used when other content packs fail to load
 */
export function getDefaultPack(): ContentPack {
  return DEFAULT_PACK;
}

/**
 * Validate that the default pack conforms to the schema
 * This should be called during development to ensure the default pack is valid
 */
export function validateDefaultPack(): boolean {
  try {
    const { validateContentPack } = require('./content-pack');
    validateContentPack(DEFAULT_PACK);
    return true;
  } catch (error) {
    console.error('Default pack validation failed:', error);
    return false;
  }
}