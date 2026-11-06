require("dotenv").config();

const mongoose = require("mongoose");
const Project = require("../model/project");

module.exports.homeRoute = async (req, res) => {
  const projects = await Project.find({ published: { $ne: false } })
    .select("title title_bn title_en tagline tagline_bn tagline_en slug technologies thumbnail liveUrl githubUrl featured")
    .sort({ order: 1, createdAt: -1 })
    .lean();

  const username = "Russell1269";

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "Node-App",
  };

  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const [user, reposResult, eventsResult] = await Promise.all([
    fetchWithTimeout(`https://api.github.com/users/${username}`),
    fetchWithTimeout(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`),
    fetchWithTimeout(`https://api.github.com/users/${username}/events/public?per_page=10`),
  ]);
  const repos = Array.isArray(reposResult) ? reposResult : [];
  const events = Array.isArray(eventsResult) ? eventsResult : [];

  const languageBytes = {};

  await Promise.all(
    repos.map(async (repo) => {
      const langs = await fetchWithTimeout(
        `https://api.github.com/repos/${repo.owner.login}/${repo.name}/languages`,
      );
      if (langs && typeof langs === "object") {
        // { "JavaScript": 12345, "CSS": 6789 }
        for (const [lang, bytes] of Object.entries(langs)) {
          languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
        }
      }
    }),
  );

  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);

  const langColors = {
    JavaScript: "#F7DF1E",
    TypeScript: "#3178C6",
    "Node.js": "#68A063",
    Python: "#3572A5",
    HTML: "#E34C26",
    CSS: "#563D7C",
    Java: "#B07219",
    "C++": "#F34B7D",
    C: "#555555",
    PHP: "#4F5D95",
    Go: "#00ADD8",
    Rust: "#DEA584",
    Ruby: "#701516",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Shell: "#89E051",
    Vue: "#41B883",
    SCSS: "#C6538C",
    EJS: "#A91E90",
  };

  const languages = Object.entries(languageBytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6) // top 6
    .map(([name, bytes]) => ({
      name,
      percentage: totalBytes ? Math.round((bytes / totalBytes) * 100) : 0,
      color: langColors[name] || "#999999",
    }));

  const repositories = repos
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 3)
    .map((repo) => ({
      name: repo.name,
      description: repo.description || req.t("home:github.repos.noDescription"),
      language: repo.language || "N/A",
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at,
      githubUrl: repo.html_url,
      homepage: repo.homepage || "",
    }));

  const github = {
    profile: {
      avatar: user?.avatar_url || "",
      name: user?.name || "MD Rasel Hasan",
      username: user?.login || username,
      bio: user?.bio || "",
      location: user?.location || "",
      company: user?.company || "",
      blog: user?.blog || "",
      githubUrl: user?.html_url || `https://github.com/${username}`,
      joined: user?.created_at || null,
    },

    stats: {
      followers: user?.followers || 0,
      following: user?.following || 0,
      publicRepos: user?.public_repos || repos.length,
      totalStars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
    },
    languages,
    repositories,
    contributions: events.map((e) => ({
      type: e.type,
      repo: e.repo.name,
      date: e.created_at,
      title: e.payload?.commits?.[0]?.message || e.payload?.action || "",
    })),
  };

  res.render("main/home", {
    projects,
    github,
  });
};
