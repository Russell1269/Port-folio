// 1
let data = [
  {
    title: "AuraAI Analytics",
    slug: "aura-ai-analytics",
    tagline:
      "Next-generation predictive user analytics powered by open-source LLMs.",
    description:
      "AuraAI Analytics is an enterprise-grade observability and user-behavior predictive engine. It seamlessly hooks into any client-side client tracking framework, runs real-time clickstream processing via Kafka, and uses local fine-tuned LLMs to predict customer churn, funnel friction, and conversion probabilities before they happen.",
    category: "AI",
    status: "In Progress",
    featured: true,
    thumbnail: "https://unsplash.com",
    coverImage: "https://unsplash.com",
    gallery: [
      {
        image: "https://unsplash.com",
        title: "Predictive Behavior Dashboard Matrix View",
      },
      {
        image: "https://unsplash.com",
        title: "Real-time Anomalous Funnel Alerts Configurator",
      },
    ],
    previewVideo: "https://mixkit.co",
    technologies: [
      { name: "Python", icon: "devicon-python-plain" },
      { name: "TypeScript", icon: "devicon-typescript-plain" },
      { name: "Apache Kafka", icon: "devicon-apachekafka-original" },
      { name: "FastAPI", icon: "devicon-fastapi-plain" },
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://aura-analytics.ai",
    problem:
      "Product managers struggle to pinpoint exactly why users abandon conversion funnels until after the drop-off metrics pass through standard delayed batch-analytics services.",
    solution:
      "We engineered an edge-based client hook that streams micro-interactions to an AI streaming node, projecting micro-conversion risks down to a millisecond vector layer.",
    features: [
      "Zero-latency predictive stream pipelines",
      "Localized micro-LLM model infrastructure optimizations",
      "Automated cohort synthesis dashboards",
    ],
    developmentJourney: [
      {
        title: "Phase 1: Stream Engineering Architecture",
        description:
          "Configured resilient cluster topologies for high-velocity event ingestion using Docker Swarm.",
      },
      {
        title: "Phase 2: Fine-Tuning Core Weights",
        description:
          "Quantized specialized operational weights down to 4-bit configurations to run efficiently on commodity infrastructure.",
      },
    ],
    futurePlans: [
      "Integrate one-click custom fine-tuning via client browser sessions",
      "Develop native iOS/Android telemetry SDK packs",
    ],
    teamSize: 3,
    myRole: "Lead AI Engineer & Infrastructure Architect",
    duration: "4 Months",
    completionDate: null,
    metaTitle:
      "AuraAI Analytics - Real-time Churn & Predictive Metrics Platform",
    metaDescription:
      "Enterprise customer event intelligence layer leveraging streaming data nodes and real-time fine-tuned open-source models.",
    keywords: [
      "AI analytics",
      "predictive model",
      "stream processing",
      "kafka",
      "observability",
    ],
    stats: {
      users: 1420,
      commits: 384,
      githubStars: 192,
      performanceScore: 94,
      lighthouseScore: 91,
    },
    order: 1,
    published: true,
  },
  {
    title: "DevForge eCommerce Core",
    slug: "devforge-ecommerce-core",
    tagline:
      "A headless, ultra-fast GraphQL merchant framework engineered for global distribution.",
    description:
      "DevForge is an open-source merchant core utilizing modern decoupling mechanics. Built entirely on top of distributed computing layers, it allows developers to build high-performance checkout structures without breaking database dependencies.",
    category: "Full Stack",
    status: "Completed",
    featured: true,
    thumbnail: "https://unsplash.com",
    coverImage: "https://unsplash.com",
    gallery: [
      {
        image: "https://unsplash.com",
        title: "Optimized Dynamic Checkout Workflow Panel",
      },
    ],
    previewVideo: null,
    technologies: [
      { name: "Next.js", icon: "devicon-nextjs-original" },
      { name: "GraphQL", icon: "devicon-graphql-plain" },
      { name: "MongoDB", icon: "devicon-mongodb-plain" },
      { name: "Redis", icon: "devicon-redis-plain" },
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://devforge-demo.dev",
    problem:
      "Traditional headless platforms require multiple nested abstraction layers, leading to degraded Time-to-First-Byte (TTFB) and broken cross-region data operations during high-traffic drops.",
    solution:
      "Isolated inventory allocations within atomic data nodes and leveraged memory-caching layers to handle complex query responses instantly.",
    features: [
      "Sub-50ms core global cart state mutation resolutions",
      "Dynamic webhook mesh for microservice fulfillment architectures",
      "Native international tax localization arrays",
    ],
    developmentJourney: [
      {
        title: "Monolith Decoupling",
        description:
          "Broke apart traditional transactional state schemas into separate standalone data boundaries.",
      },
    ],
    futurePlans: [
      "Add standardized adapters for distributed ledger payment configurations",
      "Incorporate AI-driven stock forecasting matrices",
    ],
    teamSize: 1,
    myRole: "Solo Creator & Full Stack Developer",
    duration: "6 Weeks",
    completionDate: new Date("2026-04-15"),
    metaTitle: "DevForge Core - Headless Open Source Commerce Engine",
    metaDescription:
      "High-performance merchant runtime constructed using Node.js, GraphQL, and modern caching strategies.",
    keywords: [
      "headless ecommerce",
      "nextjs",
      "graphql",
      "mongodb",
      "speed optimization",
    ],
    stats: {
      users: 18450,
      commits: 742,
      githubStars: 1405,
      performanceScore: 99,
      lighthouseScore: 98,
    },
    order: 2,
    published: true,
  },
  {
    title: "HyperMarkdown Engine",
    slug: "hypermarkdown-engine",
    tagline:
      "An extensible Rust-powered compiler converting Markdown abstracts to semantic components.",
    description:
      "HyperMarkdown bridges the gap between text authoring and dynamic design systems. It tokenizes nested document syntaxes down into pluggable client components without the reliance on fragile runtime client parse layers.",
    category: "Open Source",
    status: "Maintaining",
    featured: false,
    thumbnail: "https://unsplash.com",
    coverImage: "https://unsplash.com",
    gallery: [],
    previewVideo: null,
    technologies: [
      { name: "Rust", icon: "devicon-rust-plain" },
      { name: "WebAssembly", icon: "devicon-wasm-plain" },
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://hypermarkdown.org",
    problem:
      "Standard server-side parsing abstractions force developers to write dangerous raw HTML hooks or handle bloated compilation processes inside client bundles.",
    solution:
      "Engineered a low-level memory compiler compiled into WebAssembly blocks to guarantee deterministic data transitions directly in the browser layer.",
    features: [
      "Zero allocations safely maintained across critical paths",
      "Hot-reload syntax block mutations natively supported",
      "Pluggable custom HTML block components mapping",
    ],
    developmentJourney: [
      {
        title: "Compiler Lexer Setup",
        description:
          "Drafted custom semantic token maps to isolate multi-line text patterns without matching regular expression loops.",
      },
    ],
    futurePlans: [
      "Create direct layout integration tooling for Next.js MDX layers",
    ],
    teamSize: 2,
    myRole: "Core WebAssembly Tooling Maintainer",
    duration: "2 Months",
    completionDate: new Date("2026-08-01"),
    metaTitle: "HyperMarkdown Engine - Blazing Fast Document Compilers",
    metaDescription:
      "Fast documentation processing framework utilizing secure Rust infrastructure blueprints and WebAssembly bridges.",
    keywords: [
      "rust compiler",
      "markdown tool",
      "webassembly",
      "static site builder",
    ],
    stats: {
      users: 5300,
      commits: 189,
      githubStars: 642,
      performanceScore: 100,
      lighthouseScore: 100,
    },
    order: 3,
    published: true,
  },
];

module.exports = data;
