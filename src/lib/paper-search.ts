/**
 * Paper Search — Intent detection and paper lookup
 *
 * Detects if a user is asking for a past paper and returns the
 * appropriate download link from papers.json, avoiding AI hallucination.
 */

import papersData from "@/data/papers.json";

interface Paper {
  id: string;
  exam: string;
  subject: string;
  year: number;
  url: string;
  keywords: string[];
}

/**
 * Detect if the user's message is asking for a past paper
 */
export function isPaperRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const paperIndicators = [
    "past paper",
    "previous year",
    "question paper",
    "download paper",
    "pyq",
    "previous year question",
    "old paper",
    "sample paper",
    "model paper",
    "exam paper",
    "paper download",
    "give me paper",
    "need paper",
    "want paper",
    "send paper",
    "get paper",
    "paper for",
    "paper of",
  ];

  return paperIndicators.some((indicator) => lowerMessage.includes(indicator));
}

/**
 * Search for matching papers based on user's query
 *
 * Uses keyword matching to find relevant papers.
 * Returns matched papers sorted by relevance (number of keyword matches).
 */
export function searchPapers(query: string): Paper[] {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/);

  // Score each paper based on keyword matches
  const scoredPapers = (papersData.papers as Paper[]).map((paper) => {
    let score = 0;

    for (const keyword of paper.keywords) {
      if (lowerQuery.includes(keyword)) {
        score += 2; // Direct inclusion in query
      }
      for (const word of queryWords) {
        if (word === keyword) {
          score += 1; // Exact word match
        }
      }
    }

    // Check for exam name match
    if (lowerQuery.includes(paper.exam.toLowerCase())) {
      score += 3;
    }

    // Check for subject match
    if (lowerQuery.includes(paper.subject.toLowerCase())) {
      score += 3;
    }

    // Check for year match
    if (lowerQuery.includes(paper.year.toString())) {
      score += 4; // Year is highly specific
    }

    return { paper, score };
  });

  // Return papers with score > 0, sorted by score descending
  return scoredPapers
    .filter((sp) => sp.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((sp) => sp.paper);
}

/**
 * Format paper search results into a bot response
 */
export function formatPaperResponse(papers: Paper[]): string {
  if (papers.length === 0) {
    return (
      "I couldn't find a matching paper for your request. " +
      "Please try specifying the exam name (JEE/NEET/CET), subject, and year. " +
      "You can also click the **Download Past Papers** button to see all available papers."
    );
  }

  if (papers.length === 1) {
    const p = papers[0];
    return (
      `Here's the paper you're looking for:\n\n` +
      `📝 **${p.exam} ${p.subject} ${p.year}**\n` +
      `📥 [Click here to download](${p.url})\n\n` +
      `Need a different paper? Just ask!`
    );
  }

  let response = `I found ${papers.length} matching papers:\n\n`;
  for (const p of papers.slice(0, 5)) {
    response += `📝 **${p.exam} ${p.subject} ${p.year}**\n`;
    response += `📥 [Download](${p.url})\n\n`;
  }

  if (papers.length > 5) {
    response += `...and ${papers.length - 5} more. Click **Download Past Papers** to see all available papers.`;
  }

  return response;
}
