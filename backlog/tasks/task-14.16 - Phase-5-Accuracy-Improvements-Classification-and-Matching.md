---
id: task-14.16
title: Phase 5 Accuracy Improvements - Classification and Matching
status: To Do
assignee: []
created_date: '2025-11-07 12:57'
labels:
  - phase-5
  - accuracy
  - classification
  - matching
dependencies: []
parent_task_id: task-14
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve component classification accuracy from 83-92% to >90% and enhance matching accuracy through rule tuning and optional visual embeddings.

**Context:**
Phase 4 identified classification accuracy at 83-92% vs >85% target (marginal pass). Real-world data can improve accuracy to >90%.

**Improvements to Implement:**

1. **Classification Rule Tuning (Target: >90% accuracy)**
   - Collect classification data from Phase 4 tests
   - Analyze misclassifications
   - Add new classification rules based on real patterns
   - Tune confidence thresholds
   - Test on 50+ components

2. **Matching Confidence Tuning**
   - Analyze match results from Phase 4
   - Tune similarity thresholds (currently 0.7/0.85)
   - Test different scoring weights

3. **Visual Embeddings Integration (Optional, if needed)**
   - Integrate OpenAI CLIP directly (if matching <85%)
   - Implement hybrid approach (40% text + 60% visual)
   - Fallback to GPT-4o Vision descriptions → text embeddings

4. **HNSW Implementation (Optional, for >1,000 components)**
   - Add approximate nearest neighbor search
   - Use hnswlib or similar
   - Benchmark vs current cosine similarity

**Expected Outcome:**
- Component classification: >90% accuracy (from 83-92%)
- Matching accuracy: >90% (current: 60% text-only, >85% with adjustments)
- System ready for production use

**Time Estimate:** 2-3 days
**Files to Modify:**
- `/validation/enhanced-figma-parser.ts` (ComponentClassifier)
- `/validation/component-matcher.ts`
- `/validation/component-indexer.ts` (if visual embeddings)
- `/validation/database.ts` (if HNSW)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Classification rules tuned with real data (50+ components)
- [ ] #2 Component classification accuracy >90% (from 83-92%)
- [ ] #3 Misclassification patterns analyzed and documented
- [ ] #4 Matching confidence thresholds tuned
- [ ] #5 Matching accuracy >85% (>90% if visual embeddings added)
- [ ] #6 Visual embeddings integrated if needed for accuracy target
- [ ] #7 HNSW implemented if component count >500
- [ ] #8 Performance maintained (<100ms similarity search)
- [ ] #9 All improvements tested on real Figma files
<!-- AC:END -->
