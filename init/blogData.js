const blogData = [
  {
    title: "Getting Started with MongoDB Atlas",
    slug: "getting-started-with-mongodb-atlas",
    summary:
      "A beginner-friendly guide to setting up your first MongoDB Atlas cluster, connecting it to Node.js, and running your first query.",
    content: `MongoDB Atlas is the fully managed cloud database service for MongoDB. In this guide, we'll walk through the entire setup process step by step.

First, create your free cluster at atlas.mongodb.com. Choose the M0 tier for development purposes. Next, create a database user with readWrite permissions.

To connect from Node.js, install the mongoose package and use the connection string provided in Atlas. Make sure to whitelist your IP address in the network access settings.

Once connected, you can start creating schemas, models, and performing CRUD operations. Atlas provides monitoring, automated backups, and scaling options out of the box.

For production, consider using the M10 tier or higher for dedicated resources and better performance.`,
    coverImage:
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800",
    coverImageAlt: "MongoDB Atlas dashboard showing cluster overview",
    tags: ["mongodb", "database", "cloud", "nodejs"],
    status: "published",
    publishedAt: new Date("2024-03-15T08:00:00.000Z"),
  },
  {
    title: "10 React Hooks You Should Master in 2024",
    slug: "10-react-hooks-you-should-master",
    summary:
      "From useState to custom hooks — a practical breakdown of the 10 most important React hooks with real-world examples and common pitfalls.",
    content: `React hooks have fundamentally changed how we write React components. Here are the 10 hooks every developer should know.

1. useState - The basic state management hook. Use it for simple local state.
2. useEffect - Handles side effects like API calls, subscriptions, and DOM manipulation.
3. useContext - Access context values without prop drilling.
4. useReducer - Complex state logic that benefits from reducer patterns.
5. useMemo - Memoize expensive calculations to avoid unnecessary re-renders.
6. useCallback - Memoize callback functions passed as props.
7. useRef - Access DOM elements or store mutable values without triggering re-renders.
8. useLayoutEffect - Synchronous layout effects that fire before paint.
9. useId - Generate unique IDs for accessibility attributes.
10. Custom Hooks - Extract and reuse stateful logic across components.

Common pitfalls include calling hooks conditionally, forgetting dependency arrays, and not cleaning up effects properly.`,
    coverImage:
      "https://images.unsplash.com/photo-1633356122544-f134324a3cee?w=800",
    coverImageAlt: "React logo on a dark code editor background",
    tags: ["react", "javascript", "frontend", "hooks"],
    status: "published",
    publishedAt: new Date("2024-06-22T10:30:00.000Z"),
  },
  {
    title: "Understanding REST API Design Patterns",
    slug: "understanding-rest-api-design-patterns",
    summary:
      "Best practices for designing clean, scalable REST APIs — resource naming, HTTP methods, versioning, error handling, and pagination.",
    content: `A well-designed REST API is intuitive, consistent, and easy to consume. Here are the patterns I follow.

Resource Naming: Use nouns, not verbs. /users not /getUsers. Use plural forms: /users, /posts, /comments.

HTTP Methods: GET for reading, POST for creating, PUT for full updates, PATCH for partial updates, DELETE for removal.

Versioning: Prefix your API with a version number like /api/v1/users. This allows breaking changes without affecting existing clients.

Error Handling: Return meaningful error messages with appropriate HTTP status codes. Use a consistent error format with a code, message, and details field.

Pagination: Use cursor-based pagination for large datasets. Include page, limit, and total in the response metadata.

Filtering and Sorting: Support query parameters like ?status=active&sort=-createdAt for flexible data retrieval.

Rate Limiting: Implement rate limiting to protect your API from abuse. Return 429 status when limits are exceeded.`,
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    coverImageAlt: "Server racks with network cables in a data center",
    tags: ["api", "rest", "backend", "architecture"],
    status: "published",
    publishedAt: new Date("2024-08-01T14:00:00.000Z"),
  },
  {
    title: "My Journey from Frontend to Full-Stack Developer",
    slug: "my-journey-from-frontend-to-full-stack-developer",
    summary:
      "A personal story about the struggles, breakthroughs, and lessons learned while transitioning from a frontend developer to a full-stack engineer.",
    content: `Two years ago, I was a frontend developer who could only talk to APIs built by someone else. The backend felt like a black box.

The turning point came when I had to build a small tool for a side project and realized I couldn't wait for a backend developer. I started with Node.js and Express.

The first week was brutal. I didn't understand what a database was doing, why my queries were slow, or what middleware actually does. But I kept going.

Key lessons I learned:
- Start with a simple CRUD app and understand every layer
- Don't skip database fundamentals (indexes, normalization, joins)
- Authentication is harder than it looks — use established libraries
- Environment variables and configuration management matter from day one
- Testing your backend is non-negotiable

The transition took about 4 months of consistent practice. Now I feel more confident owning the entire stack, which has made me a better developer overall.`,
    coverImage:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    coverImageAlt: "Laptop screen showing code with coffee cup beside it",
    tags: ["career", "fullstack", "nodejs", "personal"],
    status: "published",
    publishedAt: new Date("2024-09-10T06:00:00.000Z"),
  },
  {
    title: "TypeScript Tips for Node.js Backend Developers",
    slug: "typescript-tips-for-nodejs-backend-developers",
    summary:
      "Practical TypeScript patterns for Express/MongoDB backends — typing Mongoose models, middleware, request validation, and error handling.",
    content: `TypeScript in a Node.js backend is not just about types — it's about catching bugs before runtime. Here are patterns that actually help.

Typing Mongoose: Define your interfaces first, then use them in the schema. This gives you autocomplete and compile-time safety on model instances.

Express Middleware: Create a typed middleware wrapper so req, res, and next are properly inferred. This eliminates the any type in your route handlers.

Request Validation: Use zod or joi to validate incoming data, then extract the typed result. This way your handler receives a guaranteed shape.

Error Handling: Create a custom AppError class with typed fields (statusCode, isOperational). Use a global error handler middleware that catches everything.

Dependency Injection: Pass dependencies explicitly rather than using global state. This makes your code testable and types flow naturally through function parameters.

tsconfig: Use strict mode, noUncheckedIndexedAccess, and exactOptionalPropertyTypes. These catch subtle bugs that optional chaining alone won't.`,
    coverImage:
      "https://images.unsplash.com/photo-1516106964684-91613416557c?w=800",
    coverImageAlt: "TypeScript logo displayed on a monitor with code",
    tags: ["typescript", "nodejs", "mongodb", "backend"],
    status: "draft",
    publishedAt: null,
  },
];

module.exports = blogData;
