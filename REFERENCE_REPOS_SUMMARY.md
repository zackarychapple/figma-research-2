# Reference Repositories - Quick Summary

## 8 Repositories Analyzed

### 1. figma-comments (JavaScript)
- **Purpose**: Extract comments from Figma files to TSV format
- **Output**: Tab-separated values with hashtag parsing
- **Use Case**: Design review tracking, feedback management

### 2. figma-context-mcp (TypeScript)
- **Purpose**: MCP server for AI access to Figma design data
- **Framework**: Model Context Protocol (SDK)
- **Key Feature**: Simplifies Figma API for LLM consumption
- **Transports**: Stdio, SSE, StreamableHTTP
- **Use Case**: AI-powered design-to-code (Cursor, Claude integration)

### 3. figma-extractor (TypeScript) - Shakuro
- **Purpose**: Extract style system and SVG icons from Figma
- **Package**: `@shakuroinc/figma-extractor`
- **Configuration**: Config file-driven customization
- **Use Case**: Design system extraction with professional backing

### 4. figma-extractor2 (Go)
- **Purpose**: Extract design specs to Markdown with CSS variables
- **Executable**: Compiled Go binary
- **Output Format**: Markdown with CSS variables
- **AI Integration**: Formatted for Claude/ChatGPT
- **Use Case**: Design specification export for AI implementation

### 5. figma-parser (TypeScript)
- **Purpose**: Parse Figma design files to design tokens
- **Package**: npm - `figma-parser`
- **Token Types**: 10+ types (colors, spacing, fonts, icons, etc.)
- **Output Formats**: JSON, TypeScript, custom templates
- **Approach**: Naming convention-based extraction

### 6. figma-screens-extractor (JavaScript/Node)
- **Purpose**: Export screens (FRAME nodes) as PNG/SVG images
- **Key Features**: Dimension filtering, rate limiting, unique naming
- **Config**: Simple configuration object
- **Use Case**: Design asset export, documentation

### 7. figmagic (TypeScript)
- **Purpose**: Full design system automation
- **Version**: 4.6.0, ~45kb compressed
- **Features**: 3 core syncing modes (tokens, graphics, elements)
- **Architecture**: Clean Architecture (contracts, entities, usecases)
- **Token Types**: 20+ types with unit conversion
- **Output**: TS/JS/JSON/CSS/SCSS tokens, React components, Storybook
- **Special**: No external dependencies, ~97.5% type coverage
- **Use Case**: Complete design-to-code system

### 8. kiwi (Multi-language: JS/TS, C++, Rust, Skew)
- **Purpose**: Schema-based binary format for tree encoding
- **Inspiration**: Protocol Buffers (simpler, more compact)
- **Types**: Enums, structs, messages
- **Features**: Variable-length encoding, backwards compatible
- **Use Case**: Efficient Figma file format specification

---

## Key Data Extraction Strategies

### Strategy 1: REST API + Recursive Traversal
- Fetch via `/files/{file_id}` endpoint
- Recursively walk document tree
- Extract specific properties based on node type
- **Used By**: All tools

### Strategy 2: Naming Convention Parsing
- Parse Figma layer names (e.g., "color-primary")
- First part = category, remaining = nested path
- Source values from node properties (fills, text styles, dimensions)
- **Used By**: figma-parser, figmagic

### Strategy 3: Transformer Pipeline
- Load Figma API response
- Apply series of transformers (layout, text, visuals, components)
- Simplify for specific consumption (LLM, UI, etc.)
- **Used By**: figma-context-mcp

### Strategy 4: SVG Container Collapsing
- Detect containers with only SVG-eligible children
- Collapse to IMAGE-SVG nodes to reduce payload
- Preserves visual integrity, reduces complexity
- **Used By**: figma-context-mcp, figmagic

### Strategy 5: Design Spec Generation
- Extract all design values (colors, typography, spacing, etc.)
- Categorize into design system sections
- Generate Markdown with CSS variables
- For LLM input or design documentation
- **Used By**: figma-extractor2

---

## Figma Data Model Quick Reference

### Node Types
```
DOCUMENT, CANVAS, FRAME, GROUP, COMPONENT, INSTANCE
VECTOR, RECTANGLE, ELLIPSE, TEXT, SLICE, BOOLEAN
```

### Paint/Fill Types
```
SOLID, GRADIENT_LINEAR, GRADIENT_RADIAL, GRADIENT_ANGULAR
GRADIENT_DIAMOND, IMAGE, EMOJI
```

### Text Styling
```
fontFamily, fontPostScriptName, fontWeight, fontSize
lineHeightPx, lineHeightPercent, letterSpacing
textAlignHorizontal, textAlignVertical
textCase, textDecoration
```

### Effects
```
INNER_SHADOW, DROP_SHADOW, LAYER_BLUR, BACKGROUND_BLUR
```

---

## Architecture Patterns

### Figmagic: Clean Architecture
- Contracts (types) → Entities → Controllers → Frameworks → Usecases
- Benefits: Testable, modular, extensible

### figma-context-mcp: Transformer Pipeline
- API Response → [Transformers] → Simplified JSON
- Each transformer handles specific domain (layout, text, visuals)

### figma-extractor2: Service Layer
- Client (HTTP) → Types → Extractor (logic) → Formatter → Main (CLI)
- Compiled Go binary, fast execution

### figmagic-parser: Simple & Modular
- Single FigmaParser class with axios client
- Template-based output generation

---

## Performance Considerations

| Aspect | Challenge | Solution |
|--------|-----------|----------|
| Rate Limiting | API limits | Configurable delays, batch requests |
| Payload Size | Large files | Simplified nodes, SVG collapsing, selective extraction |
| Execution Speed | Interpreted code | Compile to binary (Go) |
| Memory Usage | Large traversals | Stream processing, staged execution |

---

## Choosing a Tool

| Scenario | Tool | Why |
|----------|------|-----|
| Full design system automation | figmagic | Complete solution, tokens + components + graphics |
| AI-powered design-to-code | figma-context-mcp | MCP protocol, LLM optimization |
| Design specs for AI | figma-extractor2 | Markdown + CSS vars, compiled binary |
| Simple token extraction | figma-parser | Lightweight, template-based |
| Screen/image export | figma-screens-extractor | Focused, rate-limited |
| Comments/feedback | figma-comments | Specific purpose, TSV output |
| Binary format reference | kiwi | Format specification, multi-language |

---

## Common Workflows

### Workflow 1: Design System Creation
```
Figma File → figmagic → Tokens (TS/JSON/CSS) + React Components + Graphics
```

### Workflow 2: AI-Assisted Implementation
```
Figma URL → figma-context-mcp (MCP) → Cursor/Claude → Code Generation
```

### Workflow 3: Design Spec Export
```
Figma File → figma-extractor2 → Markdown (CSS vars) → LLM → Code
```

### Workflow 4: Token Management
```
Figma File → figma-parser → TypeScript Tokens → React Application
```

---

## Key Takeaways

1. **Multiple Approaches**: Choose based on specific needs (tokens, components, specs, etc.)
2. **REST API is Foundation**: All tools use Figma REST API with personal tokens
3. **Recursive Traversal**: Universal pattern for document tree processing
4. **Naming Conventions**: Flexible way to categorize design elements
5. **Token Design**: Unidimensional tokens more flexible than Figma styles
6. **AI Integration**: Separate tools for AI-powered workflows (MCP, specs)
7. **Performance**: Go binary fastest, Node.js fast enough for most use cases
8. **Extensibility**: Template-based generation allows customization

---

## Resources

- **Figma REST API**: https://www.figma.com/developers/api
- **Model Context Protocol**: https://modelcontextprotocol.io/
- **Figmagic Docs**: https://docs.figmagic.com
- **Framelink MCP**: https://www.framelink.ai
- **Kiwi Binary Format**: http://evanw.github.io/kiwi/
- **Design Tokens Spec**: https://www.designtokens.org/

---

## Files Location

All reference repositories are located in:
```
/Users/zackarychapple/code/figma-research/reference-repos/
```

Detailed analysis saved in:
```
/Users/zackarychapple/code/figma-research/FIGMA_REFERENCE_ANALYSIS.md
```
