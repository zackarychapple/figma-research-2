# Rust Image-Compare Integration Research

## Overview

Researching how to integrate Rust's `image-compare` crate with Node.js for pixel-perfect visual comparison.

## Rust image-compare Crate

**URL:** https://crates.io/crates/image-compare

**Features:**
- Multiple comparison algorithms: MSSIM (Multi-Scale Structural Similarity), SSIM, MSE, Hybrid
- Sub-pixel accuracy
- Fast performance (10-100x faster than JavaScript)
- Supports PNG, JPEG, and other formats
- Outputs difference images

**Example Usage:**
```rust
use image_compare::{Algorithm, Metric, Similarity};

let img1 = image::open("image1.png")?;
let img2 = image::open("image2.png")?;

let result = Similarity::compare(&img1, &img2, Algorithm::MSSIM)?;
println!("Similarity score: {}", result.score);
```

## Integration Options

### Option 1: Native Node.js Addons (Neon or napi-rs)

**Neon:**
- Framework for building native Node.js modules in Rust
- Good TypeScript support
- Requires compilation during npm install

**napi-rs:**
- Modern N-API bindings for Rust
- Better cross-platform support
- Used by production libraries (e.g., `@next/swc`)

**Pros:**
- Fast (direct Rust → Node.js)
- No IPC overhead
- Easy to use from TypeScript

**Cons:**
- Complex build setup
- Requires Rust toolchain on deployment machines
- Platform-specific binaries

**Example with napi-rs:**
```rust
#[napi]
fn compare_images(path1: String, path2: String) -> Result<f64> {
    let img1 = image::open(path1)?;
    let img2 = image::open(path2)?;
    let result = Similarity::compare(&img1, &img2, Algorithm::MSSIM)?;
    Ok(result.score)
}
```

**Complexity:** High (build tooling, cross-platform compilation)
**Performance:** Excellent (direct FFI)
**Time to Implement:** 2-3 days

---

### Option 2: Separate Rust Binary + IPC

**Approach:**
- Build standalone Rust binary
- Call from Node.js via `child_process`
- Pass image paths as CLI arguments
- Return JSON results via stdout

**Pros:**
- Simple to implement
- No build dependencies in Node.js project
- Easy to debug
- Can use pre-built binaries

**Cons:**
- Process spawning overhead (10-50ms per call)
- IPC serialization overhead
- Not as elegant

**Example Rust CLI:**
```rust
fn main() {
    let args: Vec<String> = env::args().collect();
    let img1 = image::open(&args[1])?;
    let img2 = image::open(&args[2])?;

    let result = Similarity::compare(&img1, &img2, Algorithm::MSSIM)?;

    println!("{{\"score\": {}, \"mssim\": {}}}", result.score, result.mssim);
}
```

**Example Node.js wrapper:**
```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function compareImages(path1: string, path2: string) {
    const { stdout } = await execFileAsync('./rust-compare', [path1, path2]);
    return JSON.parse(stdout);
}
```

**Complexity:** Low (just a CLI binary)
**Performance:** Good (50-100ms overhead)
**Time to Implement:** 4-6 hours

---

### Option 3: WebAssembly (WASM)

**Approach:**
- Compile Rust to WASM
- Load in Node.js or browser
- Pass image data as buffers

**Pros:**
- Cross-platform (works in browser too)
- No native dependencies
- Modern approach

**Cons:**
- Performance slightly worse than native
- Memory management complexity (passing large image buffers)
- Limited file system access (need to load images in JS first)

**Complexity:** Medium-High
**Performance:** Good (but slower than native)
**Time to Implement:** 1-2 days

---

## Alternative: JavaScript Libraries

Instead of Rust, use existing JavaScript libraries:

### pixelmatch
- Already used in some projects
- Pure JavaScript, no dependencies
- Good for simple pixel differences
- ~1000 lines, well-tested

**Performance:** Decent for small images (<500x500px)

### resemblejs
- Image comparison library
- Output difference images
- SSIM-like algorithm

**Performance:** Slower than pixelmatch for large images

### looks-same
- Used by testing frameworks
- Supports tolerance and antialiasing
- Battle-tested in production

---

## Recommendation

### For PoC: Option 2 (Rust Binary + IPC)

**Reasoning:**
1. **Simple to implement** (4-6 hours)
2. **No complex build tooling** required
3. **Easy to test and debug**
4. **Good performance** (50-100ms overhead is acceptable)
5. **Can upgrade to napi-rs later** if needed

**Implementation Plan:**

1. **Create Rust project** (`/validation/rust-compare/`)
   ```bash
   cargo new rust-compare --bin
   ```

2. **Add dependencies** (`Cargo.toml`)
   ```toml
   [dependencies]
   image = "0.24"
   image-compare = "0.3"
   serde_json = "1.0"
   ```

3. **Implement CLI** (`src/main.rs`)
   - Parse command line args
   - Load both images
   - Run MSSIM, SSIM, and MSE algorithms
   - Output JSON with all scores

4. **Build binary**
   ```bash
   cargo build --release
   ```

5. **Create Node.js wrapper** (`visual-comparator.ts`)
   - TypeScript function to call binary
   - Parse JSON output
   - Handle errors gracefully

6. **Test with real screenshots**
   - Component exports from Figma
   - Rendered code screenshots from Playwright

**Estimated Time:** 4-6 hours
**Risk:** Low (fallback to pixelmatch if Rust doesn't work)

---

### For Production: Option 1 (napi-rs)

If the PoC proves valuable and we need better performance, we can upgrade to napi-rs:

**Benefits:**
- 50-100ms faster (no IPC overhead)
- Cleaner API
- Better for high-volume processing

**Migration Effort:** 1-2 days

---

## Decision Matrix

| Option | Complexity | Performance | Time | Risk |
|--------|-----------|-------------|------|------|
| napi-rs | High | Excellent | 2-3d | Medium |
| Binary + IPC | Low | Good | 4-6h | Low |
| WASM | Medium | Good | 1-2d | Medium |
| JS (pixelmatch) | Very Low | Okay | 1h | Very Low |

---

## Next Steps

1. ✅ Research Rust integration options (DONE)
2. ⏭️ Implement Option 2 (Rust Binary + IPC)
3. ⏭️ Test with real component screenshots
4. ⏭️ Compare performance with pixelmatch baseline
5. ⏭️ Decide if napi-rs upgrade is needed

---

## Cost-Benefit Analysis

**Benefits of Rust:**
- 10-100x faster pixel comparison
- Multiple algorithms (MSSIM, SSIM, MSE)
- Sub-pixel accuracy
- Can process larger images (1920x1080+)

**Costs:**
- 4-6 hours implementation time
- Rust toolchain required for development
- Additional binary to maintain

**Verdict:** Worth it if we're processing 100+ images or need high accuracy. For <50 images, pixelmatch is sufficient.

---

## Alternative Recommendation

Given the time constraint and Phase 3 priorities, consider:

**Focus on GPT-4o Vision first** (semantic understanding is more valuable than pixel-perfect accuracy for UI components).

**Use pixelmatch for pixel-level comparison** as a baseline, then implement Rust if needed in Phase 4.

**Combined approach:**
```typescript
// Quick pixel diff with pixelmatch
const pixelScore = await pixelmatchComparison(img1, img2);

// Semantic understanding with GPT-4o
const semanticResult = await gpt4oVisionComparison(img1, img2);

// Combined score (weighted)
const finalScore = 0.3 * pixelScore + 0.7 * semanticResult.score;
```

This gets us 80% of the value with 20% of the effort.

---

**Research Completed:** 2025-11-07
**Recommendation:** Start with Option 2 (Rust Binary) if time permits, otherwise use pixelmatch + GPT-4o Vision
**Priority:** Medium (GPT-4o Vision is higher priority)
