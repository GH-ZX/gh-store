# GH-Store — Design System & UI Guidelines

## Purpose

This document defines the visual identity, design language, UX principles, and UI rules for GH-Store.

These rules are mandatory.

Never ignore them.

Never replace them with personal preferences.

All future UI decisions must follow this document.

---

# Design Philosophy

The interface must feel:

- Premium
- Minimal
- Modern
- Fast
- Trustworthy
- Mobile-first
- Arabic-native
- Clean
- Elegant

The experience should feel closer to a premium Apple product than a traditional ecommerce website.

Users should immediately feel that the platform is professional, secure, and high-quality.

---

# Design Inspiration

Take inspiration from:

- Apple
- Steam
- Linear
- Vercel
- Stripe
- Arc Browser
- Discord
- Raycast
- Codashop

Do NOT clone any existing website.

Instead, combine the best design ideas into an original visual identity.

---

# Overall Style

Avoid:

- Cheap gradients
- Heavy shadows
- Busy layouts
- Visual clutter
- Random colors
- Large borders
- Outdated ecommerce layouts

Prefer:

- Soft surfaces
- Premium spacing
- High-quality typography
- Large breathing space
- Elegant cards
- Smooth animations
- Rounded corners
- Excellent readability

---

# Mobile First

Design for mobile first.

Desktop layouts must be an enhancement of the mobile experience.

Every page must work perfectly on:

- Mobile
- Tablet
- Laptop
- Desktop
- Ultra-wide displays

---

# RTL

Arabic is the primary language.

The entire UI must be designed for RTL.

Never mirror layouts incorrectly.

Icons and navigation should remain visually natural.

Support LTR for future English localization.

---

# Typography

Typography must be one of the strongest parts of the design.

Requirements:

- Clear hierarchy
- Excellent readability
- Comfortable spacing
- Large headings
- Compact body text

Avoid decorative fonts.

Use modern geometric fonts.

---

# Color System

Create a professional color palette.

Requirements:

- Primary
- Secondary
- Accent
- Success
- Warning
- Error
- Background
- Surface
- Border
- Text Primary
- Text Secondary

Colors must be consistent across the entire application.

Never use random colors.

---

# Theme System

Implement five premium themes.

Examples:

- Midnight
- Ocean
- Emerald
- Crimson
- Graphite

Each theme must define:

- Primary colors
- Surface colors
- Background
- Cards
- Buttons
- Links
- Charts
- Notifications

Themes are switchable from the Admin Dashboard.

No code changes required.

---

# Components

Before building pages, create reusable UI components.

Required components:

Buttons

Cards

Inputs

Dropdowns

Select

Checkbox

Radio

Badges

Tags

Tables

Dialogs

Modals

Toasts

Alerts

Accordions

Tabs

Pagination

Breadcrumb

Navbar

Sidebar

Footer

Skeleton Loader

Empty State

Loading Spinner

Every component must follow the same design language.

---

# Cards

Cards are the primary UI element.

Requirements:

- Soft shadows
- Rounded corners
- Comfortable padding
- Clear hierarchy
- Hover animation
- Clean spacing

Avoid noisy borders.

---

# Buttons

Buttons must be:

- Large enough for touch devices
- Highly readable
- Consistent
- Accessible

Support:

Primary

Secondary

Ghost

Outline

Danger

Success

Loading State

Disabled State

---

# Forms

Forms must be simple.

Requirements:

Large inputs

Clear labels

Validation

Helpful error messages

Keyboard friendly

Mobile friendly

---

# Animations

Animations must be subtle.

Duration:

150ms–250ms

Use animations only to improve usability.

Avoid flashy effects.

Support:

Hover

Focus

Open

Close

Loading

Page transitions

Micro interactions

---

# Icons

Use one icon library consistently.

Icons must:

- Be simple
- Match typography
- Have consistent sizing

Avoid mixing icon styles.

---

# Images

Images should have:

High quality

Rounded corners

Lazy loading

Responsive sizing

Optimized loading

---

# Product Cards

Every product card should display:

Image

Title

Provider

Category

Price

Discount (if available)

Rating (optional)

Stock Status

Quick Buy Button

Wishlist Button

Hover animation

---

# Checkout

Checkout must feel effortless.

Maximum simplicity.

Minimum number of steps.

Support:

Wallet

SAM Payment

Future payment providers

---

# Dashboard

Dashboard must look like a premium SaaS product.

Requirements:

Clean Sidebar

Modern Topbar

Cards

Charts

Tables

Filters

Search

Responsive Layout

Fast Navigation

---

# Data Tables

Support:

Sorting

Filtering

Searching

Pagination

Bulk Actions

Responsive Mode

---

# Accessibility

Support:

Keyboard navigation

Focus indicators

ARIA attributes

High contrast

Readable font sizes

Accessible colors

---

# Performance

Prioritize:

Fast loading

Code splitting

Lazy loading

Optimized images

Minimal JavaScript

Excellent Lighthouse scores

---

# Empty States

Every page must include beautiful empty states.

Never leave blank screens.

---

# Error States

Every possible error must have:

Friendly message

Recovery action

Retry button

---

# Loading States

Every async action must have:

Skeleton loading

Progress indicator

Optimistic UI when appropriate

---

# Notifications

Support:

Success

Warning

Error

Information

Notifications should never interrupt the user unnecessarily.

---

# Design Consistency

Spacing

Typography

Radius

Shadows

Animations

Colors

Icons

Components

...must remain consistent across the entire application.

No page should look like it belongs to another project.

---

# UX Principles

The interface should always prioritize:

Clarity

Speed

Simplicity

Trust

Consistency

Accessibility

Responsiveness

Professionalism

Never sacrifice usability for visual effects.

---

# Final Rule

Whenever a new page or component is created, first verify that it follows every rule in this document.

If a design decision conflicts with this Design System, the Design System always takes priority.

Never generate UI that violates these rules.