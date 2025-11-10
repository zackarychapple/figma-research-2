# Figma Data Extraction - Code Patterns & Examples

## Pattern 1: REST API + Recursive Tree Traversal

### Base Pattern (Used by all tools)
```typescript
async function extractFromFigma(fileId: string, token: string) {
  // 1. Create authenticated client
  const client = axios.create({
    baseURL: 'https://api.figma.com/v1/',
    headers: { 'X-Figma-Token': token }
  });
  
  // 2. Fetch file
  const response = await client.get(`files/${fileId}`);
  const document = response.data.document;
  
  // 3. Traverse recursively
  const results = {};
  traverse(document.children, results);
  
  return results;
}

function traverse(nodes, results, parent = null) {
  for (const node of nodes) {
    // Process node
    processNode(node, results, parent);
    
    // Process children
    if (node.children) {
      traverse(node.children, results, node);
    }
  }
}

function processNode(node, results, parent) {
  // Implement specific extraction logic
  // Examples:
  // - Extract colors from fills
  // - Extract text from TEXT nodes
  // - Extract icons from VECTOR nodes
  // - Extract layout from FRAME nodes
}
```

### Applied in figma-parser
```typescript
class FigmaParser {
  private parseTree = async (
    pages: ReadonlyArray<Figma.Node>, 
    parentName: string
  ): Promise<void> => {
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const nameParts = page.name.split("-");

      // Traverse children
      if (page["children"]) {
        await this.parseTree(page["children"], nameParts[0]);
      }

      const layer = page["children"]?.[0] || page;
      const role = nameParts[0];

      // Extract by category
      if (role === "color" && layer["fills"]) {
        const fill = layer["fills"][0];
        const value = fill.type === "SOLID" 
          ? rgbaToStr(fill.color, fill.opacity || 1) 
          : gradientToStr(fill.gradientStops);
        
        if (value) {
          this.output.colors[nameParts.slice(1).join("")] = value;
        }
      }
    }
  }
}
```

---

## Pattern 2: Naming Convention Parsing

### Pattern
```typescript
function parseLayerName(name: string) {
  const parts = name.split("-");
  return {
    category: parts[0],        // "color", "space", "font", etc.
    path: parts.slice(1),      // ["primary", "main"] for nested access
    fullName: name
  };
}

function extractTokenByCategory(node, parsed) {
  switch (parsed.category) {
    case "color":
      // Extract from node.fills[0].color
      break;
    case "space":
      // Extract from node.absoluteBoundingBox.height
      break;
    case "font":
      // Extract from node.style properties
      break;
    // ... etc
  }
}
```

### Applied in figmagic
```typescript
// Frame names organize tokens:
// "Design tokens" page contains:
//   - "Colors" frame → color tokens
//   - "Spacing" frame → spacing tokens  
//   - "Font Sizes" frame → font size tokens
//   - "Font Weights" frame → font weight tokens
//   - "Line Heights" frame → line height tokens

// Each frame contains items:
// color-primary, color-secondary, color-accent
// Space is extracted from item.absoluteBoundingBox.height
// Text styles from item.style properties
```

---

## Pattern 3: Transformer Pipeline

### Pattern
```typescript
interface Transformer {
  (node: FigmaNode, result: SimplifiedNode, context: Context): void;
}

async function transformFigmaData(
  apiResponse: FigmaFileResponse
): Promise<SimplifiedData> {
  const extractors: Transformer[] = [
    layoutExtractor,
    textExtractor,
    visualsExtractor,
    componentExtractor
  ];

  const document = apiResponse.document;
  const simplified = {};
  
  function processNode(node, parent) {
    const result = { id: node.id, type: node.type };
    
    // Apply each transformer
    for (const transformer of extractors) {
      transformer(node, result, { parent });
    }
    
    simplified[node.id] = result;
    
    // Process children
    if (node.children) {
      node.children.forEach(child => processNode(child, node));
    }
  }
  
  document.children.forEach(child => processNode(child, null));
  return simplified;
}
```

### Applied in figma-context-mcp
```typescript
// Each transformer handles specific domain
export const layoutExtractor: ExtractorFn = (node, result, context) => {
  const layout = buildSimplifiedLayout(node, context.parent);
  if (Object.keys(layout).length > 1) {
    result.layout = findOrCreateVar(context.globalVars, layout, "layout");
  }
};

export const textExtractor: ExtractorFn = (node, result, context) => {
  if (isTextNode(node)) {
    result.text = extractNodeText(node);
  }
  if (hasTextStyle(node)) {
    const textStyle = extractTextStyle(node);
    result.textStyle = findOrCreateVar(
      context.globalVars, 
      textStyle, 
      "style"
    );
  }
};

export const visualsExtractor: ExtractorFn = (node, result, context) => {
  // Extract colors, strokes, effects, opacity, border radius
  if (node.fills?.length) {
    const fills = node.fills.map(fill => parsePaint(fill));
    result.fills = findOrCreateVar(context.globalVars, fills, "fill");
  }
  // ... etc
};

// Apply in sequence
const allExtractors = [
  layoutExtractor,
  textExtractor,
  visualsExtractor,
  componentExtractor
];
```

---

## Pattern 4: Service Layer Architecture

### Pattern
```typescript
// Client layer - API communication
class FigmaClient {
  constructor(private token: string) {}
  
  async getFile(fileId: string): Promise<FileResponse> {
    const response = await fetch(
      `https://api.figma.com/v1/files/${fileId}`,
      { headers: { 'X-Figma-Token': this.token } }
    );
    return response.json();
  }
}

// Extractor layer - Business logic
class DesignExtractor {
  constructor(private client: FigmaClient) {}
  
  async extract(fileId: string): Promise<Specifications> {
    const file = await this.client.getFile(fileId);
    return this.extractSpecs(file);
  }
  
  private extractSpecs(file: FileResponse): Specifications {
    const specs = new Specifications();
    this.traverse(file.document.children, specs);
    return specs;
  }
}

// Formatter layer - Output generation
class MarkdownFormatter {
  format(specs: Specifications): string {
    return `# Design System\n\n${this.formatColors(specs)}...`;
  }
}

// Main layer - Orchestration
async function main() {
  const client = new FigmaClient(token);
  const extractor = new DesignExtractor(client);
  const formatter = new MarkdownFormatter();
  
  const specs = await extractor.extract(fileId);
  const markdown = formatter.format(specs);
  
  fs.writeFileSync('specs.md', markdown);
}
```

### Applied in figma-extractor2 (Go)
```go
// Client
type Client struct {
  baseURL string
  token   string
}

func (c *Client) GetFile(fileKey string) (*FileResponse, error) {
  // HTTP GET to Figma API
}

// Extractor
type Extractor struct {
  client *Client
}

func (e *Extractor) Extract(file *FileResponse) *Specifications {
  // Traverse and extract
}

// Formatter
type MarkdownFormatter struct{}

func (f *MarkdownFormatter) ToMarkdown(specs *Specifications) string {
  // Generate markdown output
}

// Main
func main() {
  client := NewClient(token)
  extractor := NewExtractor(client)
  formatter := NewMarkdownFormatter()
  
  file, _ := client.GetFile(fileKey)
  specs := extractor.Extract(file)
  markdown := formatter.ToMarkdown(specs)
  
  os.WriteFile("specs.md", markdown, 0644)
}
```

---

## Pattern 5: Design Token Generation

### Unidimensional Token Approach (figmagic)
```typescript
interface Token {
  name: string;
  category: "color" | "spacing" | "font-size" | "font-weight" | ...;
  value: string | number | object;
}

// Instead of Figma style (multidimensional):
// Button Text Style = Font (Inter), Size (16px), Weight (600), Color (#000)

// Use unidimensional tokens:
const tokens = {
  colors: {
    textPrimary: "#000000"
  },
  fontSizes: {
    base: "16px"
  },
  fontWeights: {
    semibold: "600"
  },
  fontFamilies: {
    primary: "Inter"
  }
};

// Compose in components:
const buttonTextStyle = {
  fontFamily: tokens.fontFamilies.primary,
  fontSize: tokens.fontSizes.base,
  fontWeight: tokens.fontWeights.semibold,
  color: tokens.colors.textPrimary
};
```

### Token Binding Pattern
```typescript
// In React component, reference tokens not hardcoded values:
const Button = styled.button`
  font-family: ${tokens.fontFamilies.primary};
  font-size: ${tokens.fontSizes.base};
  font-weight: ${tokens.fontWeights.semibold};
  color: ${tokens.colors.textPrimary};
`;

// When design system changes, only update token values
// All components automatically update
```

### Multi-format Token Output (figmagic)
```typescript
// TypeScript
export const colors = {
  primary: 'rgba(59, 130, 246, 1)',
  secondary: 'rgba(99, 102, 241, 1)'
};

// JavaScript
const colors = {
  primary: 'rgba(59, 130, 246, 1)',
  secondary: 'rgba(99, 102, 241, 1)'
};

// JSON
{ "colors": { "primary": "rgba(59, 130, 246, 1)" } }

// CSS
:root {
  --color-primary: rgba(59, 130, 246, 1);
  --color-secondary: rgba(99, 102, 241, 1);
}

// SCSS
$color-primary: rgba(59, 130, 246, 1);
$color-secondary: rgba(99, 102, 241, 1);
```

---

## Pattern 6: SVG Container Collapsing

### Pattern
```typescript
const SVG_ELIGIBLE_TYPES = new Set([
  "IMAGE-SVG",
  "STAR",
  "LINE",
  "ELLIPSE",
  "REGULAR_POLYGON",
  "RECTANGLE"
]);

function collapseSvgContainers(
  node: FigmaNode,
  result: SimplifiedNode,
  children: SimplifiedNode[]
): SimplifiedNode[] {
  const allChildrenAreSvgEligible = children.every(child =>
    SVG_ELIGIBLE_TYPES.has(child.type)
  );

  if (
    (node.type === "FRAME" || node.type === "GROUP" || node.type === "INSTANCE") &&
    allChildrenAreSvgEligible
  ) {
    // Collapse to IMAGE-SVG and omit children
    result.type = "IMAGE-SVG";
    return [];  // No children included
  }

  // Include all children normally
  return children;
}
```

**Benefits**:
- Reduces JSON payload size significantly
- Speeds up LLM processing
- Preserves visual structure
- Automatic optimization

---

## Pattern 7: Rate Limiting & Delay Handling

### Pattern
```typescript
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRateLimit<T>(
  fn: () => Promise<T>,
  delayMs: number = 200
): Promise<T> {
  const result = await fn();
  await delay(delayMs);
  return result;
}

async function fetchMultipleScreens(
  screenIds: string[],
  figmaClient: any,
  delayMs: number = 200
) {
  const results = [];
  
  for (const id of screenIds) {
    const result = await withRateLimit(
      () => figmaClient.getImage(id),
      delayMs
    );
    results.push(result);
  }
  
  return results;
}
```

### Applied in figma-screens-extractor
```javascript
// Config with delay
const CONFIG = {
  apiDelay: 200,  // milliseconds between requests
};

// Loop with delay
for (const node of screenNodes) {
  const url = await getImageUrl(node.id, format);
  // ... download ...
  await delay(CONFIG.apiDelay);  // Wait before next request
}
```

---

## Pattern 8: Clean Architecture (figmagic example)

### Layering
```typescript
// 1. Contracts (types/interfaces) - Central hub
interface Token {
  name: string;
  value: string;
}

interface Config {
  token: string;
  url: string;
  outputFolder: string;
}

// 2. Entities (domain logic)
class Token {
  constructor(private config: Config) {}
  
  parse(figmaNode: any): Token {
    // Domain logic for token extraction
  }
}

// 3. Frameworks (infrastructure)
class FileWriter {
  write(path: string, content: string): void {
    fs.writeFileSync(path, content);
  }
}

class HttpClient {
  get(url: string): Promise<any> {
    return fetch(url).then(r => r.json());
  }
}

// 4. Usecases (feature orchestration)
class CreateTokensUseCase {
  constructor(
    private tokenEntity: Token,
    private figmaService: any,
    private fileWriter: FileWriter
  ) {}
  
  async execute(config: Config): Promise<void> {
    const file = await this.figmaService.getFile(config.url);
    const tokens = this.tokenEntity.parse(file);
    this.fileWriter.write(config.outputFolder, tokens);
  }
}

// 5. Controllers (CLI)
class CliController {
  async run(args: string[]): Promise<void> {
    const config = this.parseArgs(args);
    const useCase = new CreateTokensUseCase(...);
    await useCase.execute(config);
  }
}
```

**Benefits**:
- Testable (mock dependencies easily)
- Extensible (add new usecases without changing core)
- Maintainable (clear separation of concerns)
- Framework-agnostic core logic

---

## Pattern 9: Template-Based Code Generation

### Pattern
```typescript
interface Template {
  content: string;
  substitutions: Record<string, string>;
}

function renderTemplate(template: Template): string {
  let result = template.content;
  
  for (const [key, value] of Object.entries(template.substitutions)) {
    result = result.replace(`{{${key}}}`, value);
  }
  
  return result;
}

const buttonTemplate = {
  content: `
    export const {{NAME}} = styled.button\`
      background-color: {{COLOR}};
      padding: {{PADDING}};
      font-size: {{FONT_SIZE}};
    \`;
  `,
  substitutions: {
    NAME: "PrimaryButton",
    COLOR: tokens.colors.primary,
    PADDING: tokens.spacing.md,
    FONT_SIZE: tokens.fontSizes.base
  }
};

const generated = renderTemplate(buttonTemplate);
```

### Applied in figmagic
```typescript
// Template file content:
// `export const {{NAME}} = styled.button\`...`

// Substitution tags:
const substitutions = {
  NAME: "Button",
  NAME_STYLED: "ButtonStyled",
  PROPS: "className?: string",
  CHILDREN: "children?: ReactNode",
  // ... more substitutions
};

// Can also support custom templates
// Users copy default template and customize for their project
```

---

## Pattern 10: Caching & Performance

### Pattern
```typescript
class CachedFigmaClient {
  private cache: Map<string, any> = new Map();
  private cacheTime: Map<string, number> = new Map();
  private cacheTTL = 60 * 60 * 1000; // 1 hour

  async getFile(fileId: string): Promise<FileResponse> {
    const cacheKey = `file:${fileId}`;
    
    // Check cache validity
    if (this.cache.has(cacheKey)) {
      const cacheAge = Date.now() - (this.cacheTime.get(cacheKey) || 0);
      if (cacheAge < this.cacheTTL) {
        return this.cache.get(cacheKey);
      }
    }
    
    // Fetch from API
    const file = await this.fetchFromApi(`/files/${fileId}`);
    
    // Store in cache
    this.cache.set(cacheKey, file);
    this.cacheTime.set(cacheKey, Date.now());
    
    return file;
  }

  private async fetchFromApi(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'X-Figma-Token': this.token }
    });
    return response.json();
  }
}
```

---

## Summary

These patterns represent the core strategies used across all reference repositories:

1. **REST API + Recursion**: Foundation for all extraction
2. **Naming Conventions**: Flexible categorization without configuration
3. **Transformers**: Clean data simplification pipeline
4. **Service Layer**: Clear separation between API, logic, and output
5. **Tokens**: Unidimensional design tokens for flexibility
6. **SVG Collapsing**: Payload optimization for AI consumption
7. **Rate Limiting**: Respect API limits gracefully
8. **Clean Architecture**: Testable, maintainable code structure
9. **Templates**: Extensible code generation
10. **Caching**: Performance optimization for large files

Understanding these patterns will help you adapt tools for your specific needs and create custom solutions that fit your workflow.
