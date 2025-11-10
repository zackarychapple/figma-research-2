# Reference Repositories - Complete Documentation Index

## Overview

This documentation provides comprehensive analysis of 8 reference repositories demonstrating various strategies for Figma data extraction, parsing, and conversion to code.

**Total Documentation**: 3 detailed reports + this index
**Repositories Analyzed**: 8 open-source projects
**Languages Covered**: TypeScript, Go, JavaScript, Rust
**Time Period**: Current (as of Nov 2024)

---

## Documentation Files

### 1. `REFERENCE_REPOS_SUMMARY.md`
**Purpose**: Quick reference guide  
**Length**: ~250 lines  
**Best for**: 
- Quick overview of each tool
- Decision matrix for choosing tools
- Common workflows
- Key takeaways

**Contents**:
- Repository overview (1-3 paragraphs each)
- Key data extraction strategies (5 strategies)
- Figma data model reference
- Architecture patterns
- Performance comparison table
- Tool selection guide

**Start here if**: You want a quick overview or need to decide which tool to use.

---

### 2. `FIGMA_REFERENCE_ANALYSIS.md`
**Purpose**: Comprehensive detailed analysis  
**Length**: ~1000 lines  
**Best for**:
- Understanding each tool in depth
- Learning implementation details
- Comparing approaches
- Research and reference

**Contents**:
- Executive summary
- Directory structure
- 8 Detailed repository analyses (80-100 lines each):
  - figma-comments
  - figma-context-mcp (Framelink)
  - figma-extractor (Shakuro)
  - figma-extractor2 (Go)
  - figma-parser
  - figma-screens-extractor
  - figmagic (Full analysis)
  - kiwi (Binary format)
- Figma data model & structures (section 3)
- 5 Data extraction strategies (section 4)
- Code patterns & architectures (section 5)
- Performance considerations (section 6)
- Figma-to-code conversion approaches (section 7)
- Use cases & applications (section 8)
- Technical decisions & trade-offs (section 9)
- Comprehensive comparison matrix (section 10)
- Integration patterns (section 11)
- Key takeaways (section 12)
- Conclusion (section 14)

**Start here if**: You need deep understanding or are implementing a solution.

---

### 3. `REFERENCE_CODE_PATTERNS.md`
**Purpose**: Code examples and patterns  
**Length**: ~500 lines  
**Best for**:
- Learning implementation patterns
- Code examples you can adapt
- Understanding specific techniques
- Building custom solutions

**Contents**:
- Pattern 1: REST API + Recursive Tree Traversal
- Pattern 2: Naming Convention Parsing
- Pattern 3: Transformer Pipeline
- Pattern 4: Service Layer Architecture
- Pattern 5: Design Token Generation
- Pattern 6: SVG Container Collapsing
- Pattern 7: Rate Limiting & Delay Handling
- Pattern 8: Clean Architecture
- Pattern 9: Template-Based Code Generation
- Pattern 10: Caching & Performance

Each pattern includes:
- Generic implementation
- Real-world application from reference repos
- Use cases and benefits

**Start here if**: You need code examples or want to implement a pattern.

---

## Quick Navigation

### By Use Case

**I want to extract design tokens**
1. Read: REFERENCE_REPOS_SUMMARY.md → "Choosing a Tool" section
2. Choose between: figmagic, figma-parser, figma-extractor2
3. Read: FIGMA_REFERENCE_ANALYSIS.md → Section 2.7 (figmagic) or 2.3 (figma-parser)
4. Reference: REFERENCE_CODE_PATTERNS.md → Pattern 2 (naming conventions) or 5 (tokens)

**I want to use Figma with AI tools**
1. Read: REFERENCE_REPOS_SUMMARY.md → figma-context-mcp section
2. Read: FIGMA_REFERENCE_ANALYSIS.md → Section 2.2 (figma-context-mcp)
3. Reference: REFERENCE_CODE_PATTERNS.md → Pattern 3 (transformers) or 6 (collapsing)

**I want to generate React components**
1. Read: REFERENCE_REPOS_SUMMARY.md → Tool selection section
2. Choose: figmagic (best option)
3. Read: FIGMA_REFERENCE_ANALYSIS.md → Section 2.7 (figmagic - full analysis)
4. Reference: REFERENCE_CODE_PATTERNS.md → Pattern 8 (architecture) or 9 (templates)

**I want to export design specifications**
1. Read: REFERENCE_REPOS_SUMMARY.md → figma-extractor2 section
2. Read: FIGMA_REFERENCE_ANALYSIS.md → Section 2.5 (figma-extractor2)
3. Reference: REFERENCE_CODE_PATTERNS.md → Pattern 4 (service layer)

**I want to export screens/images**
1. Read: REFERENCE_REPOS_SUMMARY.md → figma-screens-extractor section
2. Read: FIGMA_REFERENCE_ANALYSIS.md → Section 2.6 (figma-screens-extractor)
3. Reference: REFERENCE_CODE_PATTERNS.md → Pattern 7 (rate limiting)

**I want to understand Figma file structure**
1. Read: FIGMA_REFERENCE_ANALYSIS.md → Section 3 (Figma Data Model)
2. Reference: REFERENCE_CODE_PATTERNS.md → Pattern 1 (tree traversal)

---

### By Technology

**TypeScript/Node.js Development**
- figmagic (best for complete solution)
- figma-context-mcp (for AI integration)
- figma-parser (lightweight token extraction)
- figma-screens-extractor (for image export)

**Go Development**
- figma-extractor2 (compiled binary, fast)

**Multi-language**
- kiwi (binary format specification)

**Reference**: REFERENCE_REPOS_SUMMARY.md → comparison table

---

### By Architecture Pattern

**Clean Architecture**
- figmagic
- See: FIGMA_REFERENCE_ANALYSIS.md → Section 5.1
- Code: REFERENCE_CODE_PATTERNS.md → Pattern 8

**Transformer Pipeline**
- figma-context-mcp
- See: FIGMA_REFERENCE_ANALYSIS.md → Section 5.2
- Code: REFERENCE_CODE_PATTERNS.md → Pattern 3

**Service Layer**
- figma-extractor2 (Go)
- See: FIGMA_REFERENCE_ANALYSIS.md → Section 5.3
- Code: REFERENCE_CODE_PATTERNS.md → Pattern 4

**Simple & Modular**
- figma-parser
- See: FIGMA_REFERENCE_ANALYSIS.md → Section 5.4

---

## Key Concepts

### Design Tokens
Atomic design values (colors, spacing, typography, etc.) that form the foundation of a design system.

**Token Types Supported** (across tools):
- Colors (20+ variations including gradients)
- Spacing (margins, padding, gaps)
- Typography (font family, size, weight, line height)
- Shadows (drop, inner)
- Border radius
- Opacity
- Effects (blur, shadows)
- Z-index, durations, delays, easing functions

See: FIGMA_REFERENCE_ANALYSIS.md → Section 3 for complete reference

### Unidimensional vs Multidimensional Tokens
**Unidimensional**: Each token has ONE value (figmagic approach)
- Pro: Flexible composition
- Con: More tokens total
- Use: When you need granular control

**Multidimensional**: One token has multiple related values (Figma Styles)
- Pro: Fewer tokens
- Con: Less flexible
- Use: When bundling related properties

See: FIGMA_REFERENCE_ANALYSIS.md → Section 9.1

### Recursive Tree Traversal
Universal pattern for processing Figma documents:
1. Start at root node
2. Process each node
3. Recursively process children
4. Accumulate results

See: REFERENCE_CODE_PATTERNS.md → Pattern 1

### Naming Convention Parsing
Using layer names to categorize design elements:
```
"color-primary" → category: "color", name: "primary"
"space-base" → category: "space", name: "base"
"font-size-lg" → category: "font-size", name: "lg"
```

See: REFERENCE_CODE_PATTERNS.md → Pattern 2

---

## Figma API Reference

### Key Endpoints Used
- `GET /files/{file_id}` - Complete file data
- `GET /images/{file_id}?ids={node_ids}&format={fmt}` - Export images
- `GET /comments/{file_id}` - File comments
- `GET /teams/{team_id}/components` - Published components
- `GET /styles/{file_id}` - Published styles

### Authentication
- Personal access tokens via `X-Figma-Token` header
- Generate tokens in Figma Account Settings

### Node Types
DOCUMENT, CANVAS, FRAME, GROUP, COMPONENT, INSTANCE, VECTOR, RECTANGLE, ELLIPSE, TEXT, SLICE, BOOLEAN

### Paint/Fill Types
SOLID, GRADIENT_LINEAR, GRADIENT_RADIAL, GRADIENT_ANGULAR, GRADIENT_DIAMOND, IMAGE, EMOJI

See: FIGMA_REFERENCE_ANALYSIS.md → Section 3 for complete reference

---

## Common Workflows

### Workflow 1: Design System Creation
```
Figma File → figmagic → Tokens (TS/JSON/CSS) + React Components + Graphics
```
See: FIGMA_REFERENCE_ANALYSIS.md → Section 11.1

### Workflow 2: AI-Assisted Implementation
```
Figma → figma-context-mcp (MCP) → Cursor/Claude → Generated Code
```
See: FIGMA_REFERENCE_ANALYSIS.md → Section 11.2

### Workflow 3: Design Spec Export
```
Figma → figma-extractor2 → Markdown (CSS vars) → LLM (Claude/ChatGPT) → Code
```
See: FIGMA_REFERENCE_ANALYSIS.md → Section 11.3

---

## Performance Optimization Tips

### Rate Limiting
- Default: 200ms delay between requests (figma-screens-extractor)
- Implement exponential backoff
- Cache responses locally

See: REFERENCE_CODE_PATTERNS.md → Pattern 7

### Payload Reduction
- SVG container collapsing (reduces JSON size)
- Skip optional images download
- Selective field extraction

See: REFERENCE_CODE_PATTERNS.md → Pattern 6

### Execution Speed
- Use compiled binary (Go) for fastest execution
- Cache Figma API responses
- Process in stages (tokens → graphics → components)

See: FIGMA_REFERENCE_ANALYSIS.md → Section 6

---

## Decision Trees

### Choosing an Extraction Tool

```
START: What do you need to extract?

├─ Design tokens
│  ├─ With component generation? → figmagic
│  └─ Token only? → figma-parser
│
├─ Design specifications (for AI)
│  ├─ Want compiled binary? → figma-extractor2 (Go)
│  └─ Want Node.js? → figma-context-mcp
│
├─ Screen/image exports
│  └─ figma-screens-extractor
│
├─ Comments/feedback
│  └─ figma-comments
│
└─ Binary format reference
   └─ kiwi
```

---

## Tools Comparison Summary

| Tool | Token Types | Components | Output Formats | Architecture |
|------|------------|-----------|-----------------|--------------|
| figmagic | 20+ | ✓ | 6+ | Clean |
| figma-context-mcp | Implicit | ✗ | JSON | Transformers |
| figma-extractor2 | 8 | ✗ | Markdown | Service |
| figma-parser | 10+ | ✗ | 3+ | Modular |
| figma-screens-extractor | N/A | ✗ | PNG/SVG | Simple |
| figma-comments | N/A | N/A | TSV | Script |
| figma-extractor | 8+ | ✗ | Configurable | Config-driven |
| kiwi | N/A | N/A | Binary | Format spec |

See: FIGMA_REFERENCE_ANALYSIS.md → Section 10 for detailed matrix

---

## Resources & Links

### Official Documentation
- Figma REST API: https://www.figma.com/developers/api
- Model Context Protocol: https://modelcontextprotocol.io/
- Design Tokens: https://www.designtokens.org/

### Tool Documentation
- Figmagic Docs: https://docs.figmagic.com
- Framelink MCP: https://www.framelink.ai
- figma-extractor: https://figma-extractor.vercel.app
- Kiwi: http://evanw.github.io/kiwi/

### Related Projects
- Figmagic GitHub: https://github.com/mikaelvesavuori/figmagic
- figma-context-mcp: https://github.com/GLips/Figma-Context-MCP
- figma-extractor2: https://github.com/kataras/figma-extractor

---

## How to Use This Documentation

### For New Users
1. Start with: REFERENCE_REPOS_SUMMARY.md
2. Read the tool that matches your needs
3. Review the decision trees above
4. Look at code examples in REFERENCE_CODE_PATTERNS.md

### For Implementation
1. Choose your tool using the decision trees
2. Read the detailed section in FIGMA_REFERENCE_ANALYSIS.md
3. Reference code patterns in REFERENCE_CODE_PATTERNS.md
4. Implement and test

### For Deep Understanding
1. Read entire FIGMA_REFERENCE_ANALYSIS.md
2. Study code patterns in REFERENCE_CODE_PATTERNS.md
3. Review each repository directly
4. Understand trade-offs in Section 9

### For Custom Solutions
1. Identify which patterns you need (REFERENCE_CODE_PATTERNS.md)
2. Combine multiple tools' approaches
3. Reference Figma API (Section 3 of main analysis)
4. Implement hybrid solution

---

## Document Statistics

| Document | Lines | Words | Sections | Code Examples |
|----------|-------|-------|----------|---|
| REFERENCE_REPOS_SUMMARY.md | 250 | ~2,500 | 20+ | 15+ |
| FIGMA_REFERENCE_ANALYSIS.md | 1000 | ~12,000 | 15 | 25+ |
| REFERENCE_CODE_PATTERNS.md | 500 | ~5,000 | 10 | 35+ |
| **Total** | **1,750** | **~19,500** | **45+** | **75+** |

---

## Feedback & Updates

This documentation is based on analysis of reference repositories as of November 2024. For latest information:

1. Check individual repository GitHub pages for updates
2. Review Figma API documentation for new endpoints
3. Check for new tool releases

---

## Next Steps

1. **Choose your tool**: Use decision trees to find the best fit
2. **Read the documentation**: Start with summary, move to detailed analysis
3. **Study code patterns**: Understand how to implement
4. **Explore repositories**: Read source code directly
5. **Implement**: Build your solution or adapt existing tools

---

**Documentation compiled**: November 6, 2024  
**Reference repositories**: 8  
**Total analysis depth**: ~19,500 words  
**Code examples**: 75+

