# IMG300 Project Status & Checkpoint

> **Development Checkpoint & Rulebook**
> This document defines the current development phase, completed stages, paused tasks, and strict rules for conducting Alpha Testing.

---

## Current Phase

**IMG300 Alpha Testing Build**

The system UI has been converged into an Alpha Testing Studio optimized for producing real poster compositions, testing Top-K ranked generation results, and observing human perceptual preferences.

---

## Completed Stages

### Phase I — Generative Geometry (Steps 0–7)
- Discrete 2D modular grid coordinate system
- Bounded exact Top-K solver with hard non-overlap, boundary, capacity, and safe score-upper-bound pruning
- Physical-pixel geometry candidates using actual canvas dimensions, four margins, and gutters
- Aspect-ratio shortlist safeguards and `cover` image visible-area protection
- Translation-normalized Top-K topology deduplication with spatial-spread tie-breaking
- Multi-objective global scoring ($S_{\text{shape}}, S_{\text{hierarchy}}, S_{\text{alignment}}, S_{\text{density}}, S_{\text{proximity}}, S_{\text{LEC}}, S_{\text{axis}}$)

### Phase II — Rendering System (Steps 8–10)
- 1D binary search text fitting and Canvas `measureText()` metrics
- Baseline grid ceiling snap ($\lceil \cdot \rceil$) and font weight / tracking / line-height coupling
- Text alignment modes (`left`, `center`, `right`, `justify`) and Rag diagnostics
- Universal visible area formula $A_i^{\text{visible}} = \min(B, W^{\text{render}}) \cdot \min(D, H^{\text{render}})$
- Image fit modes (`cover`, `contain`) and true focal point preservation crop geometry $(o_x, o_y)$
- Cross-modal dominance consistency ($S_{\text{cross}}$) via Total Variation Distance ($D_{\text{TV}}$)
- Two-level Image-Text boundary geometry ($d^{\text{module}}, G^{\text{px}}, m^{\text{gutter}}, L_{\text{shared}}$, Axis Coincidence)

### Phase III — Design Intelligence (Steps 11.1–11.2)
- Step 11.1 Layout Dataset Generator (`generateCompositionDataset`)
- Step 11.2 High-dimensional Feature Vector Extractor (`extractFeatureVectorFromComposition`)

---

## Paused Stages

### Step 11.3 — Pairwise Preference Collector
- **Status**: **PAUSED**
- **Rationale**: We intentionally paused Step 11.3 and machine learning weight fitting because we require real Alpha testing failure data and designer observations before introducing preference learning or additional heuristics.

---

## Current Testing Goal

The current objective is **NOT** to improve the algorithm or add new math rules.

The objective is to produce real posters and identify empirical failure cases.

### Primary Question

> **“Would a human actually choose Rank #1?”**

### Observations to Record per Test

For each poster test, record:
1. **Input elements**: Count, types, content, source images.
2. **Hierarchy settings**: Relative $h_i$ values and target aspect ratios $r_i$.
3. **Top-K results**: Top-3 global scores and candidate placements.
4. **Human preferred result**: Rank selected by human eye (#1, #2, #3, or none).
5. **Match status**: Does human preferred result match Rank #1?
6. **Reason for disagreement**: Detailed qualitative explanation if human prefers #2 or #3 over #1.
7. **Failure categories to observe**:
   - Typography failures (e.g. baseline misalignment, awkward line wraps)
   - Image crop failures (e.g. focal point misplacement)
   - Hierarchy failures (e.g. body text visually dominating headline)
   - Spacing / negative-space failures (e.g. awkward gaps)
   - Image-text relationship failures (e.g. corner touch feeling disjointed)
   - Solver / UI bugs

---

## Current Development Rule

> **CRITICAL RULE DURING ALPHA TESTING**
> **DO NOT** introduce new scoring heuristics merely to fix individual examples or one-off design preference glitches.
> Collect failure cases first.
> Only modify the scoring model after repeated, systematic patterns appear across multiple tests.

---

## Next Planned Stage

After completing approximately **10–20 meaningful poster tests**:

1. Review and synthesize the collected failure case logs.
2. Categorize recurring structural problems.
3. Compare human preferences against existing feature vectors ($\mathbf{x}_C$).
4. Determine which specific existing metric fails to explain human preference.
5. Only then decide whether Step 11.3 or a new scoring signal is justified.
