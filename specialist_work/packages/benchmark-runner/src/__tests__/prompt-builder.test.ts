/**
 * Tests for prompt-builder module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCombinedPrompt, interpolatePrompt } from '../prompt-builder.js';
import type { SpecialistTemplate } from '../types/template.js';
import type { BenchmarkConfig } from '../types/benchmark.js';

describe('buildCombinedPrompt', () => {
  let mockTemplate: SpecialistTemplate;
  let mockConfig: BenchmarkConfig;

  beforeEach(() => {
    mockTemplate = {
      schema_version: '0.0.1',
      name: '@test/test-specialist',
      displayName: 'Test Specialist',
      version: '1.0.0',
      license: 'MIT',
      availability: 'public',
      persona: {
        purpose: 'Test specialist for validating prompt combination',
        values: ['Accuracy', 'Performance', 'Best practices'],
        attributes: [
          'Deep understanding of testing',
          'Expert in validation strategies',
        ],
        tech_stack: ['TypeScript', 'Node.js', 'Vitest'],
      },
      capabilities: {
        tags: ['testing'],
        descriptions: {
          testing: 'Runs tests',
        },
      },
      dependencies: {
        available_tools: ['test-runner'],
      },
      documentation: [
        {
          type: 'official',
          url: 'https://example.com/docs',
          description: 'Test documentation',
        },
        {
          type: 'guide',
          path: './guide.md',
          description: 'Test guide',
        },
      ],
      prompts: {
        default: {
          spawnerPrompt:
            'I specialize in testing. I can run tests and validate code.',
          taskPrompt: 'Run the tests for {testType} with {options}',
          custom_task: 'Custom task prompt for {task}',
        },
        model_specific: {
          'claude-sonnet-4.5': {
            spawnerPrompt:
              'I am the Test Specialist. I excel at running comprehensive tests, validating code quality, and ensuring best practices.',
            taskPrompt:
              'I will run tests for {testType} with {options}. I will analyze results, identify failures, and provide detailed feedback.',
          },
          'gpt-4o': {
            spawnerPrompt:
              'As the Test Specialist, I run tests and validate code.',
          },
        },
        prompt_strategy: {
          fallback: 'default',
          model_detection: 'auto',
          allow_override: true,
          interpolation: {
            style: 'mustache',
            escape_html: false,
          },
        },
      },
      benchmarks: {
        test_suites: [
          {
            name: 'test-suite',
            path: './test-suite',
            type: 'functional',
          },
        ],
      },
    };

    mockConfig = {
      suite: 'test-suite',
      scenario: 'test-scenario',
      tier: 'L0-minimal',
      templateName: '@test/test-specialist',
      templateVersion: '1.0.0',
      preferredModels: [{ model: 'claude-sonnet-4.5', weight: 1.0 }],
      type: 'functional',
    };
  });

  it('should build persona section correctly', async () => {
    const result = await buildCombinedPrompt(
      mockTemplate,
      mockConfig,
      'claude-sonnet-4.5',
      '/fake/path'
    );

    expect(result.persona).toContain('You are Test Specialist');
    expect(result.persona).toContain(
      'Test specialist for validating prompt combination'
    );
    expect(result.persona).toContain('Core Values:');
    expect(result.persona).toContain('- Accuracy');
    expect(result.persona).toContain('- Performance');
    expect(result.persona).toContain('Key Attributes:');
    expect(result.persona).toContain('- Deep understanding of testing');
    expect(result.persona).toContain('Tech Stack: TypeScript, Node.js, Vitest');
  });

  it('should build documentation section correctly', async () => {
    const result = await buildCombinedPrompt(
      mockTemplate,
      mockConfig,
      'claude-sonnet-4.5',
      '/fake/path'
    );

    expect(result.documentation).toContain('Documentation:');
    expect(result.documentation).toContain(
      'Test documentation: https://example.com/docs'
    );
    expect(result.documentation).toContain('Test guide: ./guide.md');
  });

  it('should use model-specific prompts when available', async () => {
    const result = await buildCombinedPrompt(
      mockTemplate,
      mockConfig,
      'claude-sonnet-4.5',
      '/fake/path'
    );

    expect(result.modelPrompts.spawnerPrompt).toContain(
      'I am the Test Specialist'
    );
    expect(result.modelPrompts.spawnerPrompt).toContain(
      'running comprehensive tests'
    );
    expect(result.modelPrompts.taskPrompt).toContain(
      'I will run tests for {testType}'
    );
  });

  it('should fall back to default prompts when model-specific not available', async () => {
    const result = await buildCombinedPrompt(
      mockTemplate,
      mockConfig,
      'claude-haiku-3.5',
      '/fake/path'
    );

    expect(result.modelPrompts.spawnerPrompt).toBe(
      'I specialize in testing. I can run tests and validate code.'
    );
    expect(result.modelPrompts.taskPrompt).toBe(
      'Run the tests for {testType} with {options}'
    );
  });

  it('should merge model-specific and default prompts correctly', async () => {
    const result = await buildCombinedPrompt(
      mockTemplate,
      mockConfig,
      'gpt-4o',
      '/fake/path'
    );

    // gpt-4o has spawnerPrompt but not taskPrompt or custom_task
    expect(result.modelPrompts.spawnerPrompt).toBe(
      'As the Test Specialist, I run tests and validate code.'
    );
    // Should fall back to default for missing keys
    expect(result.modelPrompts.taskPrompt).toBe(
      'Run the tests for {testType} with {options}'
    );
    expect(result.modelPrompts.custom_task).toBe(
      'Custom task prompt for {task}'
    );
  });

  it('should combine sections in correct order', async () => {
    const result = await buildCombinedPrompt(
      mockTemplate,
      mockConfig,
      'claude-sonnet-4.5',
      '/fake/path'
    );

    const fullPrompt = result.full;

    // Check order: Persona → Documentation → Model Prompts → Tier
    const personaIndex = fullPrompt.indexOf('You are Test Specialist');
    const docsIndex = fullPrompt.indexOf('Documentation:');
    const spawnerIndex = fullPrompt.indexOf('I am the Test Specialist');

    expect(personaIndex).toBeLessThan(docsIndex);
    expect(docsIndex).toBeLessThan(spawnerIndex);
  });

  it('should handle template without documentation', async () => {
    const templateWithoutDocs = { ...mockTemplate, documentation: undefined };

    const result = await buildCombinedPrompt(
      templateWithoutDocs,
      mockConfig,
      'claude-sonnet-4.5',
      '/fake/path'
    );

    expect(result.documentation).toBe('');
    expect(result.full).not.toContain('Documentation:');
  });

  it('should handle template without prompts', async () => {
    const templateWithoutPrompts = { ...mockTemplate, prompts: undefined };

    const result = await buildCombinedPrompt(
      templateWithoutPrompts,
      mockConfig,
      'claude-sonnet-4.5',
      '/fake/path'
    );

    expect(result.modelPrompts).toEqual({});
    expect(result.full).toContain('You are Test Specialist');
  });
});

describe('interpolatePrompt', () => {
  it('should interpolate mustache-style variables', () => {
    const prompt = 'Run tests for {testType} with {options}';
    const context = {
      testType: 'unit',
      options: '--coverage',
    };

    const result = interpolatePrompt(prompt, context);

    expect(result).toBe('Run tests for unit with --coverage');
  });

  it('should handle multiple occurrences of same variable', () => {
    const prompt = 'Test {name} in {environment}. {name} should pass.';
    const context = {
      name: 'MyTest',
      environment: 'production',
    };

    const result = interpolatePrompt(prompt, context);

    expect(result).toBe(
      'Test MyTest in production. MyTest should pass.'
    );
  });

  it('should handle missing variables gracefully', () => {
    const prompt = 'Run {testType} with {options}';
    const context = {
      testType: 'unit',
    };

    const result = interpolatePrompt(prompt, context);

    expect(result).toBe('Run unit with {options}');
  });

  it('should convert non-string values to strings', () => {
    const prompt = 'Timeout: {timeout}ms, retry: {retry}';
    const context = {
      timeout: 5000,
      retry: true,
    };

    const result = interpolatePrompt(prompt, context);

    expect(result).toBe('Timeout: 5000ms, retry: true');
  });
});
