# AI Notes

- Used GitHub Copilot and the coding assistant for implementation, debugging, and iteration.
- Did most of the structural coding with AI help, but made the product decisions myself:
  - chunking strategy
  - workspace-scoped retrieval
  - tool-calling loop design
  - service boundaries
- Key decision: kept retrieval strictly workspace-scoped inside the vector search, not as a post-filter.
- Key decision: used overlapping chunks so each retrieval block kept useful context around section boundaries.
- Key decision: used a small validated tool-calling loop so tool execution stayed predictable.
- Hardest mistake: the AI suggested filtering workspace results after similarity search.
- What went wrong: cross-workspace context leaked during testing.
- How it was fixed: moved the workspace filter into the actual vector-query filter and kept ingestion/retrieval metadata consistent.
- What I would improve with more time:
  - stronger document re-indexing and cleanup
  - better retrieval evaluation
  - clearer logs for chunk counts, embedding failures, and tool-call outcomes
