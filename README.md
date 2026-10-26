# Paragon Figma Design QA Framework

An autonomous, senior human-QA-level automation framework designed to audit live web storefronts (e.g. Shopify themes) against exact Figma designs with pixel-level precision, dynamic CMS understanding, and zero false positives.

---

## 🌟 Key Highlights & Philosophy

Traditional UI testing tools fail because they treat dynamic client catalogs, hover states, and font rendering idiosyncrasies as visual defects. This framework implements a **10-Year Senior Human QA standard**:

1. **Recursive Figma Artboard Crawling**: Extracts 100% of Figma elements directly from design JSON trees—including leaf typography nodes, container box models, button CTAs, SVG vector paths, sliding progress bars, and marquee ribbons.
2. **Dynamic Catalog Intelligence**: Differentiates live client catalog changes (e.g., dynamic product titles, localized currency such as INR `₹` vs static USD mockups) from true design defects.
3. **Typography & Measurements**: Verifies font families, sizes, weights, line heights, colors, and embedded text transforms (`UPPERCASE`, `LOWERCASE`, `ORIGINAL`) without false font-loading fallbacks (`await document.fonts.ready`).
4. **Interactive & Micro-State Validation**: Recognizes hover-revealed action bars (such as product card Add to Cart buttons), carousel dragging/swiping, and drawer components.
5. **Multi-Viewport by Design**: Evaluates responsive layouts across **Desktop (1280px)**, **Tablet (744px/768px)**, and **Mobile (390px)**.
6. **Dual Enterprise Deliverables**: Produces an interactive HTML QA report with real-time search, filters, and local-storage comment boxes alongside clean TSV spreadsheets for Excel and Google Sheets.

---

## 📁 Repository Structure

```text
Paragon-Figma-Design-QA/
├── figma/
│   └── cache/               # Frozen offline Figma artboard JSON snapshots (Tracked via Git LFS)
├── reports/
│   └── audit/               # Generated HTML, TSV, and JSON audit artifacts
│       ├── human-qa-report.html                # Interactive multi-viewport HTML report
│       ├── qa-audit-multi-viewport-perfect.tsv  # Consolidated 888-row Excel-ready TSV
│       └── qa-audit-excel-export-perfect.tsv   # Desktop 1280px 367-row Excel-ready TSV
├── scripts/
│   ├── multi-viewport-audit-engine.ts          # Core multi-breakpoint audit engine
│   ├── generate-multi-viewport-report.ts       # Orchestrator for full 3-viewport HTML report
│   ├── generate-perfect-excel-report.ts        # Generator for clean TSV export
│   └── generate-perfect-html-report.ts         # Standalone desktop HTML report generator
├── tests/
│   ├── audit/               # Full audit orchestrators and report builders
│   ├── figma/               # Figma API tree crawlers and offline reference builders
│   ├── responsive/          # Responsive overlap, clipping, and layout tests
│   ├── smoke/               # Storefront availability and page load tests
│   └── visual/              # Visual block, DOM style, and section matchers
├── utils/                   # TypeScript utilities for audit grouping, observers, and parsers
├── .env.example             # Template for environment variables and access tokens
├── package.json             # NPM dependencies and audit CLI scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Git & Git LFS** (required to pull large Figma JSON caches)

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/nikunj-r-patel/Paragon-Figma-Design-QA.git
cd Paragon-Figma-Design-QA

# Pull large Figma cache files
git lfs pull

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the template and configure your project keys:

```bash
cp .env.example .env
```

Edit `.env` with your details:
- `PREVIEW_URL`: Full URL of the live theme or webpage to test.
- `FIGMA_URL`: URL to the target Figma artboard or frame.
- `FIGMA_ACCESS_TOKEN`: Personal Access Token from Figma Account Settings.
- `CLICKUP_API_TOKEN` & `CLICKUP_LIST_ID`: *(Optional)* For automated defect ticketing.

---

## 🛠️ Running Audits

### Generate the Comprehensive Multi-Viewport Human QA Report
Executes the full evaluation across Desktop (1280px), Tablet (744px), and Mobile (390px):

```bash
npx ts-node scripts/generate-multi-viewport-report.ts
```

Output:
- Interactive HTML: `reports/audit/human-qa-report.html`
- Excel TSV Export: `reports/audit/qa-audit-multi-viewport-perfect.tsv`

### Refresh Figma Design Cache (Freeze Offline Snapshot)
To download and freeze the latest Figma artboard state for deterministic offline runs:

```bash
npm run figma:freeze
```

### Run Full Playwright Audit Suite
```bash
npm test
```

---

## 📊 Report Features

The generated **`human-qa-report.html`** includes:
- **Breakpoint Switcher**: Instant switching between Desktop, Tablet, and Mobile.
- **Embedded Case Specs**: Evaluates text transformations directly in the typography column (e.g. `Font: Roboto Slab, Size: 16px, Weight: 900, LH: 24px, Color: rgb(241, 242, 243), Case: UPPERCASE`).
- **Dynamic Category Filters**: Filter by `Typography`, `Section Box Model`, `Button / Interactive Control`, `Media / Image / Marquee`, `SVG / Vector Icon`, and `Slider / Progress Bar`.
- **Instant Search**: Search by layer name, Figma breadcrumb, or CSS style values.
- **Persistent Feedback / Comment Inputs**: Built-in reviewer comment inputs that persist automatically in local storage.
- **Export Ready**: Includes one-click download for clean TSV spreadsheets and a dedicated print/PDF stylesheet.

---

## 📄 License
Private & Confidential — Built for Paragon QA Automation.
