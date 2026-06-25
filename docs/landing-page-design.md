# Landing Page Design

The UIUSSC landing page uses a premium modern nonprofit and university-club visual direction tailored for United International University Social Services Club.

## Design Direction

- Warm orange primary accent: `#FF6500`
- Deep charcoal and navy structure: `#151312`, `#161B2A`
- Warm ivory/off-white backgrounds: `#FBF7F0`, `#F2EEE8`
- White content surfaces
- Positive green only for open/success states

The page avoids the previous dominant blue hero background and uses image-led storytelling with warm overlays.

## Typography

Large editorial headings use a serif-style system fallback through `.font-display`. Navigation, body text, buttons, and forms use modern system sans-serif fonts. This avoids remote font build instability.

## Section Architecture

`app/page.tsx` is intentionally small. It fetches `getHomePageData()` and composes focused sections from `components/home/`.

Sections:

1. Announcement strip
2. Hero
3. Impact snapshot
4. Introduction
5. Featured initiatives
6. Service areas
7. Event spotlight
8. Impact gallery
9. Volunteer benefits
10. Get involved
11. Collaboration CTA
12. Membership CTA

The shared navbar and footer frame the page globally.

## Dynamic Supabase Sources

`features/home/queries/getHomePageData.ts` orchestrates public Supabase data:

- published notices for announcement
- published events for initiatives, spotlight, and truthful counts
- published gallery items for imagery and gallery preview

It does not query private tables.

## Static Content

Institutional copy and local section arrays live in `features/home/content.ts`. This keeps section components focused on presentation.

## Image Strategy

`components/media/SafeImage.tsx` accepts local paths and HTTPS URLs, rejects unsafe schemes, and renders a warm premium fallback when an image is missing or fails to load.

Real UIUSSC photos can later be added to `public/` or stored as approved HTTPS URLs in Supabase gallery/event banner fields.

## Fallback Behavior

The page remains complete when public data is limited:

- no notice hides the announcement strip
- no upcoming event shows a programs-coming-soon hero card
- no image renders a warm fallback
- gallery section hides if no gallery items exist

No raw database errors are shown to users.

## Responsive Design

The landing page uses responsive grid layouts, stacked mobile CTAs, stable image heights, and a 2x2 mobile impact snapshot. It avoids horizontal overflow and keeps touch targets comfortable.

## Accessibility

The page keeps one H1, semantic sections, visible focus states, meaningful image alt text, high-contrast CTAs, keyboard-accessible links, and reduced-motion support.

## Motion

Interactions are CSS-only and restrained: card lift, image zoom inside clipped cards, hover transitions, and underline movement. `prefers-reduced-motion` is respected globally.

## Performance

Most sections are Server Components. Client Components are limited to image fallback behavior and existing interactive navigation/filtering. The homepage uses one data orchestrator to avoid repeated queries.

## SEO

Homepage metadata includes a clear title, description, and Open Graph fallback. No unofficial social handles or canonical URL are invented.

## Future Work

The next natural milestone is an authenticated admin publishing workflow so UIUSSC team members can manage homepage/event/gallery/notice content without manual database edits.
