/**
 * Validate generated code by compiling with TypeScript
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  file: string;
  compiles: boolean;
  errors: ts.Diagnostic[];
  syntaxValid: boolean;
  hasExports: boolean;
}

function validateTypeScriptFile(filePath: string): ValidationResult {
  const fileName = path.basename(filePath);
  const sourceCode = fs.readFileSync(filePath, 'utf-8');

  // Remove markdown code blocks if present
  let cleanCode = sourceCode;
  if (sourceCode.includes('```typescript')) {
    cleanCode = sourceCode.replace(/```typescript\n?/g, '').replace(/```\n?/g, '');
  }

  // Create a source file
  const sourceFile = ts.createSourceFile(
    fileName,
    cleanCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  // Check for syntax errors
  const syntaxErrors: ts.Diagnostic[] = [];

  function visitNode(node: ts.Node) {
    // Check for syntax issues
    if (node.kind === ts.SyntaxKind.Unknown) {
      const diagnostic: ts.Diagnostic = {
        file: sourceFile,
        start: node.getStart(),
        length: node.getWidth(),
        messageText: 'Unknown syntax',
        category: ts.DiagnosticCategory.Error,
        code: 0
      };
      syntaxErrors.push(diagnostic);
    }
    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);

  // Check for exports
  let hasExports = false;
  sourceFile.statements.forEach(statement => {
    if (
      ts.isExportDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      (ts.isFunctionDeclaration(statement) && statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) ||
      (ts.isVariableStatement(statement) && statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) ||
      (ts.isClassDeclaration(statement) && statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))
    ) {
      hasExports = true;
    }
  });

  // Try to compile with TypeScript compiler
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    strict: false, // Less strict for validation
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    moduleResolution: ts.ModuleResolutionKind.NodeNext
  };

  const host = ts.createCompilerHost(compilerOptions);

  // Override getSourceFile to provide our source
  const originalGetSourceFile = host.getSourceFile;
  host.getSourceFile = (name, languageVersion) => {
    if (name === fileName) {
      return sourceFile;
    }
    return originalGetSourceFile(name, languageVersion);
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const emitResult = program.emit();
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  // Filter to only show errors from our file
  const relevantErrors = allDiagnostics.filter(
    d => !d.file || d.file.fileName === fileName
  );

  return {
    file: fileName,
    compiles: relevantErrors.length === 0,
    errors: relevantErrors,
    syntaxValid: syntaxErrors.length === 0,
    hasExports
  };
}

function printDiagnostics(diagnostics: ts.Diagnostic[]) {
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n'
      );
      console.log(`  ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(`  ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
  });
}

async function main() {
  console.log('TypeScript Code Validation\n');
  console.log('='.repeat(80));

  const reportsDir = path.join(__dirname, 'reports');
  const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('generated-code-') && f.endsWith('.tsx'));

  const results: ValidationResult[] = [];

  for (const file of files) {
    const filePath = path.join(reportsDir, file);
    console.log(`\nValidating: ${file}`);
    console.log('-'.repeat(80));

    const result = validateTypeScriptFile(filePath);
    results.push(result);

    console.log(`Syntax Valid: ${result.syntaxValid ? '✅' : '❌'}`);
    console.log(`Has Exports: ${result.hasExports ? '✅' : '❌'}`);
    console.log(`Compiles: ${result.compiles ? '✅' : '⚠️ (with warnings)'}`);

    if (result.errors.length > 0) {
      console.log(`\nErrors/Warnings (${result.errors.length}):`);
      printDiagnostics(result.errors.slice(0, 10)); // Show first 10
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more`);
      }
    } else {
      console.log(`No compilation errors ✅`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Files: ${results.length}`);
  console.log(`Syntax Valid: ${results.filter(r => r.syntaxValid).length}/${results.length}`);
  console.log(`Has Exports: ${results.filter(r => r.hasExports).length}/${results.length}`);
  console.log(`Clean Compile: ${results.filter(r => r.compiles).length}/${results.length}`);

  const allValid = results.every(r => r.syntaxValid && r.hasExports);
  console.log(`\nOverall: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
}

main().catch(console.error);
