# Figma Reference Repositories - Comprehensive Analysis Report

## Executive Summary

The `reference-repos` folder contains 8 distinct open-source projects that provide complementary approaches to extracting, parsing, and converting Figma design data into consumable formats. These repositories demonstrate various strategies including REST API-based extraction, design token generation, MCP (Model Context Protocol) integration, and format conversion. The projects span multiple languages (TypeScript, Go, Rust, JavaScript) and architectural patterns.

---

## 1. Directory Structure Overview

```
reference-repos/
├── figma-comments/           # Extract comments from Figma files
├── figma-context-mcp/        # MCP server for AI-powered design access
├── figma-extractor/          # TypeScript - Extract styles and SVG icons
├── figma-extractor2/         # Go - Extract design specs to Markdown
├── figma-parser/             # TypeScript - Parse tokens via Figma API
├── figma-screens-extractor/  # Node.js - Export screens as PNG/SVG
├── figmagic/                 # TypeScript - Full design system automation
└── kiwi/                     # Binary format specification (multi-language)
```

---

## 2. Detailed Repository Analysis

### 2.1 FIGMA-COMMENTS
**Purpose**: Extract and export comments from Figma files  
**Language**: JavaScript (Node.js)  
**Output Format**: Tab-separated values (TSV)

**Key Features**:
- Extracts comments with timestamps and creation metadata
- Parses hashtags from comment text into separate columns
- Generates direct prototype mode links for each comment
- Comment filtering and export capabilities

**Technical Approach**:
- Uses Figma API with personal access token authentication
- Single-pass file traversal to find comments
- Outputs structured TSV format with columns: Comment, Created, Frame, Tags, Frame Link

**Use Case**: Design review workflows, comment management, design feedback tracking

---

### 2.2 FIGMA-CONTEXT-MCP (Framelink)
**Purpose**: MCP server providing AI agents access to Figma design data  
**Language**: TypeScript  
**Framework**: Model Context Protocol SDK  
**Node Version**: >= 18.0.0

**Architecture**:
```
src/
├── bin.ts                  # CLI entry point
├── server.ts               # HTTP/stdio server setup
├── config.ts               # Configuration management
├── mcp/                    # MCP server implementation
├── extractors/
│   ├── built-in.ts         # Core extraction logic
│   ├── design-extractor.ts # Design-specific extraction
│   └── node-walker.ts      # Document tree traversal
├── transformers/           # Data transformation (layout, text, style, effects)
├── services/               # Figma API service layer
└── utils/                  # Helper utilities
```

**Key Features**:
- **Multi-protocol Support**: Supports stdio (CLI), SSE, and StreamableHTTP transports
- **Smart Simplification**: Reduces Figma API complexity for LLM consumption
- **Progressive Extraction**: Customizable extraction strategies (layout-only, content-only, visuals-only)
- **SVG Container Collapsing**: Automatically collapses SVG-heavy containers to reduce payload
- **Style Reference Extraction**: Identifies and extracts named Figma styles
- **Component Property Extraction**: Captures instance properties and component metadata

**Technical Decisions**:
- Extracts JSON representation optimized for AI consumption (not raw Figma API)
- Session management with unique session IDs for HTTP mode
- Progress notifications support for long-running operations
- Image download skipping option to reduce payload size

**Extractor Pipeline**:
```typescript
const allExtractors = [
  layoutExtractor,      // Bounding boxes, constraints, sizing
  textExtractor,        // Content and text styling
  visualsExtractor,     // Colors, strokes, effects, opacity, border-radius
  componentExtractor    // Component instances and properties
]
```

**Supported Output Types**:
- Layout properties (x, y, width, height, constraints)
- Text content and styling (font family, size, weight, color)
- Visual properties (fills, strokes, effects, opacity, border-radius)
- Component metadata and variant information

---

### 2.3 FIGMA-PARSER
**Purpose**: Parse Figma design files via REST API into design tokens  
**Language**: TypeScript  
**Package**: npm - `figma-parser`

**Architecture**:
- Axios-based HTTP client for Figma API
- Recursive tree traversal of Figma document structure
- Template-based code generation (Markup.js)
- Support for SVG optimization (SVGO)

**Token Types Supported**:
```typescript
type Token = 
  | "colors" 
  | "space" 
  | "icons" 
  | "illustrations" 
  | "fontSizes" 
  | "fonts" 
  | "fontWeights" 
  | "lineHeights" 
  | "letterSpacings" 
  | "textTransforms"
```

**Naming Convention Parser**:
```
Figma Layer Name: "color-primary"
├─ Role: "color"
├─ Name Parts: ["color", "primary"]
└─ Token Output: { primary: "rgba(...)" }

Font Token: "font-style-heading"
├─ Family: "font-family-xxx"
├─ Size: "font-style-xxx"
├─ Weight: "font-weight-xxx"
└─ Line Height: "line-height-xxx"
```

**Extraction Process**:
1. Fetch file via `/files/{fileId}` endpoint
2. Traverse document tree recursively
3. Match layer names against token naming conventions
4. Extract values (fills, dimensions, text styles)
5. Optimize SVGs with SVGO for icons/illustrations
6. Generate output via template system

**Output Formats**:
- JSON (raw token structure)
- TypeScript (typed token exports)
- Custom template support via Markup.js

---

### 2.4 FIGMA-EXTRACTOR (Shakuro)
**Purpose**: Extract style system and SVG icons from Figma  
**Language**: TypeScript  
**Package**: npm - `@shakuroinc/figma-extractor`  
**Documentation**: https://figma-extractor.vercel.app

**Configuration**:
- Requires `figma-extractor.config.js` file in project root
- Configuration-driven extraction and transformation
- Supports custom extraction rules and transformations

**Usage Pattern**:
```bash
yarn add -D @shakuroinc/figma-extractor
# Create figma-extractor.config.js
yarn figma-extract
```

**Key Capabilities**:
- Automatic style system extraction
- SVG icon batching and optimization
- Configuration-based customization
- Professional web development service backing

---

### 2.5 FIGMA-EXTRACTOR2 (Go)
**Purpose**: Extract design specifications from Figma to Markdown  
**Language**: Go  
**Installation**: `go install github.com/kataras/figma-extractor/cmd/figma-extractor@latest`

**Architecture**:
```
cmd/figma-extractor/main.go    # CLI entry point with cobra
pkg/figma/
├── client.go                  # HTTP client for Figma API
├── types.go                   # Comprehensive type definitions
└── ... 
pkg/extractor/
├── extractor.go               # Core extraction logic
└── ...
pkg/formatter/
└── markdown.go                # Markdown output generation
```

**Data Extraction Strategy**:
1. **File Key Extraction**: Parses URL to extract file ID
2. **API Authentication**: Creates token-based client
3. **File Retrieval**: Fetches complete file via Figma API
4. **Recursive Traversal**: Walks document tree extracting specifications
5. **Categorization**: Groups values by type (primary, secondary, background, text, status colors)
6. **Normalization**: Deduplicates and normalizes values to standard scales
7. **Markdown Generation**: Outputs CSS variables in markdown format

**Extracted Specifications**:
- **Colors**: Primary, secondary, background, text, status, border colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Normalized spacing scales
- **Border Radius**: All radius values
- **Shadows**: Complete shadow definitions
- **Layout**: Header height, sidebar width, content padding

**Output Format** (CSS Variables in Markdown):
```css
/* Primary Colors */
--color-primary-main: #3B82F6;
--color-primary-hover: #2563EB;

/* Typography */
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--text-base: 16px;
--font-medium: 500;

/* Spacing */
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
```

**Integration**: Specifically formatted for AI systems (Claude Sonnet 4.5, ChatGPT)

---

### 2.6 FIGMA-SCREENS-EXTRACTOR
**Purpose**: Export screens (FRAME nodes) from Figma as high-quality images  
**Language**: JavaScript (Node.js)  
**Dependencies**: axios, sharp, dotenv

**Key Workflow**:
1. Load `.env` with `FIGMA_TOKEN` and `FIGMA_FILE_ID`
2. Fetch file structure from Figma API
3. Extract all FRAME nodes (screens/artboards)
4. Filter by dimensions (optional)
5. Request image URLs via `/images/{fileId}` endpoint
6. Download and save images with unique naming

**Configuration Options**:
```javascript
const CONFIG = {
  outputDir: "./exported-projects/project-name",
  imageFormats: ["png", "svg"],  // Priority order
  includeDimensions: false,      // Append dimensions to filename
  apiDelay: 200,                 // ms between API calls
  targetDimensions: {            // Optional dimension filter
    width: 375,
    height: 812
  }
}
```

**Node Tree Traversal**:
- Recursive tree walker identifying FRAME nodes
- Filters by `type === "FRAME"`
- Extracts ID, name, dimensions from `absoluteBoundingBox`
- Supports nested frame discovery

**Rate Limiting**:
- Configurable delay between API requests (default 200ms)
- Attempts multiple formats with delays
- Respects Figma API rate limits

**Filename Generation**:
```
Input: "Login Screen"
Output: "screen-Login.png"
       "screen-Login-375x812.png"  (with dimensions)
```

**Use Case**: Design export pipelines, screen-based component generation, design documentation

---

### 2.7 FIGMAGIC
**Purpose**: Full design system automation (tokens, graphics, React components)  
**Language**: TypeScript  
**Package**: npm - `figmagic` (v4.6.0)  
**Size**: ~45kb compressed (no external dependencies)

**Architecture (Clean Architecture Pattern)**:
```
bin/
├── contracts/              # Type definitions and interfaces
│   ├── Config.ts
│   ├── Token.ts
│   ├── Element.ts
│   ├── Tokens.ts
│   ├── FigmaElement.ts
│   ├── ProcessedToken.ts
│   └── ... (20+ types)
├── entities/               # DDD-style domain logic (Config, Token)
├── controllers/            # CLI controllers
├── frameworks/             # Infrastructure (HTTP, file operations)
├── usecases/              # Feature orchestration
│   ├── createTokens.ts
│   ├── createGraphics.ts
│   ├── createElements.ts
│   └── interactors/       # Specific use case implementations
└── utils/                 # Helper utilities
```

**Three Core Syncing Modes**:

#### 1. Token Sync (Default: ON)
- Requires: Page named "Design tokens"
- Extracts from frames: Colors, Font Sizes, Spacing, Font Weights, Line Heights, Font Families, etc.
- **20+ Token Types Supported**:
  - Colors (including gradients)
  - Font Sizes, Weights, Families, Line Heights
  - Spacing, Border Widths, Letter Spacings
  - Shadows (single/multiple drop shadows)
  - Opacities, Durations, Delays
  - Easing functions, Media Queries, Z-indices, Radii

**Token Design Philosophy**:
- **Unidimensional vs. Multidimensional**: Each token stores one value (unlike Figma styles which bundle multiple properties)
- Allows flexible composition: Line height token + Font size token + Font weight token = Typography token
- Supports color themes with nested structures
- Camelized token names by default (kebab-case → camelCase)

#### 2. Graphics Sync (Default: OFF, --syncGraphics)
- Requires: Page named "Graphics"
- Export Formats: PNG, SVG
- Supports: Figma components, instances, nested frames
- Output Options: SVG only, React-wrapped SVG, graphics map object
- Scale Configuration: Adjustable output scale

#### 3. Element Sync (Default: OFF, --syncElements)
- Requires: Page named "Elements"
- Generates: React/JSX components from Figma components
- Component Structure: Flat or nested support
- Generates: React code, CSS/Styled Components, Storybook stories
- Token Binding: Automatically maps element properties to extracted tokens
- Output Formats: TSX/JSX, MJS, JS

**Configuration System** (Priority Order):
1. CLI arguments (highest)
2. Environment variables / .env file
3. figmagic.json / .figmagicrc file
4. Defaults (lowest)

**Output Organization**:
```
.figmagic/          # Raw Figma JSON dump
tokens/             # Extracted design tokens
graphics/           # Exported graphics
elements/           # Generated React components
```

**Supported Output Formats**:
- **Tokens**: TS, MJS, JS, JSON, CSS, SCSS
- **CSS**: TS, MJS, JS
- **React**: TSX, JSX, MJS, JS
- **Graphics**: SVG, PNG
- **Storybook**: TS, JS, MDX
- **Description**: MD, TXT

**Token Processing Features**:
- **Unit Conversion**: 
  - Font sizes: rem (base 16px), em, px
  - Spacing: rem, em, px
  - Border width: px, rem, em
  - Letter spacing: em, px
  - Line height: unitless (0.xx), em, px, rem
- **Color Formats**: RGBA (default) or Hex (#rrggbbaa)
- **Precision**: Configurable decimal places for unitless values
- **Font Names**: Common name or PostScript name support
- **Literal Font Families**: Full font stack with fallbacks

**Code Quality**:
- TypeScript with 97.5%+ type coverage
- Jest test suite with coverage
- Dependency cruiser analysis
- ESLint/Biome linting
- Husky pre-commit hooks
- TypeDoc documentation generation

**Template System**:
- Customizable code generation templates
- Substitution tag support (e.g., `{{NAME_STYLED}}`)
- Default templates for React, Styled Components, Storybook
- User can override with custom templates

**Advanced Features**:
- **Element Sync**: Component generation with proper structure
- **Token Binding**: Automatic mapping of hardcoded values to tokens
- **Design System Export**: Complete design system as code
- **Versioned Files**: Support for Figma version history
- **GitHub Actions Integration**: Figmagic GitHub action available
- **Figma Plugin**: Continuous Design plugin for triggering CI/CD from Figma

---

### 2.8 KIWI
**Purpose**: Schema-based binary format for efficient tree encoding  
**Language**: Multi-language (JavaScript/TypeScript, C++, Rust, Skew)  
**Inspiration**: Protocol Buffers (but simpler and more compact)

**Format Goals**:
- Efficient encoding of common values (variable-length encoding)
- Efficient compound objects (struct feature with zero overhead)
- Detectable optional field presence (advantage over Protobuf)
- Linear serialization (single-scan operations)
- Backwards and forwards compatibility
- Simple implementation (single-file C++ dependency)

**Native Types**:
```
bool, byte, int, uint, float, string
int64, uint64, T[]
```

**User-Defined Types**:
- **enum**: uint with restricted named values
- **struct**: Fixed fields always written (no new fields after creation)
- **message**: Optional fields with new field support (backwards compatible)

**Example Schema**:
```proto
enum Type {
  FLAT = 0;
  ROUND = 1;
  POINTED = 2;
}

struct Color {
  byte red;
  byte green;
  byte blue;
  byte alpha;
}

message Example {
  uint clientID = 1;
  Type type = 2;
  Color[] colors = 3;
}
```

**Use Cases**:
- Efficient Figma file format encoding/decoding
- Tree data structure serialization
- Cross-platform data exchange
- Binary protocol specification

**Live Demo**: http://evanw.github.io/kiwi/

---

## 3. Figma Data Model & Structures

### 3.1 Common Figma Node Types
```
DOCUMENT      → Root node containing canvas/pages
CANVAS        → Single page/artboard
FRAME         → Fixed-size container (main artboards)
GROUP         → Logical grouping of nodes
COMPONENT     → Reusable template for instances
INSTANCE      → Copy of a component
VECTOR        → Vector network (paths)
RECTANGLE     → Rect shape
ELLIPSE       → Circle/oval
TEXT          → Text box
SLICE         → Export region
BOOLEAN       → Boolean operation result
```

### 3.2 Paint/Fill Types
```
SOLID                → Single color
GRADIENT_LINEAR      → Linear gradient
GRADIENT_RADIAL      → Radial gradient
GRADIENT_ANGULAR     → Angular gradient
GRADIENT_DIAMOND     → Diamond gradient
IMAGE                → Bitmap image
EMOJI                → Emoji/image
```

### 3.3 Effects
```
INNER_SHADOW        → Inner shadow
DROP_SHADOW         → Drop shadow
LAYER_BLUR          → Blur effect
BACKGROUND_BLUR     → Background blur
```

### 3.4 Text Styling Properties
```
fontFamily          → Font name
fontPostScriptName  → PostScript identifier
fontWeight          → 100-900
fontSize            → Size in pixels
lineHeightPx        → Line height in pixels
lineHeightPercent   → Line height percentage
letterSpacing       → Character spacing
textAlignHorizontal → LEFT, CENTER, RIGHT, JUSTIFIED
textAlignVertical   → TOP, CENTER, BOTTOM
textCase            → UPPER, LOWER, TITLE
textDecoration      → STRIKETHROUGH, UNDERLINE
```

---

## 4. Strategies for Figma Data Extraction

### 4.1 REST API-Based Approaches (All TypeScript/Node/Go tools)

**Authentication**:
- Personal access tokens (via Figma Account Settings)
- Token header: `X-Figma-Token: <token>`

**Key Endpoints**:
- `GET /files/{file_id}` - Complete file with document tree, styles, components
- `GET /images/{file_id}?ids={node_ids}&format={fmt}` - Export images
- `GET /comments/{file_id}` - File comments with threads
- `GET /teams/{team_id}/components` - Published components
- `GET /styles/{file_id}` - Published styles metadata

**Rate Limiting Handling**:
- Implement exponential backoff
- Add configurable delays between requests
- Respect response headers (429 Too Many Requests)

### 4.2 Recursive Tree Traversal Pattern

**Universal Algorithm**:
```
function traverse(node, parentContext):
  // Process node
  processNode(node)
  
  // Process children recursively
  if node.children:
    for child in node.children:
      traverse(child, node)
```

**Applied In**:
- figma-parser: Extracts tokens by walking tree and matching naming conventions
- figma-context-mcp: Simplifies nodes while preserving hierarchy
- figmagic: Parses both tokens and components
- figma-screens-extractor: Finds FRAME nodes for export
- figma-extractor2 (Go): Categorizes colors, typography, spacing

### 4.3 Naming Convention Parsing

**Pattern**: Delimiter-based categorization
```
Layer Name: "color-primary-main"
├─ First part: "color" → determines category
├─ Remaining parts: ["primary", "main"] → nested object path
└─ Figma source (fills): Takes fill color from node

Layer Name: "space-base"
├─ Category: "space"
└─ Value source: node.absoluteBoundingBox.height
```

**Applied In**:
- figma-parser: Naming conventions determine token type
- figmagic: Frame names like "Colors", "Spacing" organize tokens
- figma-extractor2: Node names categorize color purposes

### 4.4 Design Token Generation

**Approach Comparison**:

| Tool | Token Count | Output Formats | Automation | Token Binding |
|------|-----------|-----------------|-----------|--------------|
| figmagic | 20+ types | TS/JS/JSON/CSS/SCSS | Full | Yes (to components) |
| figma-parser | 10+ types | TS/JSON/custom | Partial | Manual |
| figma-extractor2 | 8 categories | Markdown only | Full | CSS variables |
| figma-context-mcp | Implicit | JSON (simplified) | Full | Style references |

### 4.5 SVG Export & Optimization

**Tools Using SVG**:
- figmagic: Exports graphics as SVG or React components
- figma-parser: Optimizes SVG icons with SVGO
- figmagic: SVG container collapsing (payload reduction)

**Optimization**:
- SVGO library for SVG minification
- Removes comments, unused styles, default attributes
- Preserves visual integrity while reducing file size

---

## 5. Code Patterns & Architectures

### 5.1 Figmagic: Clean Architecture

**Layering**:
- **Contracts**: Type definitions (central to architecture)
- **Entities**: Domain logic (Config, Token, Element objects)
- **Controllers**: CLI command handling
- **Frameworks**: Infrastructure (file I/O, HTTP)
- **Use Cases**: Feature orchestration (createTokens, createGraphics, createElements)

**Benefits**:
- Highly testable (mocked dependencies)
- Clear separation of concerns
- Technology-agnostic core logic
- Easy to add new use cases

### 5.2 Figma-Context-MCP: Transformer Pipeline

**Data Flow**:
```
Figma API Response
    ↓
[layoutTransformer] → Simplified layout
    ↓
[textTransformer] → Extracted text & styling
    ↓
[styleTransformer] → Paint fills/strokes
    ↓
[effectsTransformer] → Simplified effects
    ↓
[componentExtractor] → Instance properties
    ↓
Simplified JSON (LLM-optimized)
```

**Strategy**:
- Each transformer handles specific domain
- Reduces API response complexity
- Optimizes for LLM token consumption
- Modular and composable

### 5.3 Figma-Extractor2 (Go): Service Layer

**Layers**:
- **Client**: HTTP communication with Figma API
- **Types**: Comprehensive type definitions
- **Extractor**: Business logic for specification extraction
- **Formatter**: Output generation (Markdown)
- **Main**: CLI orchestration

**Advantages**:
- Compiled binary (no runtime dependencies)
- Fast execution
- Type-safe with Go's strict typing
- Single portable executable

### 5.4 Figma-Parser: Simple & Modular

**Design**:
- Single class (`FigmaParser`) with axios client
- Template-based output via Markup.js
- Recursive tree traversal
- Support for multiple token types

**Extensibility**:
- Custom template system
- Token type enumeration
- Plural/singular mappings

---

## 6. Performance Considerations

### 6.1 API Rate Limiting
- **Challenge**: Figma API has rate limits
- **Solutions**:
  - Implement configurable delays (figma-screens-extractor: 200ms default)
  - Batch requests when possible
  - Cache file responses

### 6.2 Payload Optimization
- **Issue**: Large Figma files = large API responses
- **Solutions**:
  - Simplified node representation (figma-context-mcp)
  - SVG container collapsing
  - Optional image download skip
  - Selective field extraction

### 6.3 Compilation & Performance
- **Go (figma-extractor2)**: Compiled binary, fastest
- **TypeScript/Node**: Interpreted, moderate speed
- **Figmagic**: No external dependencies, lighter weight

### 6.4 Memory Usage
- **Recursive traversal**: Can be memory-intensive for large files
- **Mitigation**: Stream processing where applicable
- **Figmagic**: Processes in stages (tokens → graphics → elements)

---

## 7. Figma-to-Code Conversion Approaches

### 7.1 Token-Driven Code Generation (Figmagic)
**Strategy**:
1. Extract tokens (unidimensional values)
2. Generate React components using tokens
3. Components reference token values, not hardcoded values
4. Changes to tokens automatically update components

**Advantages**:
- Maintainable: Change tokens, update all uses
- Consistent: Single source of truth
- Scalable: Works across design system

**Limitations**:
- Requires well-structured Figma file
- Best for low-level components

### 7.2 Direct Figma-to-React (Figmagic Element Sync)
**Process**:
1. Parse Figma components from "Elements" page
2. Identify component structure and properties
3. Attempt to bind element values to tokens
4. Generate React component code
5. Generate CSS/Styled Components
6. Generate Storybook stories

**Code Quality Features**:
- Proper imports and exports
- PropTypes or TypeScript support
- Token binding (not hardcoded values)
- Customizable via templates

### 7.3 Design Spec-Based Implementation
**Approach** (figma-extractor2):
1. Extract design specifications to Markdown
2. Provide markdown to LLM (Claude, ChatGPT)
3. LLM generates code based on specs
4. Includes CSS variables for easy customization

**Advantages**:
- Flexible output (can generate any framework)
- Leverages LLM capabilities
- Easy to iterate
- Platform agnostic

---

## 8. Use Cases & Applications

### 8.1 Design System Extraction
- Figmagic: Full design system as code
- figma-context-mcp: AI-assisted design implementation
- figma-extractor2: Design specs for LLM

### 8.2 Component Library Generation
- Figmagic: React components from Figma components
- figmagic: SVG graphics with React wrappers
- Custom solutions: Template-based generation

### 8.3 Design Handoff
- figma-context-mcp: Provide design data to AI coding tools
- figma-screens-extractor: Export screens as images
- figmagic: Complete token + component export

### 8.4 Design Analysis & Auditing
- figma-extractor2: Extract and categorize all design values
- figmagic: Token extraction and analysis
- figma-comments: Comment tracking and management

### 8.5 Design Token Management
- Figmagic: Export tokens in multiple formats
- figma-parser: Custom token parsing
- figmagic: Color theme support

### 8.6 AI-Powered Design Implementation
- figma-context-mcp: MCP server for Cursor and Claude
- figma-extractor2: Markdown specs for LLM
- Design specs provide context for accurate code generation

---

## 9. Notable Technical Decisions & Trade-offs

### 9.1 Unidimensional vs. Multidimensional Tokens (Figmagic)
**Decision**: Unidimensional tokens (one value per token)
**Trade-off**: 
- Pro: Flexible composition, reusable across contexts
- Con: Requires more tokens than Figma styles
- Impact: Better for developer experience, more granular control

### 9.2 Simplified JSON for AI (figma-context-mcp)
**Decision**: Transform Figma API response before serving to LLM
**Trade-off**:
- Pro: Reduced token consumption, better AI performance
- Con: Less complete information (but optimized for purpose)
- Impact: More accurate design implementation by AI

### 9.3 Binary Format (Kiwi)
**Decision**: Use binary format instead of JSON for tree encoding
**Trade-off**:
- Pro: More efficient, smaller payload, faster parsing
- Con: Less human-readable, additional serialization layer
- Impact: Better for file storage and network transmission

### 9.4 Template-Based Code Generation (Figmagic)
**Decision**: Customizable Handlebars/Markup.js templates
**Trade-off**:
- Pro: Extensible, supports multiple frameworks
- Con: More complex than fixed output
- Impact: Can adapt to any project structure

### 9.5 Naming Convention Parsing (figma-parser)
**Decision**: Use Figma layer names to categorize tokens
**Trade-off**:
- Pro: No additional configuration needed
- Con: Requires discipline in naming (brittl)
- Impact: Simple setup but fragile to renaming

### 9.6 No External Dependencies (Figmagic)
**Decision**: Keep compiled size minimal (~45kb)
**Trade-off**:
- Pro: Fast installation, small download, no supply chain risk
- Con: More code to maintain, limited functionality
- Impact: Lightweight, portable, single executable

---

## 10. Comparison Matrix

| Feature | figmagic | figma-context-mcp | figma-extractor2 | figma-parser | figma-screens-extractor |
|---------|----------|------------------|------------------|--------------|------------------------|
| Language | TS | TS | Go | TS | JS |
| Token Extraction | ✓ (20+) | ✗ | ✓ | ✓ (10+) | ✗ |
| Component Generation | ✓ | ✗ | ✗ | ✗ | ✗ |
| Graphics Export | ✓ | ✗ | ✗ | ✓ (icons) | ✓ (screens) |
| AI Integration | Partial | ✓ (MCP) | Partial (specs) | ✗ | ✗ |
| Output Formats | 6+ | JSON | Markdown | 3+ | PNG/SVG |
| Configuration | Extensive | Minimal | CLI only | Minimal | Config object |
| Type Safety | TS | TS | Go | TS | JS |
| Compiled Binary | ✗ | ✗ | ✓ | ✗ | ✗ |
| Documentation | Excellent | Good | Good | Minimal | Good |
| Community Support | Active | Active | Moderate | Low | Low |
| Performance | Fast | Fast | Fastest | Fast | Moderate |

---

## 11. Integration Patterns

### 11.1 Workflow: Design System Creation
```
1. Prepare Figma File
   └─ Create "Design tokens" page with frames
   └─ Create "Elements" page with components
   └─ Create "Graphics" page with assets

2. Run Figmagic
   └─ Extract tokens (TS/JS/JSON/CSS)
   └─ Export graphics (SVG/PNG)
   └─ Generate React components

3. Use in Project
   └─ Import tokens and components
   └─ Build applications
   └─ Update design system in Figma
   └─ Re-export to sync changes
```

### 11.2 Workflow: AI-Assisted Implementation
```
1. Design in Figma
2. Connect figma-context-mcp to Cursor/Claude
3. Share Figma URL or frame link
4. MCP extracts simplified design data
5. AI generates implementation code
6. Developer refines if needed
```

### 11.3 Workflow: Design Spec Generation
```
1. Design in Figma
2. Run figma-extractor2
3. Extract design specs to Markdown
4. Provide Markdown to Claude/ChatGPT
5. AI generates CSS variables and components
6. Integrate into project
```

---

## 12. Key Takeaways for Development

### 12.1 When to Use Each Tool

**Use Figmagic if**:
- Building a design system
- Want component generation
- Need support for multiple token types
- Require tight Figma ↔ Code synchronization
- Want out-of-the-box solution

**Use figma-context-mcp if**:
- Integrating with AI coding tools (Cursor, Claude)
- Need simplified data for LLM consumption
- Want MCP protocol support
- Building AI-powered workflows

**Use figma-extractor2 if**:
- Need standalone compiled binary
- Want design specs for AI implementation
- Prefer Go tooling
- Need CSS variable output format

**Use figma-parser if**:
- Need simple token extraction
- Want programmatic token access
- Prefer template-based customization
- Building custom tooling

**Use figma-screens-extractor if**:
- Need screen/artboard exports as images
- Building design documentation
- Creating design previews
- Generating design assets

### 12.2 Common Architecture Patterns

1. **Recursive Tree Traversal**: Universal for Figma document processing
2. **Naming Convention Parsing**: Flexible way to categorize content
3. **Transformer Pipeline**: Clean way to process and simplify data
4. **Service Layer**: Abstraction over API communication
5. **Template-Based Generation**: Extensible code generation

### 12.3 Data Flow Best Practices

1. **Fetch Once, Transform Multiple Times**: Get Figma data once, apply multiple extractors
2. **Simplify for Consumption**: Reduce complexity for downstream consumers (AI, UI, etc.)
3. **Cache When Possible**: Store API responses to avoid rate limiting
4. **Batch Operations**: Group related API calls
5. **Progressive Enhancement**: Basic extraction first, add features incrementally

### 12.4 Performance Optimization

1. **Implement Rate Limiting**: Respect Figma API limits (configurable delays)
2. **Reduce Payload**: Skip unnecessary data (optional images, etc.)
3. **Compile When Possible**: Use compiled languages (Go) for performance
4. **Stream Large Files**: Process large Figma files incrementally
5. **Cache Aggressively**: Store results locally

---

## 13. Documentation & Resources

### Official Resources
- Figma REST API: https://www.figma.com/developers/api
- Model Context Protocol: https://modelcontextprotocol.io/
- Kiwi Format Spec: http://evanw.github.io/kiwi/

### Repository Documentation
- Figmagic Docs: https://docs.figmagic.com
- Framelink MCP: https://www.framelink.ai
- figma-extractor (Shakuro): https://figma-extractor.vercel.app

### Related Technologies
- Design Tokens: https://www.designtokens.org/
- Token Studio: Design token management
- TypeScript: Type-safe development
- Go: Compiled language performance

---

## 14. Conclusion

The `reference-repos` folder provides a rich ecosystem of tools demonstrating complementary approaches to Figma data extraction and conversion:

1. **Multiple Languages**: TypeScript, Go, JavaScript, Rust - choose based on project needs
2. **Varied Purposes**: Comments, tokens, components, specs, screens, binary formats
3. **Different Architectures**: Simple scripts to clean architecture patterns
4. **Integration Options**: REST API, MCP protocol, CLI, library imports
5. **AI Integration**: Deep integration with modern AI tools for design-to-code workflows

These projects serve as excellent references for:
- Understanding Figma file structure and API
- Learning extraction and transformation patterns
- Implementing design token systems
- Building design-to-code pipelines
- Creating AI-powered design workflows

The most effective solutions often combine approaches: use figmagic for tokens and components, integrate figma-context-mcp with AI tools, and leverage figma-extractor2 for design specifications. The modular nature of these projects makes them easily composable into custom solutions.

