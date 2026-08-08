# IMG300 Grid System Architecture Specification

> **Source of Truth Document**
> This specification documents the **currently implemented system architecture, mathematical models, rendering pipelines, and file responsibilities** in the IMG300 codebase as of the **Alpha Testing Build**.

---

## 1. System Overview & Core Philosophy

IMG300 is a computational graphic design engine for Swiss-style modular posters. The core philosophy separates structural space allocation from content rendering:

$$\text{Hierarchy } (h_i) \;\;\longrightarrow\;\; \text{Grid Geometry Allocation } (C_i) \;\;\longrightarrow\;\; \text{Typography \& Image Rendering}$$

1. **Phase I — Generative Geometry**: Given element hierarchies $h_i$, the exact solver evaluates all non-overlapping grid placements on a discrete 2D modular lattice to select Top-K structural compositions using a weighted multi-objective scoring function ($S_{\text{global}}$).
2. **Phase II — Rendering Engine**: Text font size, baseline grid snapping, leading, font weight coupling, tracking, image cropping, and focal point preservation are calculated inside container bounds $(B_i, D_i)$.
3. **Phase III — Design Intelligence (Measurement & Dataset)**: High-dimensional feature vectors ($\mathbf{x}_C$) and multi-scenario layout test sets are generated for empirical visual validation and future preference learning.

---

## 2. File Organization & Responsibilities

| File Path | Role & Primary Responsibility |
| :--- | :--- |
| [useGridElements.ts](file:///Users/victorchen/Desktop/IMG300/src/hooks/useGridElements.ts) | **Core Engine**: Data models, candidate geometry generators, exact backtracking solver, 7 soft scoring heuristics, 1D binary search typography engine, baseline grid fitting, image fit/focal point geometry, $S_{\text{TH}}$, $S_{\text{cross}}$, and Image-Text boundary metrics. |
| [datasetGenerator.ts](file:///Users/victorchen/Desktop/IMG300/src/utils/datasetGenerator.ts) | **Phase III Engine**: Scenario templates, multi-scenario dataset generator (`generateCompositionDataset`), and complete feature vector extractor (`extractFeatureVectorFromComposition`). |
| [usePairwisePreferenceCollector.ts](file:///Users/victorchen/Desktop/IMG300/src/hooks/usePairwisePreferenceCollector.ts) | **Phase III Collector (Paused)**: Data stream hook for managing pairwise candidate comparisons, designer choices (A/B/Tie), and JSON export. |
| [GridSystemStudio.tsx](file:///Users/victorchen/Desktop/IMG300/src/components/GridSystemStudio.tsx) | **Main Container Component**: Coordinates canvas sizing, web font loading, canvas rendering loop (`renderCanvas`), and export triggers. |
| [GridElementControl.tsx](file:///Users/victorchen/Desktop/IMG300/src/components/common/GridElementControl.tsx) | **Alpha Test Control Panel**: Element creation/editing UI, Top-K solution rank selector tab, and collapsible research audit metrics panel. |
| [PairwisePreferenceStudio.tsx](file:///Users/victorchen/Desktop/IMG300/src/components/common/PairwisePreferenceStudio.tsx) | **Pairwise UI Component (Secondary)**: Collapsible UI component rendering side-by-side A/B comparisons and feature delta tables. |
| [canvasMath.ts](file:///Users/victorchen/Desktop/IMG300/src/utils/canvasMath.ts) | **Canvas Renderer Utilities**: Draws modular grid lines, baseline grid guides, snapped text typography, image cropping canvas contexts, and background filters. |

---

## 3. Metric & Score Classification System

To prevent future regression or misclassification, every mathematical quantity in the codebase belongs to exactly one of four strict functional categories:

* **`CONSTRAINT`**: Hard binary boundary or validity rule. Violations prune candidates or reject layout feasibility ($1 / 0$).
* **`SCORING SIGNAL`**: Continuous normalized term $\in [0, 1]$ directly weighted in the objective function $S_{\text{global}}$.
* **`MEASUREMENT ONLY`**: Purely descriptive metric computed for visual inspection, diagnostics, or feature vectors. **MUST NOT be directly used as a scoring heuristic.**
* **`VALIDATION ONLY`**: Quality index evaluating alignment against intended parameters or hierarchy. **MUST NOT be included in $S_{\text{global}}$.**

---

## 4. Grid & Element Data Models

### 4.1 Grid Coordinates & Metrics
Canvas size $W \times H$, margins $M_x, M_y$, grid columns $C$, grid rows $R$, gutters $g_x, g_y$.
Usable width $W_{\text{usable}} = W - 2M_x - (C - 1)g_x$, usable height $H_{\text{usable}} = H - 2M_y - (R - 1)g_y$.
Single Module Size:
$$u_w = \frac{W_{\text{usable}}}{C}, \qquad u_h = \frac{H_{\text{usable}}}{R}$$

### 4.2 Element Representation
Each element $E_i$ has:
- `id`, `name`, `type` (`"text"` \| `"image"`)
- Hierarchy Weight: $h_i \in [0, 100]$
- Plain-language Visual Priority: `primary` \| `secondary` \| `supporting`, mapped to $h_i$ through a global `gentle` \| `balanced` \| `bold` contrast preset. The raw numeric hierarchy remains available in Advanced Debug.
- Visual Weight Proxy: $V_i = h_i^{\gamma} \quad (\gamma = 2.0)$
- Target Aspect Ratio: $r_i^{\text{target}} = \frac{w}{h}$
- Group ID: `groupId` (optional semantic grouping string)
- Text Properties: `content`, `fontWeight` (100–900), `fontScale` (25%–100% of the safe auto-fit size), `trackingEm` ($\tau_i$), `lineHeightRatio` ($k_i$), `textAlign` (`"left"` \| `"center"` \| `"right"` \| `"justify"`)
- Image Properties: `sourceWidth`, `sourceHeight`, `imageFit` (`"cover"` \| `"contain"`), `focalPointX` ($f_x \in [0,1]$), `focalPointY` ($f_y \in [0,1]$)

---

## 5. Constraint System & Candidate Generation

### 5.1 Hard Constraints (`CONSTRAINT`)
1. **Grid Bounds**: Placement $(x, y, w, h)$ must satisfy $1 \le x \le C$, $1 \le x + w - 1 \le C$, $1 \le y \le R$, $1 \le y + h - 1 \le R$. `[CONSTRAINT]`
2. **Non-Overlap Constraint**: For any distinct elements $E_i, E_j$, their grid module ranges must not intersect:
   $$\big([x_i, x_i+w_i-1] \cap [x_j, x_j+w_j-1] = \emptyset\big) \;\lor\; \big([y_i, y_i+h_i-1] \cap [y_j, y_j+h_j-1] = \emptyset\big) \quad \text{`[CONSTRAINT]`}$$

### 5.2 Ideal Area Allocation & Geometry Candidates
Total grid modules $A_{\text{grid}} = C \times R$. Available content area $A_{\text{avail}} = A_{\text{grid}} \cdot \text{contentDensity}$.
Ideal Module Area:
$$A_i^{\text{ideal}} = \frac{V_i}{\sum_j V_j} \cdot A_{\text{avail}}$$

Candidate geometries $(w, h)$ are generated by sweeping integer spans $1 \le w \le C, 1 \le h \le R$ and filtering candidates by area fitting penalty and ratio error:
$$\text{Cost}(w, h) = \lambda_{\text{area}} \left| \frac{w \cdot h - A_i^{\text{ideal}}}{A_i^{\text{ideal}}} \right| + \lambda_{\text{ratio}} \left| \frac{w / h - r_i^{\text{target}}}{r_i^{\text{target}}} \right|$$

---

## 6. Solver & Global Scoring Architecture ($S_{\text{global}}$)

### 6.1 Backtracking Exact Solver
`solveExactLayout` recursively searches candidate assignments depth-by-depth ($0 \dots N-1$).
At each depth, any candidate overlapping previously placed elements is immediately pruned. Complete valid placements are scored by $S_{\text{global}}$, and the Top-K highest-scoring solutions are preserved.

For interactive responsiveness, the geometry generator passes the three highest-scoring discrete geometries per element into the placement search. The solver exhaustively searches that shortlist when it fits within a deterministic node budget scaled by grid area. Searches exceeding the node budget return the best evaluated Top-K results with `searchTruncated: true`; the Alpha Studio displays this state so partial searches are not mistaken for exhaustive rankings. High-cost research sliders commit their value when the user releases the control, avoiding a complete solver run for every intermediate drag value.

### 6.2 Objective Scoring Function ($S_{\text{global}}$)
$$S_{\text{global}} = \lambda_S S_{\text{shape}} + \lambda_H S_{\text{hierarchy}} + \lambda_A S_{\text{alignment}} + \lambda_D S_{\text{density}} + \lambda_P S_{\text{proximity}} + \lambda_{\text{LEC}} S_{\text{LEC}} + \lambda_{\text{axis}} S_{\text{axis}}$$

| Term | Metric Name | Category | Mathematical Formulation / Definition |
| :--- | :--- | :--- | :--- |
| $S_{\text{shape}}$ | Aspect Ratio & Area Penalty | `SCORING SIGNAL` | Average candidate cost penalty: $1 - \frac{1}{N} \sum \min(1, \text{Cost}_i)$. |
| $S_{\text{hierarchy}}$ | Hierarchy Order Consistency | `SCORING SIGNAL` | Pairwise area ratio alignment: $1 - \frac{1}{\binom{N}{2}} \sum_{i<j} \mathbb{I}\left[(h_i - h_j)(A_i - A_j) < 0\right]$. |
| $S_{\text{alignment}}$ | Edge Flushness Ratio | `SCORING SIGNAL` | Proportion of outer boundary edges flush with grid boundaries. |
| $S_{\text{density}}$ | Target Fill Density Match | `SCORING SIGNAL` | Gaussian error: $\exp\left(-\frac{(\sum A_i / A_{\text{grid}} - \text{contentDensity})^2}{0.1}\right)$. |
| $S_{\text{proximity}}$ | Group Proximity ($S_P$) | `SCORING SIGNAL` | Semantic group closeness: $\frac{1}{M_{\text{pairs}}} \sum \frac{1}{1 + d_{\text{rect}}(E_i, E_j)}$. |
| $S_{\text{LEC}}$ | Whitespace Connectivity | `SCORING SIGNAL` | Largest Empty Rectangle area normalized by total empty modules: $\frac{\text{Area}(\text{LEC})}{A_{\text{empty}}}$. |
| $S_{\text{axis}}$ | Super-Linear Axis Strength | `SCORING SIGNAL` | Normalized squared alignment count: $\frac{A_x + A_y}{4(N-1)^2}$ where $A_x = \sum (c_k - 1)^2$. |

---

## 7. Typography Pipeline

### 7.1 Container Geometry & Binary Search Font Fitting
For container width $B_i$ and height $D_i$, net content width $B_i^{\text{net}} = B_i - 2 \cdot \text{textPaddingInline}$ (12px).
Optimal font size $s_i^*$ is determined via 1D Binary Search in range $[s_{\min}, s_{\max}]$:
$$\text{textExtentHeight}(s_i) = \text{lineCount}(s_i, B_i^{\text{net}}) \cdot (k_i \cdot s_i) \le D_i$$

### 7.2 Font Metrics & Baseline Grid Ceiling Fitting
Canvas API `measureText()` extracts exact actual font metrics:
- $a_i = \operatorname{actualBoundingBoxAscent}(font, s_i^*)$
- $d_i = \operatorname{actualBoundingBoxDescent}(font, s_i^*)$

First baseline $\beta_{i,0}$ snaps to baseline grid lattice $B(b, y_0) = \{y_0 + k \cdot b \mid k \in \mathbb{Z}\}$ via **Ceiling Snap ($\lceil \cdot \rceil$)** to prevent container top overflow:
$$\beta_{i,0} = y_0 + \left\lceil \frac{Y_i + a_i - y_0}{b} \right\rceil \cdot b \quad \implies \quad \beta_{i,0} - a_i \ge Y_i \quad \text{`[CONSTRAINT]`}$$

Leading $\ell_i = k_i \cdot s_i^*$ snaps to baseline units: $\ell_i^{\text{snap}} = \max\left(b, \; \left\lceil \frac{\ell_i}{b} \right\rceil \cdot b\right)$.

### 7.3 Font Weight & Tracking Coupling
- Font Weight Coupling Proxy: $V_i^{\text{type}} = s_i^2 (1 + \gamma_f \cdot \hat{f}_i) \rho_i$ where $\hat{f}_i = \frac{\text{fontWeight} - 100}{800}$.
- Tracking $\tau_i$ (in em): Modified character width $w' = w + \tau_i \cdot s_i^*$. Refits $s_i^*(\tau_i)$ to ensure text container fitting.

### 7.4 Alignment & Rag Diagnostics
- Alignment Modes: `left`, `center`, `right`, `justify`.
- Rag Measurements (`MEASUREMENT ONLY`): Line width variance, jump ratio $J = \frac{\frac{1}{L-1} \sum |w_l - w_{l+1}|}{w_{\max} - w_{\min}}$, and staircase pattern detection.
- Typographic Hierarchy Consistency $S_{\text{TH}}$ (`VALIDATION ONLY`): Pairwise agreement between intended hierarchy $h_i$ and rendered typographic weight $V_i^{\text{type}}$.

---

## 8. Image Pipeline

### 8.1 Universal Visible Area & Fit Modes
For source image $(W_{\text{src}}, H_{\text{src}})$ and container $(B_i, D_i)$:
- Cover scale: $s = \max\left(\frac{B}{W_{\text{src}}}, \frac{D}{H_{\text{src}}}\right) \implies W^{\text{render}} = s W_{\text{src}}, H^{\text{render}} = s H_{\text{src}}$
- Contain scale: $s = \min\left(\frac{B}{W_{\text{src}}}, \frac{D}{H_{\text{src}}}\right) \implies W^{\text{render}} = s W_{\text{src}}, H^{\text{render}} = s H_{\text{src}}$
- Universal Visible Area (`MEASUREMENT ONLY`):
  $$A_i^{\text{visible}} = \min(B, W^{\text{render}}) \cdot \min(D, H^{\text{render}})$$

### 8.2 True Focal Point Preservation Crop Geometry
Given focal point offsets $(f_x, f_y) \in [0, 1]$:
$$o_x = \operatorname{clamp}\left(f_x \cdot W^{\text{render}} - \frac{B}{2}, \; 0, \; W^{\text{render}} - B\right)$$
$$o_y = \operatorname{clamp}\left(f_y \cdot H^{\text{render}} - \frac{D}{2}, \; 0, \; H^{\text{render}} - D\right)$$

### 8.3 Geometric Dominance (`MEASUREMENT ONLY`)
- $V_{\text{img}}^{\text{geo}} = A_i^{\text{visible}} \quad (\text{px}^2)$
- Canvas Coverage Ratio: $q_i^{\text{canvas}} = \frac{A_i^{\text{visible}}}{A_{\text{canvas}}}$

---

## 9. Cross-Modal & Boundary Measurements

### 9.1 Cross-Modal Dominance Consistency ($S_{\text{cross}}$) (`VALIDATION ONLY`)
Normalizes text area proxy $d_i^{\text{text}} = q_i^{\text{text-area}}(1 + \gamma_f \hat{f}_i)$ and image proxy $d_i^{\text{img}} = q_i^{\text{canvas}}$ into cross-modal distribution $q^{\text{cross}}$.
Compares against normalized intended hierarchy $q^{\text{hierarchy}}$ via Total Variation Distance:
$$D_{\text{TV}}(q^{\text{cross}}, q^{\text{hierarchy}}) = \frac{1}{2} \sum_{i=1}^N |q_i^{\text{cross}} - q_i^{\text{hierarchy}}|$$
$$S_{\text{cross}} = 1 - D_{\text{TV}} \quad \text{`[VALIDATION ONLY / MEASUREMENT ONLY]`}$$

### 9.2 Image-Text Boundary Geometry (`MEASUREMENT ONLY`)
For Image $I$ and Text $T$:
1. **Grid Module Gap**: $d_x^{\text{module}}, d_y^{\text{module}}, d_{IT}^{\text{module}} = d_x + d_y$. `[MEASUREMENT ONLY]`
2. **Physical Pixel Gap**: $G_x^{\text{px}}, G_y^{\text{px}}, G_{\text{px}} = G_x^{\text{px}} + G_y^{\text{px}}$. `[MEASUREMENT ONLY]`
3. **Physical Gutter Units**: $m_x^{\text{gutter}} = \frac{G_x^{\text{px}}}{g_x}, m_y^{\text{gutter}} = \frac{G_y^{\text{px}}}{g_y}$. `[MEASUREMENT ONLY]`
4. **Physical Spacing Rhythm Decomposition**:
   $$G^{\text{px}} = n_m \cdot u + n_g \cdot g \qquad (n_m, n_g \in \mathbb{Z}_{\ge 0}) \quad \text{`[MEASUREMENT ONLY]`}$$
5. **Shared Spine Boundary Length**: $L_{\text{shared}} = L_v + L_h$ (in px & grid modules). `[MEASUREMENT ONLY]`
6. **Axis Coincidence**: Same-side alignment axes (`sharesLeftAxis`, etc.) and opposing adjacency axes (`opposingVerticalAxis`, etc.). `[MEASUREMENT ONLY]`

---

## 10. Phase III Data Pipeline

### 10.1 Composition Feature Vector ($\mathbf{x}_C$)
`extractFeatureVectorFromComposition` in `datasetGenerator.ts` generates high-dimensional feature vectors:
$$\mathbf{x}_C = \left[ S_S, S_H, S_A, S_D, S_P, S_{\text{LEC}}, S_{\text{axis}}, S_{\text{TH}}, S_{\text{cross}}, D_{\text{TV}}, L_{\text{shared\_px}}, L_{\text{shared\_ratio}}, d_{\text{module}}, G_{\text{px}}, n_m, n_g \right]^\top$$

### 10.2 Scenario Dataset Generator ($\mathcal{D}$)
`generateCompositionDataset` runs batch generation across preset element scenarios (`2 Text`, `3 Text`, `1 Text + 1 Image`, `2 Text + 1 Image`, `2 Text + 2 Images`, `3 Text + 1 Image`) for empirical testing and feature vector logging.
