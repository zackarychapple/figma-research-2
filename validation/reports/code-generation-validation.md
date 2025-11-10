# Code Generation Validation Report

**Date:** 2025-11-07T11:52:02.440Z
**Task:** task-14.4 - Validate Code Generation with Claude Sonnet 4.5 via OpenRouter
**Model:** anthropic/claude-sonnet-4.5

## Executive Summary

- **Total Tests:** 3
- **Successful:** 3 (100.0%)
- **Average Latency:** 8294ms
- **Target Latency:** 5000ms
- **Performance:** ❌ FAIL (-65.9% slower)

## Quality Metrics

| Metric | Count | Percentage | Status |
|--------|-------|------------|--------|
| hasTypeScript | 3/3 | 100.0% | ✅ PASS |
| hasReact | 3/3 | 100.0% | ✅ PASS |
| hasTailwind | 3/3 | 100.0% | ✅ PASS |
| hasProps | 3/3 | 100.0% | ✅ PASS |
| hasAccessibility | 0/3 | 0.0% | ❌ FAIL |
| formatted | 3/3 | 100.0% | ✅ PASS |

## Test Results

### 1. NEW: h1

**Description:** Generate new button component from scratch

**Metrics:**
- Latency: 4378ms
- Valid: ✅
- Errors: None

**Quality:**
- hasTypeScript: ✅
- hasReact: ✅
- hasTailwind: ✅
- hasProps: ✅
- hasAccessibility: ❌
- formatted: ✅

**Generated Code:**

```typescript
```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export interface H1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

const H1 = React.forwardRef<HTMLHeadingElement, H1Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(
          "text-4xl font-bold tracking-tight text-black",
          className
        )}
        {...props}
      >
        {children}
      </h1>
    );
  }
);

H1.displayName = "H1";

export default H1;
```
```

**Figma Input Data:**

```json
{
  "name": "h1",
  "type": "TEXT",
  "bounds": {
    "x": 0,
    "y": 0,
    "width": 50,
    "height": 36
  },
  "backgroundColor": "rgb(0, 0, 0)",
  "children": [],
  "styles": {},
  "layout": {
    "mode": "NONE",
    "direction": "none"
  },
  "variables": [],
  "components": []
}
```

---

### 2. EXACT_MATCH: Card

**Description:** Map Figma button to ShadCN Button component

**Metrics:**
- Latency: 7922ms
- Valid: ✅
- Errors: None

**Quality:**
- hasTypeScript: ✅
- hasReact: ✅
- hasTailwind: ✅
- hasProps: ✅
- hasAccessibility: ❌
- formatted: ✅

**Generated Code:**

```typescript
```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function FeatureCard({
  icon = <Rocket className="h-5 w-5" />,
  title = "Benefit driven feature title",
  description = "Shortly describe how this feature solves a specific user problem. Focus on benefits rather than technical details.",
  buttonText = "Learn more",
  onButtonClick
}: FeatureCardProps) {
  return (
    <Card className="w-[394.67px] p-6">
      <div className="flex flex-col gap-6">
        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
          {icon}
        </div>
        
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base font-semibold leading-6 text-[rgb(10,10,10)]">
            {title}
          </CardTitle>
          <CardDescription className="text-base font-normal leading-6 text-[rgb(115,115,115)]">
            {description}
          </CardDescription>
        </div>
        
        <Button 
          variant="link" 
          className="w-fit h-5 p-0 text-base font-normal"
          onClick={onButtonClick}
        >
          {buttonText}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
```
```

**Figma Input Data:**

```json
{
  "name": "Card",
  "type": "SYMBOL",
  "bounds": {
    "x": 0,
    "y": 0,
    "width": 394.6666564941406,
    "height": 260
  },
  "backgroundColor": "rgb(255, 255, 255)",
  "children": [
    {
      "id": "18191:185808",
      "name": "Flex Vertical",
      "type": "FRAME",
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 346.6666564941406,
        "height": 212
      },
      "relativeTransform": {
        "m00": 1,
        "m01": 0,
        "m02": 24,
        "m10": 0,
        "m11": 1,
        "m12": 24
      },
      "size": {
        "x": 346.6666564941406,
        "y": 212
      },
      "visible": true,
      "opacity": 1,
      "fills": [],
      "strokes": [],
      "effects": [],
      "isComponent": false,
      "isInstance": false,
      "componentProperties": {},
      "imageHash": null,
      "children": [
        {
          "id": "18191:185809",
          "name": "Icon Wrapper",
          "type": "FRAME",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 40,
            "height": 40
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 0
          },
          "size": {
            "x": 40,
            "y": 40
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 1,
              "color": "rgb(124, 58, 237)"
            },
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 0.949999988079071,
              "color": "rgba(255, 255, 255, 0.950)"
            }
          ],
          "strokes": [],
          "effects": [],
          "isComponent": false,
          "isInstance": false,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "18191:185810",
              "name": "Icon / Rocket",
              "type": "INSTANCE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 20,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 10,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 20,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": true,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        },
        {
          "id": "18191:185811",
          "name": "Flex Vertical",
          "type": "FRAME",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 346.6666564941406,
            "height": 104
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 64
          },
          "size": {
            "x": 346.6666564941406,
            "y": 104
          },
          "visible": true,
          "opacity": 1,
          "fills": [],
          "strokes": [],
          "effects": [],
          "isComponent": false,
          "isInstance": false,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "18191:185812",
              "name": "Flex",
              "type": "FRAME",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 346.6666564941406,
                "height": 32
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 0,
                "m10": 0,
                "m11": 1,
                "m12": 6
              },
              "size": {
                "x": 346.6666564941406,
                "y": 32
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": [
                {
                  "id": "18191:185813",
                  "name": "Subheading",
                  "type": "TEXT",
                  "bounds": {
                    "x": 0,
                    "y": 0,
                    "width": 346.6666564941406,
                    "height": 24
                  },
                  "relativeTransform": {
                    "m00": 1,
                    "m01": 0,
                    "m02": 0,
                    "m10": 0,
                    "m11": 1,
                    "m12": 0
                  },
                  "size": {
                    "x": 346.6666564941406,
                    "y": 24
                  },
                  "visible": true,
                  "opacity": 1,
                  "fills": [
                    {
                      "type": "SOLID",
                      "visible": true,
                      "opacity": 1,
                      "color": "rgb(10, 10, 10)"
                    }
                  ],
                  "strokes": [],
                  "effects": [],
                  "characters": "Benefit driven feature title",
                  "fontSize": 16,
                  "fontName": {
                    "family": "Geist",
                    "style": "SemiBold",
                    "postscript": "Geist-SemiBold"
                  },
                  "textAlignVertical": "TOP",
                  "letterSpacing": {
                    "value": 0,
                    "units": "PERCENT"
                  },
                  "lineHeight": {
                    "value": 24,
                    "units": "PIXELS"
                  },
                  "textAutoResize": "HEIGHT",
                  "isComponent": false,
                  "isInstance": false,
                  "componentProperties": {},
                  "imageHash": null,
                  "children": []
                }
              ]
            },
            {
              "id": "18191:185814",
              "name": "Shortly describe how this feature solves a specific user problem. Focus on benefits rather than technical details.",
              "type": "TEXT",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 346.6666564941406,
                "height": 60
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 0,
                "m10": 0,
                "m11": 1,
                "m12": 44
              },
              "size": {
                "x": 346.6666564941406,
                "y": 60
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(115, 115, 115)"
                }
              ],
              "strokes": [],
              "effects": [],
              "characters": "Shortly describe how this feature solves a specific user problem. Focus on benefits rather than technical details.",
              "fontSize": 16,
              "fontName": {
                "family": "Geist",
                "style": "Regular",
                "postscript": "Geist-Regular"
              },
              "textAlignVertical": "TOP",
              "letterSpacing": {
                "value": 0,
                "units": "PERCENT"
              },
              "lineHeight": {
                "value": 24,
                "units": "PIXELS"
              },
              "textAutoResize": "HEIGHT",
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        },
        {
          "id": "18191:185815",
          "name": "Button",
          "type": "INSTANCE",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 98,
            "height": 20
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 192
          },
          "size": {
            "x": 98,
            "y": 20
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 0,
              "color": "rgba(255, 255, 255, 0.000)"
            }
          ],
          "strokes": [],
          "effects": [],
          "isComponent": false,
          "isInstance": true,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "5197:735-derived-2",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "5197:217-derived-5",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 3.3333332538604736,
                "y": 3.3333332538604736,
                "width": 9.333333969116211,
                "height": 9.333333969116211
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 3.3333332538604736,
                "m10": 0,
                "m11": 1,
                "m12": 3.3333332538604736
              },
              "size": {
                "x": 9.333333969116211,
                "y": 9.333333969116211
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ],
          "semanticType": "button"
        }
      ]
    }
  ],
  "styles": {},
  "layout": {
    "mode": "NONE",
    "direction": "none"
  },
  "variables": [],
  "components": []
}
```

---

### 3. SIMILAR_MATCH: App Shell /  Stacked / 4

**Description:** Use Button component with custom styling

**Metrics:**
- Latency: 12581ms
- Valid: ✅
- Errors: None

**Quality:**
- hasTypeScript: ✅
- hasReact: ✅
- hasTailwind: ✅
- hasProps: ✅
- hasAccessibility: ❌
- formatted: ✅

**Generated Code:**

```typescript
```typescript
import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children?: React.ReactNode
  className?: string
  breakpoint?: "desktop" | "mobile"
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ children, className, breakpoint = "desktop", ...props }, ref) => {
    const isDesktop = breakpoint === "desktop"
    
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white",
          isDesktop ? "w-[1280px] h-[364px]" : "w-[360px] h-[400px]",
          className
        )}
        {...props}
      >
        {/* Navbar */}
        <div
          className={cn(
            "bg-[rgb(10,10,10)] border-b border-white/10",
            isDesktop ? "h-16" : "h-14",
            "shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          )}
        />

        {/* Page Header */}
        <div
          className={cn(
            "bg-[rgb(10,10,10)] border-b border-white/10",
            isDesktop ? "h-[184px]" : "h-[228px]"
          )}
        >
          <div className={cn(isDesktop ? "px-6 py-2" : "px-4 py-2")}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-sm text-neutral-100 hover:bg-white/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mr-2"
                >
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Contact support
              </Button>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div
          className={cn(
            "bg-white",
            isDesktop ? "h-[116px] px-6" : "h-[116px] px-4",
            "py-6"
          )}
        >
          <div
            className={cn(
              "border border-purple-500/50 bg-purple-500/10 rounded",
              isDesktop ? "w-[1232px]" : "w-[328px]",
              "h-[68px]"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)

AppShell.displayName = "AppShell"

export { AppShell }
```
```

**Figma Input Data:**

```json
{
  "name": "App Shell /  Stacked / 4",
  "type": "FRAME",
  "bounds": {
    "x": 0,
    "y": 0,
    "width": 1760,
    "height": 480
  },
  "backgroundColor": null,
  "children": [
    {
      "id": "3092:46473",
      "name": "Breakpoint=Desktop",
      "type": "SYMBOL",
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 1280,
        "height": 364
      },
      "relativeTransform": {
        "m00": 1,
        "m01": 0,
        "m02": 40,
        "m10": 0,
        "m11": 1,
        "m12": 40
      },
      "size": {
        "x": 1280,
        "y": 364
      },
      "visible": true,
      "opacity": 1,
      "fills": [
        {
          "type": "SOLID",
          "visible": true,
          "opacity": 1,
          "color": "rgb(255, 255, 255)"
        }
      ],
      "strokes": [],
      "effects": [],
      "isComponent": true,
      "isInstance": true,
      "componentProperties": {},
      "imageHash": null,
      "children": [
        {
          "id": "3092:46474",
          "name": "Navbar / 2",
          "type": "INSTANCE",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 1280,
            "height": 64
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 0
          },
          "size": {
            "x": 1280,
            "y": 64
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 1,
              "color": "rgb(10, 10, 10)"
            }
          ],
          "strokes": [
            {
              "type": "SOLID",
              "color": "rgba(255, 255, 255, 0.100)",
              "opacity": 0.10000000149011612,
              "visible": true
            }
          ],
          "effects": [
            {
              "type": "DROP_SHADOW",
              "visible": true,
              "radius": 2,
              "color": "rgba(0, 0, 0, 0.050)",
              "offset": {
                "x": 0,
                "y": 1
              },
              "spread": 0
            }
          ],
          "isComponent": false,
          "isInstance": true,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "3013:6787-derived-4",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 20,
                "height": 20
              },
              "size": {
                "x": 20,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:9773-derived-9",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:6787-derived-12",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 20,
                "height": 20
              },
              "size": {
                "x": 20,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:9773-derived-17",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:6787-derived-20",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 20,
                "height": 20
              },
              "size": {
                "x": 20,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:9773-derived-25",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:6462-derived-29",
              "name": "Component Child",
              "type": "TEXT",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 56,
                "height": 20
              },
              "size": {
                "x": 56,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "characters": "Settings",
              "fontSize": 14,
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3013:9835-derived-30",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 20,
                "height": 20
              },
              "size": {
                "x": 20,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:9850-derived-35",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "46:196-derived-39",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "37:1562-derived-42",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "267:4072-derived-44",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6525-derived-48",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6526-derived-49",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6527-derived-50",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6528-derived-51",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6529-derived-52",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6530-derived-53",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3014:6531-derived-54",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6532-derived-55",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3013:6787-derived-57",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 20,
                "height": 20
              },
              "size": {
                "x": 20,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            },
            {
              "id": "3013:9773-derived-62",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 1,
                  "color": "rgb(245, 245, 245)"
                },
                {
                  "type": "IMAGE",
                  "visible": true,
                  "opacity": 1,
                  "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
                  "scaleMode": "FILL"
                }
              ],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": "cfa90523740b88f37cf837b3a4b69c4f932d514c",
              "children": []
            }
          ]
        },
        {
          "id": "3092:46475",
          "name": "Page Header / 7",
          "type": "INSTANCE",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 1280,
            "height": 184
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 64
          },
          "size": {
            "x": 1280,
            "y": 184
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 1,
              "color": "rgb(10, 10, 10)"
            }
          ],
          "strokes": [
            {
              "type": "SOLID",
              "color": "rgba(255, 255, 255, 0.100)",
              "opacity": 0.10000000149011612,
              "visible": true
            }
          ],
          "effects": [],
          "isComponent": false,
          "isInstance": true,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "37:135-derived-3",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 50,
                "y": 2.5,
                "width": 15,
                "height": 15
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 50,
                "m10": 0,
                "m11": 1,
                "m12": 2.5
              },
              "size": {
                "x": 15,
                "y": 15
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:137-derived-5",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 139,
                "y": 2.5,
                "width": 15,
                "height": 15
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 139,
                "m10": 0,
                "m11": 1,
                "m12": 2.5
              },
              "size": {
                "x": 15,
                "y": 15
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:139-derived-7",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 529,
                "y": 10.5,
                "width": 15,
                "height": 15
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 529,
                "m10": 0,
                "m11": 1,
                "m12": 10.5
              },
              "size": {
                "x": 15,
                "y": 15
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "109:937-derived-9",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 297,
                "y": 10.5,
                "width": 15,
                "height": 15
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 297,
                "m10": 0,
                "m11": 1,
                "m12": 10.5
              },
              "size": {
                "x": 15,
                "y": 15
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "111:1212-derived-11",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 438,
                "y": 8,
                "width": 81,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 438,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 81,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "111:1267-derived-13",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 413,
                "y": 10.5,
                "width": 15,
                "height": 15
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 413,
                "m10": 0,
                "m11": 1,
                "m12": 10.5
              },
              "size": {
                "x": 15,
                "y": 15
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "195:1994-derived-15",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 40,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 0,
                "m10": 0,
                "m11": 1,
                "m12": 0
              },
              "size": {
                "x": 40,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "195:2183-derived-17",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 187,
                "y": 8,
                "width": 100,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 187,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 100,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "195:2362-derived-21",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 75,
                "y": 0,
                "width": 54,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 75,
                "m10": 0,
                "m11": 1,
                "m12": 0
              },
              "size": {
                "x": 54,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "195:2564-derived-23",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 322,
                "y": 8,
                "width": 81,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 322,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 81,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "195:2991-derived-25",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 164,
                "y": 0,
                "width": 87,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 164,
                "m10": 0,
                "m11": 1,
                "m12": 0
              },
              "size": {
                "x": 87,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1478-derived-28",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 8,
                "width": 39,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 39,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1559-derived-29",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "267:4103-derived-31",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 93,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 93,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:925-derived-34",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 8,
                "width": 49,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 49,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1562-derived-35",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "267:4072-derived-37",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 93,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 93,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1478-derived-44",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 8,
                "width": 26,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 26,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1559-derived-45",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "267:4103-derived-47",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 93,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 93,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1478-derived-50",
              "name": "Component Child",
              "type": "TEXT",
              "bounds": {
                "x": 16,
                "y": 8,
                "width": 110,
                "height": 20
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 8
              },
              "size": {
                "x": 110,
                "y": 20
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "characters": "Contact support",
              "fontSize": 14,
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "37:1559-derived-51",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 16,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "267:4103-derived-53",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 93,
                "y": 10,
                "width": 16,
                "height": 16
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 93,
                "m10": 0,
                "m11": 1,
                "m12": 10
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        },
        {
          "id": "3092:46476",
          "name": "Content Wrapper",
          "type": "FRAME",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 1280,
            "height": 116
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 248
          },
          "size": {
            "x": 1280,
            "y": 116
          },
          "visible": true,
          "opacity": 1,
          "fills": [],
          "strokes": [],
          "effects": [],
          "isComponent": false,
          "isInstance": false,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "3092:46477",
              "name": "Slot",
              "type": "INSTANCE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 1232,
                "height": 68
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 24,
                "m10": 0,
                "m11": 1,
                "m12": 24
              },
              "size": {
                "x": 1232,
                "y": 68
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 0.10000000149011612,
                  "color": "rgba(168, 85, 247, 0.100)"
                }
              ],
              "strokes": [
                {
                  "type": "SOLID",
                  "color": "rgba(168, 85, 247, 0.500)",
                  "opacity": 0.5,
                  "visible": true
                }
              ],
              "effects": [],
              "isComponent": false,
              "isInstance": true,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": "3092:46478",
      "name": "Breakpoint=Mobile",
      "type": "SYMBOL",
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 360,
        "height": 400
      },
      "relativeTransform": {
        "m00": 1,
        "m01": 0,
        "m02": 1360,
        "m10": 0,
        "m11": 1,
        "m12": 40
      },
      "size": {
        "x": 360,
        "y": 400
      },
      "visible": true,
      "opacity": 1,
      "fills": [
        {
          "type": "SOLID",
          "visible": true,
          "opacity": 1,
          "color": "rgb(255, 255, 255)"
        }
      ],
      "strokes": [],
      "effects": [],
      "isComponent": true,
      "isInstance": true,
      "componentProperties": {},
      "imageHash": null,
      "children": [
        {
          "id": "3092:46479",
          "name": "Navbar / 2",
          "type": "INSTANCE",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 360,
            "height": 56
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 0
          },
          "size": {
            "x": 360,
            "y": 56
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 1,
              "color": "rgb(10, 10, 10)"
            }
          ],
          "strokes": [
            {
              "type": "SOLID",
              "color": "rgba(255, 255, 255, 0.100)",
              "opacity": 0.10000000149011612,
              "visible": true
            }
          ],
          "effects": [
            {
              "type": "DROP_SHADOW",
              "visible": true,
              "radius": 2,
              "color": "rgba(0, 0, 0, 0.050)",
              "offset": {
                "x": 0,
                "y": 1
              },
              "spread": 0
            }
          ],
          "isComponent": false,
          "isInstance": true,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "3013:9970-derived-3",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 24,
                "height": 24
              },
              "size": {
                "x": 24,
                "y": 24
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3013:9970-derived-7",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 24,
                "height": 24
              },
              "size": {
                "x": 24,
                "y": 24
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3013:10893-derived-10",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 24,
                "height": 24
              },
              "size": {
                "x": 24,
                "y": 24
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6525-derived-13",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6526-derived-14",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6527-derived-15",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6528-derived-16",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6529-derived-17",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6530-derived-18",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6531-derived-19",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "3014:6532-derived-20",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 0,
                "height": 0
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        },
        {
          "id": "3092:46480",
          "name": "Page Header / 7",
          "type": "INSTANCE",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 360,
            "height": 228
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 56
          },
          "size": {
            "x": 360,
            "y": 228
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 1,
              "color": "rgb(10, 10, 10)"
            }
          ],
          "strokes": [
            {
              "type": "SOLID",
              "color": "rgba(255, 255, 255, 0.100)",
              "opacity": 0.10000000149011612,
              "visible": true
            }
          ],
          "effects": [],
          "isComponent": false,
          "isInstance": true,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "37:1562-derived-9",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            },
            {
              "id": "267:4072-derived-11",
              "name": "Component Child",
              "type": "DERIVED_NODE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 16,
                "height": 16
              },
              "size": {
                "x": 16,
                "y": 16
              },
              "visible": true,
              "opacity": 1,
              "fills": [],
              "strokes": [],
              "effects": [],
              "isComponent": false,
              "isInstance": false,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        },
        {
          "id": "3092:46481",
          "name": "Content Wrapper",
          "type": "FRAME",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 360,
            "height": 116
          },
          "relativeTransform": {
            "m00": 1,
            "m01": 0,
            "m02": 0,
            "m10": 0,
            "m11": 1,
            "m12": 284
          },
          "size": {
            "x": 360,
            "y": 116
          },
          "visible": true,
          "opacity": 1,
          "fills": [
            {
              "type": "SOLID",
              "visible": true,
              "opacity": 1,
              "color": "rgb(255, 255, 255)"
            }
          ],
          "strokes": [],
          "effects": [],
          "isComponent": false,
          "isInstance": false,
          "componentProperties": {},
          "imageHash": null,
          "children": [
            {
              "id": "3092:46482",
              "name": "Slot",
              "type": "INSTANCE",
              "bounds": {
                "x": 0,
                "y": 0,
                "width": 328,
                "height": 68
              },
              "relativeTransform": {
                "m00": 1,
                "m01": 0,
                "m02": 16,
                "m10": 0,
                "m11": 1,
                "m12": 24
              },
              "size": {
                "x": 328,
                "y": 68
              },
              "visible": true,
              "opacity": 1,
              "fills": [
                {
                  "type": "SOLID",
                  "visible": true,
                  "opacity": 0.10000000149011612,
                  "color": "rgba(168, 85, 247, 0.100)"
                }
              ],
              "strokes": [
                {
                  "type": "SOLID",
                  "color": "rgba(168, 85, 247, 0.500)",
                  "opacity": 0.5,
                  "visible": true
                }
              ],
              "effects": [],
              "isComponent": false,
              "isInstance": true,
              "componentProperties": {},
              "imageHash": null,
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "styles": {},
  "layout": {
    "mode": "NONE",
    "direction": "none"
  },
  "variables": [],
  "components": []
}
```

---

## Recommendations

❌ **Performance:** Below target. Consider optimizing prompts or using a faster model.

✅ **Quality:** All tests passed validation.

## Next Steps

1. Review generated code quality
2. Test compiled TypeScript output
3. Validate components render correctly
4. Compare visual output to Figma designs
5. Iterate on prompts for better results
