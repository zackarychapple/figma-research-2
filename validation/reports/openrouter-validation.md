# OpenRouter API Validation Report

**Date:** 11/6/2025, 10:44:43 PM
**API Status:** ✓ Valid

## Executive Summary

- **Total Models Tested:** 6
- **Available Models:** 2
- **Code Generation Models:** 1
- **Text Embedding Models:** 1
- **Visual Embedding Models:** 0
- **Total Test Cost:** $0.000523

## Model Test Results

### Code Generation

| Model | Status | Latency | Cost | Notes |
|-------|--------|---------|------|---------|
| anthropic/claude-3.5-sonnet | ✗ | N/A | N/A | No allowed providers are available for the selected model. |
| anthropic/claude-3.5-sonnet:beta | ✗ | N/A | N/A | No allowed providers are available for the selected model. |
| anthropic/claude-sonnet-4.5 | ✓ | 3828ms | $0.000513 | Success |

### Text Embedding

| Model | Status | Latency | Cost | Notes |
|-------|--------|---------|------|---------|
| openai/text-embedding-3-small | ✓ | 320ms | $0.000010 | Success |

### Visual Embedding

| Model | Status | Latency | Cost | Notes |
|-------|--------|---------|------|---------|
| openai/clip-vit-large-patch14 | ✗ | N/A | N/A | OpenRouter does not support visual embedding models |
| google/siglip-so400m-patch14-384 | ✗ | N/A | N/A | OpenRouter does not support visual embedding models |

## Performance Analysis

### Latency Benchmarks

- **code-generation:** 3828ms average
- **text-embedding:** 320ms average

### Requirements Check

| Requirement | Target | Actual | Status |
|-------------|--------|--------|--------|
| Code generation latency | < 5000ms | 3828ms | ✓ |
| Text embedding latency | < 500ms | 320ms | ✓ |

## Cost Analysis

### Per-Operation Costs

- **code-generation:** $0.000513 per operation
- **text-embedding:** $0.000010 per operation

### Monthly Cost Estimates

Based on processing 100-500 components per month:

| Volume | Estimated Cost |
|--------|----------------|
| 100 components | $5.00 |
| 300 components | $15.00 |
| 500 components | $25.00 |

## Recommendations

✓ Use anthropic/claude-sonnet-4.5 for code generation - meets performance requirements (3828ms < 5000ms)

✓ Use openai/text-embedding-3-small for text embeddings - meets performance requirements (320ms < 500ms)

⚠ No working visual embedding model found - may need alternative approach for image similarity


Estimated monthly cost for 300 components: $0.02


✓ RECOMMENDATION: OpenRouter meets core requirements for code generation and embeddings

## Fallback Options

### Code Generation
Primary: anthropic/claude-sonnet-4.5

### Text Embeddings
Primary: openai/text-embedding-3-small

### Visual Embeddings
⚠ No working models found - consider alternative approaches:
- Use OpenAI CLIP API directly
- Use Replicate for CLIP models
- Consider text-based similarity instead of visual

## Known Limitations

### Unavailable Models

- **anthropic/claude-3.5-sonnet:** No allowed providers are available for the selected model.
- **anthropic/claude-3.5-sonnet:beta:** No allowed providers are available for the selected model.
- **openai/clip-vit-large-patch14:** OpenRouter does not support visual embedding models
- **google/siglip-so400m-patch14-384:** OpenRouter does not support visual embedding models

## Conclusion

OpenRouter successfully provides the core models needed for the Figma-to-code system. Code generation and text embeddings are working with acceptable performance. Visual embeddings may require an alternative approach or additional provider.
