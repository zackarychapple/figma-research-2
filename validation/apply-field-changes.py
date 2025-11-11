#!/usr/bin/env python3
"""
Apply Field component changes atomically to prevent file watcher conflicts
"""

def main():
    parser_file = 'enhanced-figma-parser.ts'

    # Read current content
    with open(parser_file, 'r') as f:
        content = f.read()

    # 1. Add 'Field' to ComponentType enum
    old_enum = """export type ComponentType =
  | 'Button'
  | 'Input'
  | 'Card'"""

    new_enum = """export type ComponentType =
  | 'Button'
  | 'Input'
  | 'Field'
  | 'Card'"""

    content = content.replace(old_enum, new_enum)

    # 2. Add classifyField to classifiers array (before classifyForm)
    old_classifiers = """    const classifiers = [
      this.classifySlider,
      this.classifyPagination,
      this.classifyTabs,
      this.classifyButton,
      this.classifyInput,
      this.classifyTextarea,
      this.classifyCheckbox,
      this.classifyRadioGroup,
      this.classifyRadio,
      this.classifySwitch,
      this.classifyToggleGroup,
      this.classifySelect,
      this.classifyDialog,
      this.classifyCard,
      this.classifyForm,"""

    new_classifiers = """    const classifiers = [
      this.classifySlider,
      this.classifyPagination,
      this.classifyTabs,
      this.classifyButton,
      this.classifyInput,
      this.classifyTextarea,
      this.classifyField,
      this.classifyCheckbox,
      this.classifyRadioGroup,
      this.classifyRadio,
      this.classifySwitch,
      this.classifyToggleGroup,
      this.classifySelect,
      this.classifyDialog,
      this.classifyCard,
      this.classifyForm,"""

    content = content.replace(old_classifiers, new_classifiers)

    # 3. Add classifyField and missing methods before closing brace
    # Find the last method (classifyImage) and insert after it
    with open('field-classifier-insert.txt', 'r') as f:
        classifier_code = f.read()

    # Find position to insert (after classifyImage method, before closing brace)
    insert_marker = """  static classifyImage(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    if (name.includes('image') || name.includes('img') || name.includes('picture')) {
      confidence += 0.5;
      reasons.push('Name suggests image');
    }

    // Has image fill
    const hasImageFill = node.fills && node.fills.some(f => f.type === 'IMAGE');
    if (hasImageFill) {
      confidence += 0.5;
      reasons.push('Has image fill');
    }

    return {
      type: 'Image',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }
}"""

    replacement = """  static classifyImage(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    if (name.includes('image') || name.includes('img') || name.includes('picture')) {
      confidence += 0.5;
      reasons.push('Name suggests image');
    }

    // Has image fill
    const hasImageFill = node.fills && node.fills.some(f => f.type === 'IMAGE');
    if (hasImageFill) {
      confidence += 0.5;
      reasons.push('Has image fill');
    }

    return {
      type: 'Image',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

""" + classifier_code + """
}"""

    content = content.replace(insert_marker, replacement)

    # Write back atomically
    with open(parser_file, 'w') as f:
        f.write(content)

    print("✓ Applied Field changes to enhanced-figma-parser.ts")

if __name__ == '__main__':
    main()
