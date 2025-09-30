# Commonly App Design System

## Visual Identity

Commonly follows a **clean, minimalist black and white design system** that emphasizes clarity, professionalism, and accessibility.

## Core Design Principles

1. **Minimalism**: Clean, uncluttered interfaces
2. **Accessibility**: High contrast for readability
3. **Consistency**: Uniform styling across all pages
4. **Professional**: Business-appropriate aesthetic
5. **Scalability**: Works across all device sizes

## Color System

### Primary Colors
```css
/* Based on index.css CSS custom properties */
--primary: 0 0% 0%;                 /* Pure black */
--primary-foreground: 0 0% 100%;    /* Pure white */
--foreground: 0 0% 0%;              /* Pure black text */
--background: 0 0% 100%;            /* Pure white background */
```

### Secondary Colors
```css
--secondary: 0 0% 96%;              /* Light gray backgrounds */
--secondary-foreground: 0 0% 0%;    /* Black text on gray */
--muted: 0 0% 96%;                  /* Muted backgrounds */
--muted-foreground: 0 0% 45%;       /* Gray text */
--accent: 0 0% 96%;                 /* Accent backgrounds */
--accent-foreground: 0 0% 0%;       /* Black text on accents */
```

### Utility Colors
```css
--border: 0 0% 90%;                 /* Light borders */
--input: 0 0% 85%;                  /* Input backgrounds */
--ring: 0 0% 70%;                   /* Focus rings */
--card: 0 0% 100%;                  /* Card backgrounds */
--popover: 0 0% 100%;              /* Popover backgrounds */
```

### Error States
```css
--destructive: 0 84% 60%;           /* Red for errors/destructive actions */
--destructive-foreground: 0 0% 100%; /* White text on red */
```

## Typography

### Font Family
- **Primary**: `font-sans` (system font stack)
- **Headings**: `font-medium tracking-tight` for h1-h6

### Font Weights
- **Regular**: `font-normal` (400)
- **Medium**: `font-medium` (500) - for headings
- **Semibold**: `font-semibold` (600) - for emphasis
- **Bold**: `font-bold` (700) - for strong emphasis

### Font Sizes
- **Hero**: `text-4xl md:text-6xl` (display text)
- **H1**: `text-3xl md:text-4xl`
- **H2**: `text-2xl md:text-3xl`
- **H3**: `text-xl md:text-2xl`
- **Body**: `text-base` (default)
- **Small**: `text-sm`
- **Extra Small**: `text-xs`

## Component Guidelines

### Buttons

#### Primary Button (Default)
```jsx
<Button>Primary Action</Button>
// Results in: bg-primary text-primary-foreground hover:bg-primary/90
```

#### Secondary Button
```jsx
<Button variant="secondary">Secondary Action</Button>
// Results in: bg-secondary text-secondary-foreground hover:bg-secondary/80
```

#### Outline Button
```jsx
<Button variant="outline">Outlined Action</Button>
// Results in: border border-input bg-background hover:bg-accent
```

#### Ghost Button
```jsx
<Button variant="ghost">Ghost Action</Button>
// Results in: hover:bg-accent hover:text-accent-foreground
```

### Cards
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Status Indicators

#### Success States
- Use semantic meaning, not color
- Example: `<CheckCircle className="h-4 w-4" />` with descriptive text

#### Loading States
- Use primary color: `text-primary` or `text-muted-foreground`

#### Error States
- Use `destructive` variant: `text-destructive`

## Layout Patterns

### Page Structure
```jsx
<div className="min-h-screen bg-background">
  <Header />
  <main className="flex-1">
    <section className="py-16 container px-4">
      {/* Content */}
    </section>
  </main>
  <Footer />
</div>
```

### Hero Sections
```jsx
<section className="py-24 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
  <div className="container px-4">
    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
      Hero Title
    </h1>
    <p className="text-xl text-muted-foreground mb-8">
      Hero description
    </p>
  </div>
</section>
```

### Content Sections
```jsx
<section className="py-16 container px-4">
  <div className="text-center mb-12">
    <h2 className="text-3xl font-bold mb-4">Section Title</h2>
    <p className="text-xl text-muted-foreground">Section description</p>
  </div>
  {/* Section content */}
</section>
```

## Interactive Elements

### Hover Effects
- Cards: `hover:shadow-lg transition-all duration-300`
- Buttons: Built into component variants
- Links: `hover:text-accent-foreground`

### Focus States
- Use `focus-visible:ring-2 focus-visible:ring-ring`
- Built into form components

### Transitions
- Standard: `transition-all duration-300`
- Quick: `transition-colors`
- Smooth: `transition-all duration-500`

## Data Visualization

### Charts & Graphs
- Use black/white/gray scale only
- Differentiate with patterns, textures, or shapes
- Example: `stroke-primary`, `fill-primary/20`

### Progress Indicators
```jsx
<Progress value={75} className="h-2" />
// Uses primary color automatically
```

### Status Badges
```jsx
<Badge variant="default">Status</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

## Icons

### Icon Library
- **Primary**: Lucide React icons
- **Size**: `h-4 w-4` (16px) standard, `h-5 w-5` (20px) for emphasis
- **Color**: `text-primary`, `text-muted-foreground`, or inherit

### Usage
```jsx
<User className="h-4 w-4 text-muted-foreground" />
<Settings className="h-5 w-5 text-primary" />
```

## Forms

### Form Fields
```jsx
<div className="space-y-4">
  <div>
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" placeholder="Placeholder text" />
  </div>
</div>
```

### Form Validation
- Errors: Use `destructive` colors
- Success: Use descriptive text with checkmark icon
- Focus: Built into components

## Responsive Design

### Breakpoints
- `sm:` 640px and up
- `md:` 768px and up
- `lg:` 1024px and up
- `xl:` 1280px and up

### Mobile-First Approach
- Start with mobile styles
- Enhance with larger breakpoint styles
- Ensure touch targets are 44px minimum

## Spacing System

### Padding/Margin Scale
- `p-1` = 4px
- `p-2` = 8px
- `p-4` = 16px (standard)
- `p-6` = 24px
- `p-8` = 32px
- `p-12` = 48px

### Section Spacing
- Small sections: `py-8`
- Standard sections: `py-16`
- Hero sections: `py-24 md:py-32`

## Accessibility

### Contrast Ratios
- Primary text on background: 21:1 (AAA)
- Muted text on background: 7:1 (AA+)

### Focus Indicators
- Visible focus rings on all interactive elements
- Keyboard navigation support

### Screen Reader Support
- Semantic HTML elements
- Proper ARIA labels where needed
- Alt text for images

## DON'T Use These Colors

❌ **Avoid these colors entirely:**
- Orange: `orange-*`
- Blue: `blue-*`
- Green: `green-*` (except for destructive/error states)
- Red: `red-*` (except for destructive states via CSS variables)
- Purple: `purple-*`
- Yellow: `yellow-*`
- Pink: `pink-*`
- Indigo: `indigo-*`

❌ **Avoid color-based status indication:**
- Don't use green for success
- Don't use red for errors (use `destructive` CSS variable)
- Don't use yellow for warnings
- Use descriptive text and icons instead

## Implementation Checklist

When creating or updating pages:

- [ ] Use `bg-background` for page backgrounds
- [ ] Use `text-foreground` for primary text
- [ ] Use `text-muted-foreground` for secondary text
- [ ] Use `bg-primary` and `text-primary-foreground` for primary actions
- [ ] Use `bg-secondary` for subtle backgrounds
- [ ] Use proper button variants
- [ ] Include hover and focus states
- [ ] Ensure mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Verify high contrast accessibility
- [ ] No brand colors outside the approved palette

## Examples of Correct Usage

### Hero Section
```jsx
<section className="py-24 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
  <div className="container px-4">
    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
      Welcome to Commonly
    </h1>
    <p className="text-xl text-muted-foreground mb-8">
      The platform for creators and communities
    </p>
    <Button size="lg">Get Started</Button>
  </div>
</section>
```

### Feature Cards
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  <Card className="hover:shadow-lg transition-all duration-300">
    <CardHeader>
      <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Star className="h-6 w-6 text-primary" />
      </div>
      <CardTitle>Feature Title</CardTitle>
      <CardDescription>Feature description</CardDescription>
    </CardHeader>
  </Card>
</div>
```

This design system ensures consistency, accessibility, and professional appearance across all pages while maintaining the clean, minimalist aesthetic that defines Commonly's visual identity.