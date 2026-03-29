# Design System

## Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display | Bricolage Grotesque | 600, 700, 800 | Headings, titles |
| Body | Outfit | 300, 400, 500, 600, 700 | Body text, UI labels |
| Code | JetBrains Mono | 400, 500 | Code, technical text |

### Font Sizes

```
--fs-xs:    0.75rem  (12px)
--fs-sm:    0.875rem (14px)
--fs-base:  1rem     (16px)
--fs-lg:    1.125rem (18px)
--fs-xl:    1.25rem  (20px)
--fs-2xl:   1.5rem   (24px)
--fs-3xl:   1.875rem (30px)
--fs-4xl:   2.25rem  (36px)
```

## Colors

### Base Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-dark` | #1a1a2e | Sidebar, dark backgrounds |
| `--bg-light` | #fafafa | Main content area |
| `--bg-card` | #ffffff | Cards, modals |
| `--text-primary` | #2d3436 | Main text |
| `--text-secondary` | #636e72 | Body text, descriptions |
| `--text-muted` | #9aa3b8 | Timestamps, secondary info |
| `--border` | #e8ecf4 | Dividers, borders |

### Channel Colors

| Channel | Default | Light | Background | Glow |
|---------|---------|-------|-----------|------|
| **Aulas** | #6c5ce7 | #a29bfe | #f0eeff | rgba(108,92,231,0.3) |
| **Tarefas** | #00b894 | #55efc4 | #eafff7 | rgba(0,184,148,0.3) |
| **Fora da Aula** | #e17055 | #fab1a0 | #fff3f0 | rgba(225,112,85,0.3) |
| **Challenges** | #fdcb6e | #ffeaa7 | #fffcf0 | rgba(253,203,110,0.3) |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| Success | #00b894 | Correct answers, positive states |
| Warning | #fdcb6e | Alerts, caution states |
| Error | #e17055 | Wrong answers, destructive actions |
| Info | #0984e3 | Informational messages |

## Spacing

```
--space-1:  4px     --space-6:  24px
--space-2:  8px     --space-8:  32px
--space-3:  12px    --space-10: 40px
--space-4:  16px    --space-12: 48px
--space-5:  20px    --space-16: 64px
```

## Border Radius

```
--radius-sm:   6px    (buttons, inputs)
--radius-md:   12px   (cards)
--radius-lg:   16px   (modals)
--radius-xl:   20px   (channel cards)
--radius-full: 50%    (avatars)
```

## Shadows

```
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06)
--shadow-md: 0 4px 12px rgba(0,0,0,0.08)
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12)
--shadow-xl: 0 12px 48px rgba(0,0,0,0.16)
```

## Layout

### Sidebar (Desktop)
- Width: 240px
- Background: #1a1a2e (--bg-dark)
- Text: white / rgba(255,255,255,0.6)
- Active indicator: 3px left bar with channel color
- Hidden on screens < 768px

### Content Area
- Max-width: 1200px, centered
- Padding: 32px (desktop), 16px (mobile)
- Background: #fafafa (--bg-light)

### Mobile Navigation
- Height: 64px, fixed bottom
- 5 items equally distributed
- Appears when screen < 768px

### Breakpoints

```
--bp-sm:  480px   (mobile small)
--bp-md:  768px   (tablet / sidebar breakpoint)
--bp-lg:  1024px  (small desktop)
--bp-xl:  1200px  (desktop)
```

### Responsive Rules
- `< 768px`: sidebar hidden, mobile nav shown, grids 1 column
- `768-1024px`: sidebar slim, grids 2 columns
- `> 1024px`: full layout with sidebar

## Components

### Buttons
- **Primary**: channel-color bg, white text, radius-sm
- **Secondary**: transparent bg, 1px border channel-color, channel-color text
- **Ghost**: transparent bg, text-secondary color
- **Danger**: #e17055 bg, white text
- **3D Press Effect**: active → translateY(2px) + reduced shadow
- **Hover**: brightness(1.08) + translateY(-1px)

### Cards
- Background: white
- Border: 1px solid --border
- Border-radius: --radius-md (12px)
- Shadow: --shadow-sm
- Hover: --shadow-md + translateY(-2px) + 0.3s transition

### Form Inputs
- Background: #f8f9fb
- Border: 1px solid --border
- Border-radius: --radius-sm (6px)
- Focus: border-color → channel-color

### Pills / Tags
- Background: channel-bg (light variant)
- Text: channel-color
- Border-radius: --radius-full
- Padding: 4px 12px

### Badges (Level)
- Beginner: bg #eafff7, text #00b894
- Intermediate: bg #f0eeff, text #6c5ce7
- Advanced: bg #fff3f0, text #e17055

### Avatars
- Sizes: sm (28px), md (36px), lg (48px)
- Shape: circular (border-radius: 50%)
- Background: channel color
- Text: white uppercase initials, font-weight 600

### Mesh Gradients (Channel Cards)
- Combines radial-gradient (ellipse) + linear-gradient (135deg)
- Creates soft, glowy blend of channel colors
- Example: `radial-gradient(ellipse at 70% 30%, rgba(162,155,254,0.35) 0%, transparent 60%), linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)`

## Animations

### Easing Functions

```
--ease-default:  cubic-bezier(0.22, 1, 0.36, 1)
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-smooth:   cubic-bezier(0.22, 0.61, 0.36, 1)
```

### Timing
- Fast: 150ms
- Normal: 300ms
- Slow: 500ms

### Keyframe Animations
- `fadeIn` — opacity 0 → 1
- `slideUp` — translateY(20px) + opacity 0 → normal
- `barGrow` — scaleY(0) → scaleY(1)
- `confettiPop` — translate(random) + rotate + scale(1→0)
- `splashBounce` — scale(0→1.2→1)
- `glowPulse` — box-shadow pulsing (12px → 28px)
- `ringFill` — SVG stroke-dashoffset animation
- `pop-in` — scale(0→1.15→1) with fade
- `float-in` — translateY(12px) with fade
- `bounce-gentle` — vertical bounce (-8px at 50%)

### Stagger Pattern
- nth-child × 80ms delay per item
- Applied to lists, grids, timelines

## Special Effects

### Glass Morphism (Auth)
- `backdrop-filter: blur(8px)`
- `background: rgba(255,255,255,0.08)`
- `border: 1px solid rgba(255,255,255,0.06)`

### Glow Effects (Hover)
- `box-shadow: 0 8px 32px var(--glow-color)`
- Each channel has its own glow with 0.3-0.5 opacity

### Noise Texture (Body)
- Subtle SVG noise overlay
- `opacity: 0.025`
- `background-size: 200px`

### SVG Progress Ring
- `stroke-dasharray: 251`
- Animated via CSS variable
- `stroke-linecap: round`
- Rotated -90deg

## Iconography

- **Library**: Lucide React (outline, stroke-width 2)
- **Sizes**: 16px (inline), 18-20px (nav), 24px (actions), 28px (titles), 32px (channel cards)
- **Color**: match channel colors or text-secondary/muted
- **Emoji**: used for category badges and achievements (e.g., 🎬 🎵 📺 💡 🔥)

## Auth Layout

- Split screen: 50% brand panel + 50% form panel
- Brand panel: dark gradient background, radial gradients, noise texture, messaging
- Form panel: centered container max-w-420px
- Mobile: brand panel → 64px header bar, form → full width
