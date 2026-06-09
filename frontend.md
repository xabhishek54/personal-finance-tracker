# Personal Finance Tracker — Feature Specification & Frontend Design Blueprint

---

## Part 1: Product & Feature Specifications

### 1. Overview

A personal finance tracking application designed to help users log, categorize, and analyze their spending—with both manual and automated entry, monthly budgeting, insightful stats, Excel export, and a clean, ultra-responsive modern UI.

---

### 2. Transaction Management

#### 2.1 Manual Entry

Users can manually log a transaction by filling in the following fields:

- Amount — Enter the money spent or received (supports ₹ INR / Local Currency)
- Date — Defaults to today; can be changed to a past date
- Category — Choose from a predefined list:
  - Food & Dining
  - Transport
  - Shopping
  - Entertainment
  - Health & Medical
  - Rent & Utilities
  - Education
  - Subscriptions
  - Lending / Given to Someone
  - Miscellaneous
- Recipient / Merchant — Free-text field (e.g., "Zomato", "Rahul", "Big Bazaar")
- Transaction Type — Toggle between:
  - Expense (money going out)
  - Income (money coming in)
  - Lend / Borrow (track money given or received from someone)
- Payment Method — Cash / UPI / Card / Net Banking
- Note — Optional short description

#### 2.2 Auto Entry (Google Pay / Bank Integration)

Because standard wallet apps do not offer public transaction APIs, automation follows a 3-tier approach:

- SMS Parsing (Primary Method) — Automatically read incoming UPI/bank SMS notifications to extract transaction amount, merchant, and date. Works seamlessly on Android via background SMS listening services.
- Statement Import — Users can download their transaction history (CSV/PDF from bank or Google Takeout) and upload it for bulk processing.
- Email Parsing (Secondary Method) — Process transaction confirmation emails from connected accounts via secure OAuth integrations.

Note: All auto-imported transactions are held in a Review Queue where the user can confirm, edit category, or delete before saving.

---

### 3. Budget Management

#### 3.1 Monthly Budget Setup

- Set an overall monthly spending limit (e.g., ₹15,000/month).
- Set per-category allowances (e.g., Food: ₹3,000 | Transport: ₹1,500).
- Automatic budget resets on the first calendar day of the month.
- Optional configuration to carry over remaining balances into the next cycle.

#### 3.2 Budget Tracking

- Visual progress meters for each configured category showing spent vs. allocated funds.
- Semantic Color Codes:
  - Green — Under 70% of budget used
  - Yellow — 70–90% used (approaching ceiling)
  - Red — Over 90% or exceeded
- Trigger system notifications/warnings when a category touches 80%.

---

### 4. Statistics & Analytics

#### 4.1 Spending Overview

- Current monthly totals with dynamic, relative comparison indicators (e.g., "₹12,450 spent this month — ↑12% higher than last month" or "↓8% lower").
- Running calculation of daily average burn rates.
- Isolation of the highest spending single-day spike of the month.

#### 4.2 Breakdown & Trends

- High-contrast graphical views showing category weights.
- Historical charting (6-to-12 month trends) plotting income versus expense profiles across line or comparative bar intervals.
- Smart Insights (Auto-generated text) — "You spent 40% more on Food this month compared to last month", "Your total savings this month: ₹4,200."

---

### 5. Data & Portability

- Local-First Architecture: Core database sits on-device for instantaneous, offline tracking.
- Cloud Synchronization: Secure, authenticated manual or scheduled backups to the user's private Google Drive storage.
- Excel Export Structure:
  - Sheet 1 (All Transactions): Raw logs containing Date, Category, Recipient, Amount, Type, and Method.
  - Sheet 2 (Monthly Summaries): High-level view showing month-by-month Income, Expense, Savings, and Top Category.
  - Sheet 3 (Category Breakdown): Comparative breakdown detailing Category Name, Total Spent, Budget Target, and Remaining Overhead.

---

## Part 2: Front-End Architecture & UI/UX Implementation Plan

### 6. Architectural Strategy & Performance Optimization

To deliver a premium, fluid, and highly responsive user interface that functions flawlessly across both mobile and desktop views, the frontend architecture must prioritize performance, rendering optimization, and immediate visual feedback. Below is the blueprint for a fast, non-stucky, frame-rate-optimized implementation.

#### 6.1 Framework Selection & Layout Paradigm

- Unified Hybrid Paradigm: Built using React Native (with Expo) targeting Mobile (iOS/Android) or React (Vite) + Tailwind CSS targeting a Mobile-First Web Application. This specification focuses on a highly optimized web/hybrid implementation using utility-first styling for instant layout recalculations.
- Layout Model: Single-page app architecture using CSS Flexbox and Grid layouts. Deeply nested layout wrappers must be avoided to keep layout paint times near zero during complex data operations.
- Responsive Breakpoints:
  - Mobile-First Core: Base styles target less than 640px (Compact, Touch-Optimized Bottom Sheets).
  - Tablet Layout: sm (640px) to md (1024px) (Dual-column layout, sidebar transitions).
  - Desktop Layout: lg (1024px) and above (Multi-column dashboard with fixed navigation rails).

#### 6.2 Rendering & State Management for Speed

- Zero Jank State Updates: Use lightweight, reactive global state stores like Zustand or Signals rather than heavy context providers. This guarantees that updating a transaction in a list only re-renders that specific list item, leaving the global navigation and charts untouched.
- Virtualization for Long Lists: Transaction histories can scale to thousands of records. Standard mapping will drop frames. Implement a virtualized list container (such as react-window or @tanstack/react-virtual) ensuring only visible rows (plus a small buffer) exist in the DOM at any given moment.
- Computed Value Memoization: Heavy budget allocations, totals, and historical comparison percentages must be aggressively cached using memoized selectors (useMemo in React). Re-computations should run strictly when the primitive transaction array updates.

#### 6.3 Framerate Preservation Rules

- CSS GPU Acceleration: Force Hardware Acceleration on all moving UI items (modals, sliders, bars) using transform: translate3d(0,0,0) or will-change: transform, opacity.
- Debounced Interaction: Real-time search inputs inside the transaction log must be debounced by 150ms to prevent UI freezing during typing.
- Chart Performance: Use raw SVG elements or low-overhead canvases (Recharts built on SVG or Chart.js via Canvas). Disable default heavy entry path animations for large datasets; use clean, single-frame opacity fades instead.

---

### 7. Refined Design System & Theme Engine

To make this application feel elite, premium, and distinct, we are shifting from a generic off-black or pure-black scheme to a luxurious, high-contrast Deep Velvet & Ultraviolet theme. It uses deep, dark blue-grey tones that prevent screen glare, paired with vibrant neon accents for clear data visualization.

#### 7.1 The Ultraviolet Color Palette

- Primary Canvas (--bg-space): #0B0E14 | Main screen background (pure depth)
- Surface Elev. 1 (--bg-surface): #161B26 | Feature cards, navigation rails, containers
- Surface Elev. 2 (--bg-surface-lit): #222938 | Active states, hover states, input fields
- Accent Primary (--accent-violet): #7C3AED | Primary buttons, active tabs, brand highlights
- Accent Glow (--accent-glow): rgba(124, 58, 237, 0.15) | Background radial gradients for cards
- Text Primary (--text-main): #F9FAFB | Primary headers, transaction numbers
- Text Secondary (--text-muted): #9CA3AF | Labels, dates, optional notes, categories
- Status Safe (--status-green): #10B981 | Income, budgets under 70%, green indicators
- Status Caution (--status-yellow): #F59E0B | Budgets at 70%-90%, pending reviews
- Status Danger (--status-red): #EF4444 | Expense, budgets exceeded (>90%), alerts

#### 7.2 Light Mode Alternative (Dynamic Fallback)

When light mode is toggled, the application uses a clean, editorial Soft Alabaster & Indigo palette:

- --bg-space: #F8FAFC (Cool slate-white)
- --bg-surface: #FFFFFF (Pure white cards with subtle #E2E8F0 borders)
- --text-main: #0F172A (Deep navy-slate text)
- --accent-violet: #6366F1 (Indigo core)

#### 7.3 Typography Specs

- Font Scale: Use a clean, modern sans-serif stack system (Inter, System UI).
- Display Weights: Numbers and currency formats use tabular figures (font-variant-numeric: tabular-nums) to ensure that changing numerical columns don't shift text fields horizontally during animations.

---

### 8. High-Performance Motion & Transition Guideline

To prevent the application from feeling "stucky" or laggy, avoid using long animations. Motion should be structural, organic, and ultra-fast. All transition durations are capped between 150ms and 250ms using standard cubic-bezier functions.

#### 8.1 Global Micro-Interaction Specifications

##### 1. Page Transitions (Shared Layout Axes)

- Behavior: When transitioning between the Dashboard, Logs, and Budgets, avoid full-page slide animations which cause layout delays on weaker mobile devices. Instead, use a localized opacity cross-fade accompanied by a tiny vertical translation.
- Specifications: Set page-enter to opacity 0 with a translateY of 6px. Set page-enter-active to opacity 1, translateY of 0, with a transition duration of 180ms ease-out, and transform matching cubic-bezier(0.16, 1, 0.3, 1).

##### 2. Action Sheet / Bottom Modal (Add Transaction)

- Behavior: Rises instantly from the bottom of the screen on mobile, or transforms outwards from a central card context on desktop. Must lock layout scroll beneath it instantly.
- Specifications: The modal-sheet container utilizes a transform transition set at 220ms with a cubic-bezier(0.32, 0.94, 0.6, 1) curve for an elastic, crisp arrival.

##### 3. Budget Progress Bar Fill Transitions

- Behavior: When loading a page or updating an expense, the progress bar should smoothly animate its growth from left to right. If a transaction causes a category to break past its budget ceiling, the bar expands past 100%, momentarily flashes white, then transitions cleanly from Green/Yellow into a saturated Red pulsing state.
- Specifications: The progress-fill class transitions width at 400ms using cubic-bezier(0.4, 0, 0.2, 1) and background-color over 200ms ease.

##### 4. Swipe-to-Action Gestures (List Rows)

- Behavior: In the Review Queue or Transaction Log, swiping left reveals the Delete/Ignore actions, and swiping right reveals the Confirm/Categorize actions.
- Implementation: The row component follows the touch coordinate 1:1. Upon release, if the swipe threshold passes 35%, it completes the action using an accelerated spring model. The remaining list rows then slide up into the vacated slot using CSS transitions, preventing any blank layouts.

---

### 9. Layout & Screen-by-Screen Frontend Specification

#### 9.1 Master App Layout Shell

- Desktop (>=1024px): Fixed left navigation rail (width: 64), showcasing a crisp micro-logo, primary tab actions, an account switcher, and a prominent persistent floating action button (FAB) for "Add Transaction".
- Mobile (<1024px): Sticky bottom navigation bar with a glassmorphism blur effect (backdrop-filter: blur(12px) over a semi-transparent surface). The central position is reserved for an oversized violet dynamic action button.

#### 9.2 Dashboard Screen

- Premium Header Component: Display a friendly greeting, your real-time total monthly balance, and a dynamic alert icon that pulses subtle amber if any budget categories are exceeding 80%.
- Summary Card Row (Grid: 1 col on Mobile, 3 cols on Desktop):
  - Total Expense Card: Displays big, legible numbers with tabular spacing. It shows a small percentage label (e.g., ↑12% higher than last month). If the change is negative, it automatically shifts to an emerald green theme (↓8% lower).
  - Active Savings Card: Displays income minus expenses with an interactive micro-line spark chart nestled cleanly in the card background.
  - Budget Status Tracker: Shows a clean circular radial ring summarizing overall monthly allowance used.
- Review Queue Container (Conditional Render): If transactions are parsed via SMS or statement imports, a dynamic, high-priority carousel card slides in from the top of the dashboard. Each item showcases parsed parameters: "₹450 spent at Zomato. Classify as Food & Dining?" Includes two quick-tap check/cross buttons, enabling rapid data cleaning with zero navigation overhead.

#### 9.3 Transaction Log (Advanced Data Explorer)

- Header Toolbar: Sticky layout containing an expansive search input, a multi-select category dropdown pill container, and a time-range slice mechanism (Today, Week, Month, Custom).
- Virtualized Transaction Feed: Rows are neatly grouped under explicit date headers (e.g., "Today — June 2, 2026").
- Row Component Grid Structure:
  - Left Section: Circular high-contrast icon wrapper colored based on category type (e.g., Deep gold fork and knife for Food, bright purple tag for Subscriptions).
  - Center Section: Bold merchant name as the primary label; small gray subtitle below displaying the payment channel (e.g., "GPay • Axis Bank") and notes.
  - Right Section: Large font currency value. Income fields are prepended with "+" and colored green; expenses are plain text with standard dark values or red accents depending on layout preferences.

#### 9.4 Budget & Analytics Workbench

- Inline Budget Configuration Page: Lists categories as wide actionable rows. Instead of opening full configurations to modify numbers, users can click an inline target value, instantly transforming it into an active, numeric input field with automatic focus. Every adjustment instantly recalculates the visual progress bar right beneath it, ensuring zero-latency feedback loops.
- Analytics Visualization Strategy:
  - Distribution View: A beautiful central Donut Chart featuring clear, high-contrast slices. Tapping an individual slice isolates that specific slice, scaling it outward by 4px, and triggering a cascading filter on the transaction sub-list displayed directly beneath it.
  - Macro Trends: A beautiful dual-axis comparative Bar Chart showcasing Income vs Expenses across a rolling 6-month window. Keep bar tooltips light and performance-optimized, floating seamlessly without delaying mouse track speeds.

---

### 10. Form Design, Form Fields, & Interactive Elements

The core of a highly performant transactional app resides in its input fields. If entering data feels slow or tedious, user retention drops. The "Add Transaction" screen is rebuilt into an ultra-fast data entry sheet.

#### 10.1 The "Super-Fast" Bottom Input Sheet

- On mobile layouts, the trigger pops open a sleek bottom sheet extending to roughly 85% view height.
- Auto-focus is assigned instantly to the Amount Input, bypassing the need for manual text box initialization taps.

#### 10.2 Field-by-Field Interaction Blueprint

- The Amount Entry Canvas: Features large display numbers centered on the screen, accompanied by a clean currency indicator (₹). Optimization: Text sizes responsively shrink as numbers scale upwards to prevent layout breaks on narrow phone screens (font-size shifts from 32pt to 24pt if values exceed six figures).
- Transaction Type Switcher: A structural segment switcher container (Expense / Income / Lend). Avoid checkbox controls. Use a sliding background pill container that glides horizontally to frame the selected active element with smooth physics.
- Predefined Category Grid: Rendered as a wide, scrollable item array on mobile or a grid block on web layouts. Tapping a selection changes its background color into a rich accent hue and adds a clear bounding outline. If the current selected state is "Income", irrelevant category chips like "Rent & Utilities" or "Subscriptions" are automatically hidden with a quick fade-out, keeping your workflow clean and focused.
- Recipient / Merchant Field (Smart Autocomplete): A text entry input connected to a lightweight local filter system. As the user types "Zo", a compact floating list surfaces below ("Zomato", "Zomato Gold"). Clicking an item instantly updates the input field and auto-assigns its primary category to "Food & Dining", saving three additional manual taps.
- Payment Method & Date Selection Selector: Set up as a horizontal row of quick-toggle tags: Cash, UPI, Card. The date defaults to a bold text tag stating "Today". Clicking it displays an elegant, inline overlay calendar modal.

---

### 11. Implementation Checklist & Progress Metrics

To ensure development maintains a strict focus on front-end rendering performance, all execution phases must meet the following performance metrics:

- [ ] Phase 1: Base Shell Architecture — Setup utility-first layout frameworks, establish structural dark-mode CSS tokens, and implement base multi-column and bottom navigation systems.
- [ ] Phase 2: Input Sheet & Form UX — Code the fast-entry amount container, integrate autocomplete merchant engines, and implement sliding segmented toggles.
- [ ] Phase 3: List Virtualization Setup — Integrate high-efficiency infinite scroll feeds for logs, build swipe-to-action animations, and confirm frame rates maintain a steady 60fps during rapid scrolling.
- [ ] Phase 4: Analytics Integration — Draw canvas or responsive SVG donut layers, map active selection states, and ensure fluid transitions across layouts.
- [ ] Phase 5: Performance & Network Auditing — Guarantee application bundle footprints remain highly optimized, confirm transitions never drop frames on standard hardware, and verify light/dark themes scale flawlessly across all screens.
