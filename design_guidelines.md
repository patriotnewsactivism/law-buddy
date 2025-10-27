# Legal Assistant AI - Design Guidelines

## Design Approach

**Selected System: Carbon Design System (IBM) + Linear Aesthetic Influences**

This legal productivity application requires a professional, trustworthy interface optimized for complex document work and information management. Carbon Design's enterprise-grade patterns combined with Linear's refined typography create the ideal foundation for serious legal work.

**Core Principles:**
- Professional credibility through clean, consistent design
- Information clarity for dense legal content
- Efficient workflows for document creation and case management
- Distraction-free environment for focused legal work

---

## Typography System

**Font Families:**
- Primary: Inter (400, 500, 600, 700) - UI elements, body text
- Monospace: JetBrains Mono (400, 500) - legal citations, document metadata

**Type Scale:**
- H1: 2.25rem (36px), font-weight 700, line-height 1.2 - Page titles
- H2: 1.875rem (30px), font-weight 600, line-height 1.3 - Section headers  
- H3: 1.5rem (24px), font-weight 600, line-height 1.4 - Subsection headers
- H4: 1.25rem (20px), font-weight 600, line-height 1.5 - Card titles
- Body Large: 1rem (16px), font-weight 400, line-height 1.6 - Primary content
- Body: 0.875rem (14px), font-weight 400, line-height 1.5 - Secondary content
- Caption: 0.75rem (12px), font-weight 500, line-height 1.4 - Labels, metadata

**Legal Document Formatting** (for generated documents):
- Document Title: 20pt, centered, bold
- H1 Headers: 20pt, centered, bold
- H2 Headers: 18pt, centered, bold  
- H3 Headers: 16pt, left-justified, bold
- Body Text: 14pt, double-spaced (line-height 2.0)

---

## Layout System

**Spacing Scale:** Use Tailwind units 1, 2, 3, 4, 6, 8, 12, 16, 20, 24
- Tight spacing: 1-2 units (buttons, inline elements)
- Standard spacing: 4-6 units (card padding, form fields)
- Section spacing: 8-12 units (component separation)
- Page spacing: 16-24 units (major sections)

**Grid Structure:**
- Main navigation: Fixed sidebar 280px (18rem) width
- Content area: Flexible with max-width constraints
- Dashboard: 12-column grid for widgets and cards
- Document editor: Single column, max-w-4xl for optimal reading
- Case list: Two-column on large screens, stacked on mobile

**Container Strategy:**
- Full-width layouts: w-full with inner max-w-7xl
- Content sections: max-w-6xl  
- Document editing: max-w-4xl (optimal for legal text)
- Forms: max-w-2xl

---

## Component Library

### Navigation
**Primary Sidebar:**
- Fixed left sidebar with hierarchical navigation
- Top section: Logo, user profile dropdown
- Main nav: Dashboard, Cases, Documents, Calendar, Research, Chat
- Each nav item: Icon + label, hover/active states
- Case selector dropdown within sidebar for quick switching
- Bottom section: Settings, help resources

**Secondary Navigation:**
- Breadcrumb trail for deep navigation paths
- Tab navigation for multi-view pages (Case Details: Overview, Documents, Timeline, Research)

### Dashboard Components
**Case Overview Cards:**
- Card layout with elevated shadow (shadow-md)
- Header: Case name, status badge, quick actions menu
- Body: Key dates, recent activity, next deadline
- Footer: View details link

**Deadline Tracker Widget:**
- Timeline visualization with date markers
- Color-coded urgency (upcoming: amber, overdue: red, completed: green)
- List view toggle option
- Quick add deadline button

**Recent Activity Feed:**
- Chronological list with timestamps
- Activity types: document uploaded, deadline added, chat interaction
- Avatar icons for activity types

### Document Management
**Document List View:**
- Table layout with sortable columns: Name, Type, Date Modified, Size
- Filter bar: Document type, date range, tags
- Search with real-time filtering
- Bulk actions: download, organize, delete
- Upload zone: drag-and-drop area with file type indicators

**Document Viewer/Editor:**
- Split view option: source document left, AI-generated output right
- Formatting toolbar: styles, alignment, compliance checker button
- Metadata panel: parties, jurisdiction, case number, filing date
- Version history sidebar
- AI suggestions panel (collapsible)

### AI Chat Interface
**Chat Window:**
- Clean message thread layout
- User messages: right-aligned with distinct styling
- AI responses: left-aligned with source citations in expandable sections
- Code blocks for legal citations with copy button
- Suggested follow-up questions as clickable chips
- Input area: multiline textarea with send button, attachment option

**Context Panel:**
- Shows active case context
- Relevant documents loaded into conversation
- Jurisdiction indicator

### Forms & Input Elements
**Standard Forms:**
- Consistent label positioning (top-aligned)
- Input fields: border-2, rounded-md, focus states with ring
- Helper text below inputs in smaller font
- Required field indicators
- Inline validation messages

**Document Generation Form:**
- Multi-step wizard layout with progress indicator
- Section headers with completion checkmarks
- Party information fields with autocomplete from case data
- Jurisdiction selector with court-specific rule hints
- Template preview panel (live update)

**Compliance Checker:**
- Document upload or paste area
- Analysis results in expandable sections
- Pass/fail indicators with specific rule citations
- Suggested improvements with accept/reject actions
- Export report button

### Calendar & Deadlines
**Calendar View:**
- Month/week/day view toggle
- Color-coded event types: hearings (blue), filing deadlines (amber), responses (green)
- Click-to-add deadline functionality
- Case filter to show/hide events by case
- Agenda list sidebar for upcoming items

**Deadline Detail Modal:**
- Title, date/time, case association
- Description field
- Reminder settings (email, in-app)
- Related documents section
- Delete/edit actions

### Case Organization
**Case Dashboard:**
- Hero section: Case title, parties, status, jurisdiction
- Quick stats: document count, upcoming deadlines, days active
- Tabbed sections: Documents, Timeline, Research Notes, Deadlines
- Action buttons: Generate Document, Add Note, Upload File

**Timeline View:**
- Vertical timeline with event markers
- Filterable by event type: filings, hearings, communications
- Expandable events with full details
- Add custom events

---

## Visual Patterns

**Elevation & Depth:**
- Cards: shadow-sm for subtle elevation
- Modals/Dialogs: shadow-xl for prominence
- Dropdowns: shadow-lg
- Navigation: border-r for separation without shadow

**Borders & Dividers:**
- Card borders: border with subtle dividers
- Section dividers: border-t or border-b
- Input borders: border-2 for emphasis

**Iconography:**
- Use Heroicons throughout for consistency
- 20px (1.25rem) for nav and buttons
- 16px (1rem) for inline text icons
- 24px (1.5rem) for section headers

**Badges & Status Indicators:**
- Rounded badges (rounded-full px-3 py-1)
- Status: Active (green), Pending (amber), Closed (gray)
- Document types: Complaint (blue), Motion (purple), Response (teal)

**Interactive States:**
- Hover: subtle opacity/background change
- Active/Selected: border accent or background fill
- Focus: ring-2 with offset
- Disabled: opacity-50 with cursor-not-allowed

---

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px - Stack all columns, collapsible sidebar
- Tablet: 768px-1024px - Two-column layouts, persistent sidebar
- Desktop: > 1024px - Full multi-column layouts, fixed sidebar

**Mobile Adaptations:**
- Sidebar becomes overlay drawer (hamburger toggle)
- Document editor: full-width with collapsible panels
- Calendar: Default to agenda list view
- Tables: Card layout for document lists

---

## Animations

Use sparingly and purposefully:
- Sidebar toggle: transform duration-200
- Modal entry: fade + scale, duration-300
- Dropdown menus: slide down, duration-150
- Toast notifications: slide in from top-right
- No scroll-based animations
- No decorative animations in work areas

---

## Accessibility

- Minimum touch target: 44x44px for all interactive elements
- Keyboard navigation: full support with visible focus indicators
- ARIA labels for icon-only buttons
- Semantic HTML structure
- Skip links for sidebar navigation
- Screen reader announcements for AI responses and deadline alerts
- High contrast mode support
- Consistent tab order throughout forms

---

## Images

**No hero images.** This is a professional productivity tool focused on functionality over aesthetics.

**Contextual imagery:**
- Empty states: Subtle illustrations for no documents, no cases, no deadlines
- Onboarding: Step-by-step screenshots in tutorial modals
- Help documentation: Annotated UI screenshots