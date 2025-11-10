/**
 * End-to-End Figma-to-Code Pipeline
 *
 * Integrates all Phase 3 enhancements:
 * 1. Cached Parser - Hash-based file parsing with caching
 * 2. Enhanced Parser - Complete style extraction + classification
 * 3. Component Indexer - Embedding generation and storage
 * 4. Component Matcher - Similarity search
 * 5. Code Generator - React/TypeScript code generation
 * 6. Visual Validator - Hybrid pixel + semantic validation (optional)
 *
 * Usage:
 *   const pipeline = new FigmaToCodePipeline(db, apiKey);
 *   await pipeline.initialize();
 *   const result = await pipeline.processComponent(filePath, componentId);
 */
import { FigmaDatabase, generateComponentId } from './database.js';
import { CachedFigmaParser } from './cached-parser.js';
import { EnhancedFigmaParser } from './enhanced-figma-parser.js';
import { ComponentIndexer } from './component-indexer.js';
import { ComponentMatcher } from './component-matcher.js';
import { compareImages } from './visual-validator.js';
import AdmZip from 'adm-zip';
// ============================================================================
// CODE GENERATOR
// ============================================================================
class CodeGenerator {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * Generate React/TypeScript code from enhanced component data
     */
    async generate(component, matchResult) {
        const prompt = this.createPrompt(component, matchResult);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/figma-research',
                'X-Title': 'Figma to Code Pipeline'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5',
                messages: [{
                        role: 'user',
                        content: prompt
                    }],
                temperature: 0.2,
                max_tokens: 4000
            })
        });
        if (!response.ok) {
            throw new Error(`Code generation failed: ${response.status}`);
        }
        const data = await response.json();
        const code = data.choices[0].message.content;
        // Calculate cost (rough estimate)
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        const cost = (inputTokens / 1000000 * 3) + (outputTokens / 1000000 * 15);
        return {
            code,
            language: 'typescript',
            framework: 'react',
            prompt,
            modelName: 'anthropic/claude-sonnet-4.5',
            tokensUsed: inputTokens + outputTokens,
            cost
        };
    }
    createPrompt(component, matchResult) {
        const hasMatch = matchResult && matchResult.topMatch;
        const matchType = hasMatch ? matchResult.matches[0]?.matchType : 'none';
        if (matchType === 'exact' && hasMatch) {
            return this.createExactMatchPrompt(component, matchResult.topMatch);
        }
        else if (matchType === 'similar' && hasMatch) {
            return this.createSimilarMatchPrompt(component, matchResult.topMatch);
        }
        else {
            return this.createNewComponentPrompt(component);
        }
    }
    createNewComponentPrompt(component) {
        return `You are an expert React + TypeScript + Tailwind CSS developer. Generate a pixel-perfect React component based on this Figma design data.

# Component Data
Name: ${component.name}
Type: ${component.classification.type}
Confidence: ${(component.classification.confidence * 100).toFixed(1)}%

# Extracted Styles
${JSON.stringify({
            colors: component.styles.colors,
            typography: component.styles.typography,
            effects: component.styles.effects,
            spacing: component.styles.spacing,
            borders: component.styles.borders,
            layout: component.styles.layout
        }, null, 2)}

# Suggested Tailwind Classes
${component.tailwindClasses.join(' ')}

# Requirements
1. **TypeScript**: Use proper TypeScript types and interfaces
2. **React**: Modern React with function components
3. **Tailwind CSS**: Use provided Tailwind classes
4. **Props**: Create interface for customizable properties
5. **Accessibility**: Include ARIA labels and roles
6. **Clean Code**: Production-ready, well-formatted

Return ONLY the TypeScript/React component code. No explanations.`;
    }
    createExactMatchPrompt(component, match) {
        return `This Figma component matches existing library component "${match.name}".

# Figma Component
${component.name} - ${component.classification.type}

# Matching Library Component
${match.name} - ${match.component_type}

# Extracted Styles
${JSON.stringify(component.styles, null, 2)}

Generate code that uses the existing "${match.name}" component with correct props.
Include imports, TypeScript types, and any needed customization via className.

Return ONLY the TypeScript/React code. No explanations.`;
    }
    createSimilarMatchPrompt(component, match) {
        return `This Figma component is similar to "${match.name}" but needs customization.

# Figma Component
${component.name} - ${component.classification.type}

# Similar Library Component
${match.name} - ${match.component_type}

# Extracted Styles
${JSON.stringify(component.styles, null, 2)}

# Tailwind Classes
${component.tailwindClasses.join(' ')}

Generate code using "${match.name}" as base with Tailwind customization to match design exactly.

Return ONLY the TypeScript/React code. No explanations.`;
    }
}
// ============================================================================
// PIPELINE CLASS
// ============================================================================
export class FigmaToCodePipeline {
    db;
    cachedParser;
    indexer;
    matcher;
    codeGenerator;
    apiKey;
    constructor(dbPath, apiKey) {
        this.db = new FigmaDatabase(dbPath);
        this.cachedParser = new CachedFigmaParser(this.db);
        this.indexer = new ComponentIndexer(dbPath, apiKey);
        this.matcher = new ComponentMatcher(dbPath);
        this.codeGenerator = new CodeGenerator(apiKey);
        this.apiKey = apiKey;
    }
    /**
     * Initialize all components
     */
    async initialize() {
        await this.db.initialize();
        await this.indexer.initialize();
        await this.matcher.initialize();
    }
    /**
     * Process a single component through the entire pipeline
     */
    async processComponent(filePath, componentIdentifier, options = {}) {
        const startTime = Date.now();
        const metrics = {
            parseTime: 0,
            extractTime: 0,
            totalTime: 0,
            cached: false,
            totalCost: 0,
            success: false,
            errors: []
        };
        try {
            // Step 1: Parse file with caching
            if (options.verbose)
                console.log('\n[1/6] Parsing Figma file...');
            const parseStart = Date.now();
            const parseResult = await this.cachedParser.parseFile(filePath, {
                noCache: options.noCache,
                verbose: options.verbose
            });
            metrics.parseTime = Date.now() - parseStart;
            metrics.cached = parseResult.fromCache;
            metrics.cacheTime = parseResult.cacheTime;
            if (options.verbose) {
                console.log(`  ✓ Parse complete: ${metrics.cached ? 'CACHE HIT' : 'CACHE MISS'}`);
                console.log(`  ✓ Time: ${metrics.parseTime}ms`);
                console.log(`  ✓ Components found: ${parseResult.components.length}`);
            }
            // Step 2: Extract and enhance component
            if (options.verbose)
                console.log('\n[2/6] Extracting component with enhanced parser...');
            const extractStart = Date.now();
            // Find the component in the parsed file
            const component = this.findComponent(filePath, componentIdentifier);
            if (!component) {
                throw new Error(`Component not found: ${JSON.stringify(componentIdentifier)}`);
            }
            // Extract with enhanced parser
            const extractedComponent = EnhancedFigmaParser.parseNode(component);
            metrics.extractTime = Date.now() - extractStart;
            metrics.componentClassification = {
                type: extractedComponent.classification.type,
                confidence: extractedComponent.classification.confidence,
                reasoning: extractedComponent.classification.reasons.join('; ')
            };
            if (options.verbose) {
                console.log(`  ✓ Extracted: ${extractedComponent.name}`);
                console.log(`  ✓ Classified as: ${extractedComponent.classification.type} (${(extractedComponent.classification.confidence * 100).toFixed(1)}% confidence)`);
                console.log(`  ✓ Time: ${metrics.extractTime}ms`);
            }
            // Step 3: Index component (generate embedding)
            let matchResult;
            if (!options.skipIndexing && !options.skipMatching) {
                if (options.verbose)
                    console.log('\n[3/6] Indexing component...');
                const indexStart = Date.now();
                // Convert to Component format for indexing
                const componentForIndex = {
                    id: generateComponentId('figma'),
                    name: extractedComponent.name,
                    file_path: filePath,
                    component_type: this.mapClassificationToType(extractedComponent.classification.type),
                    metadata: {
                        classification: extractedComponent.classification,
                        dimensions: extractedComponent.styles.dimensions,
                        styles: extractedComponent.styles
                    }
                };
                await this.matcher.indexComponent(componentForIndex);
                metrics.indexTime = Date.now() - indexStart;
                if (options.verbose) {
                    console.log(`  ✓ Indexed with embedding`);
                    console.log(`  ✓ Time: ${metrics.indexTime}ms`);
                }
                // Step 4: Find matches
                if (!options.skipMatching) {
                    if (options.verbose)
                        console.log('\n[4/6] Finding similar components...');
                    const matchStart = Date.now();
                    matchResult = await this.matcher.findMatches(componentForIndex, {
                        limit: 5,
                        excludeIds: [componentForIndex.id]
                    });
                    metrics.matchTime = Date.now() - matchStart;
                    metrics.matchResult = {
                        topMatch: matchResult.topMatch,
                        topScore: matchResult.topScore,
                        confidenceLevel: matchResult.confidenceLevel,
                        matchType: matchResult.matches[0]?.matchType || 'none'
                    };
                    // Add embedding cost
                    metrics.totalCost += 0.0003; // Rough estimate for embedding generation
                    if (options.verbose) {
                        console.log(`  ✓ Found ${matchResult.matches.length} matches`);
                        if (matchResult.topMatch) {
                            console.log(`  ✓ Top match: ${matchResult.topMatch.name} (score: ${(matchResult.topScore * 100).toFixed(1)}%)`);
                        }
                        console.log(`  ✓ Time: ${metrics.matchTime}ms`);
                    }
                }
            }
            // Step 5: Generate code
            let codeGeneration;
            if (!options.skipCodeGeneration) {
                if (options.verbose)
                    console.log('\n[5/6] Generating React code...');
                const genStart = Date.now();
                codeGeneration = await this.codeGenerator.generate(extractedComponent, matchResult);
                metrics.codeGenTime = Date.now() - genStart;
                metrics.codeGeneration = codeGeneration;
                metrics.totalCost += codeGeneration.cost || 0;
                if (options.verbose) {
                    console.log(`  ✓ Generated ${codeGeneration.code.length} characters of code`);
                    console.log(`  ✓ Cost: $${codeGeneration.cost?.toFixed(6)}`);
                    console.log(`  ✓ Time: ${metrics.codeGenTime}ms`);
                }
            }
            // Step 6: Visual validation (optional)
            if (options.validate && options.referenceImagePath && options.implementationImagePath) {
                if (options.verbose)
                    console.log('\n[6/6] Running visual validation...');
                const valStart = Date.now();
                const validationResult = await compareImages(options.referenceImagePath, options.implementationImagePath, {
                    context: `${extractedComponent.name} component`,
                    pixelWeight: 0.3,
                    semanticWeight: 0.7
                });
                metrics.validationTime = Date.now() - valStart;
                metrics.visualValidation = {
                    pixelScore: validationResult.pixelResult.pixelScore,
                    semanticScore: validationResult.semanticResult.semanticScore,
                    finalScore: validationResult.finalScore,
                    recommendation: validationResult.recommendation,
                    summary: validationResult.summary,
                    cost: validationResult.totalCost
                };
                metrics.totalCost += validationResult.totalCost;
                if (options.verbose) {
                    console.log(`  ✓ Final score: ${(validationResult.finalScore * 100).toFixed(1)}%`);
                    console.log(`  ✓ Recommendation: ${validationResult.recommendation}`);
                    console.log(`  ✓ Time: ${metrics.validationTime}ms`);
                }
            }
            metrics.totalTime = Date.now() - startTime;
            metrics.success = true;
            if (options.verbose) {
                console.log(`\n✅ Pipeline complete in ${metrics.totalTime}ms`);
                console.log(`💰 Total cost: $${metrics.totalCost.toFixed(6)}`);
            }
            return {
                componentId: extractedComponent.id || 'unknown',
                componentName: extractedComponent.name,
                filePath,
                extractedComponent,
                matchResult,
                generatedCode: codeGeneration,
                metrics
            };
        }
        catch (error) {
            metrics.totalTime = Date.now() - startTime;
            metrics.errors.push(error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Find a component in a Figma file
     */
    findComponent(filePath, identifier) {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        const documentEntry = entries.find(e => e.entryName.endsWith('canvas.fig'));
        if (!documentEntry) {
            throw new Error('canvas.fig not found in Figma file');
        }
        const documentJson = JSON.parse(documentEntry.getData().toString('utf8'));
        // Traverse and find component
        let foundComponent = null;
        let currentIndex = 0;
        const traverse = (node) => {
            if (!node)
                return;
            const isComponent = node.type && ['COMPONENT', 'COMPONENT_SET', 'FRAME', 'SYMBOL'].includes(node.type);
            if (isComponent) {
                if (identifier.index !== undefined && currentIndex === identifier.index) {
                    foundComponent = node;
                    return;
                }
                if (identifier.name && node.name === identifier.name) {
                    foundComponent = node;
                    return;
                }
                currentIndex++;
            }
            if (node.children) {
                for (const child of node.children) {
                    traverse(child);
                    if (foundComponent)
                        return;
                }
            }
        };
        if (documentJson.document?.children) {
            for (const page of documentJson.document.children) {
                traverse(page);
                if (foundComponent)
                    break;
            }
        }
        return foundComponent;
    }
    /**
     * Map classification type to database component type
     */
    mapClassificationToType(classificationType) {
        const mapping = {
            'Button': 'COMPONENT',
            'Input': 'COMPONENT',
            'Card': 'COMPONENT',
            'Badge': 'COMPONENT',
            'Avatar': 'COMPONENT',
            'Dialog': 'COMPONENT',
            'Dropdown': 'COMPONENT',
            'Navigation': 'COMPONENT',
            'Layout': 'FRAME',
            'List': 'COMPONENT',
            'Table': 'COMPONENT',
            'Form': 'COMPONENT',
            'Icon': 'COMPONENT',
            'Other': 'FRAME'
        };
        return mapping[classificationType] || 'FRAME';
    }
    /**
     * Get pipeline statistics
     */
    getStatistics() {
        return {
            cacheStats: this.cachedParser.getCacheStats(),
            indexingStats: this.indexer.getStats(),
            dbStats: this.db.getStatistics()
        };
    }
    /**
     * Close all connections
     */
    close() {
        this.db.close();
        this.indexer.close();
        this.matcher.close();
    }
}
export default FigmaToCodePipeline;
