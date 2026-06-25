import type { ProjectMatchResult, SVProject } from "./types"

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "i", "me", "my", "we", "our", "you", "your", "it", "its", "this", "that", "need", "want",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

const SYNONYMS: Record<string, string[]> = {
  web: ["website", "frontend", "react", "nextjs", "html", "css"],
  mobile: ["android", "ios", "flutter", "react-native", "app"],
  ai: ["machine", "learning", "ml", "neural", "gpt", "llm", "chatbot"],
  data: ["analytics", "dashboard", "visualization", "chart", "database"],
  game: ["gaming", "unity", "godot", "phaser"],
  api: ["backend", "rest", "graphql", "server", "express"],
}

function expandTerms(terms: string[]): Set<string> {
  const expanded = new Set(terms)
  for (const term of terms) {
    expanded.add(term)
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (term.includes(key) || syns.some(s => term.includes(s))) {
        expanded.add(key)
        syns.forEach(s => expanded.add(s))
      }
    }
  }
  return expanded
}

export function matchProjects(query: string, projects: SVProject[], limit = 6): ProjectMatchResult[] {
  const queryTerms = expandTerms(tokenize(query))
  if (queryTerms.size === 0) return []

  const results: ProjectMatchResult[] = []

  for (const project of projects) {
    const corpus = `${project.title} ${project.description}`.toLowerCase()
    const corpusTerms = tokenize(corpus)
    const corpusSet = new Set(corpusTerms)

    const matchedTerms: string[] = []
    let score = 0

    for (const term of queryTerms) {
      if (corpus.includes(term)) {
        matchedTerms.push(term)
        score += corpusSet.has(term) ? 2 : 1
      }
    }

    if (project.title.toLowerCase().split(/\W+/).some(w => queryTerms.has(w.toLowerCase()))) {
      score += 3
    }

    if (score > 0) {
      results.push({
        project,
        score: score / queryTerms.size,
        matchedTerms: [...new Set(matchedTerms)].slice(0, 5),
      })
    }
  }

  return results
    .sort((a, b) => b.score - a.score || b.project.likes - a.project.likes)
    .slice(0, limit)
}
