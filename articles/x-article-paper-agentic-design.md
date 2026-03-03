# X Article Draft: Agentic Design Interfaces

> **Publishing format:** X Article (long-form, rich formatting)
> **Companion:** 5-7 tweet thread summarizing key points with link to full article
> **Target audience:** Developers, designers, indie hackers, AI tool enthusiasts
> **Estimated read time:** 8-10 minutes

---

## Title Options (pick one)

1. **I've been building interfaces for 12 years. Last night, I saw the future of design.**
2. **The missing piece in agentic coding isn't code. It's design.**
3. **AI can ship your UI in minutes. But who's making sure it looks right?**

---

## Cover Image

`[IMAGE 1: Side-by-side comparison — Paper artboard of Domain Collective homepage vs. the live website. Caption: "Left: AI-generated design in Paper. Right: The live website. One prompt."]`

---

## Article Body

### Hook

I've been building user interfaces for 12 years. I've shipped production apps with every major framework, lived through the jQuery-to-React migration, survived the design-to-code handoff wars, and I've been using AI-assisted coding tools since their inception — including Claude Code on Max plan for the last four months.

Last night I tried Paper for the first time and saw a glimpse of what's coming for agentic design interfaces.

Let me explain why that matters.

---

### The Agentic Coding Problem Nobody Talks About

I'm building Domain Collective — a platform that lets you manage domains across seven registrars from one dashboard. The entire product is built with agentic coding. Claude Code and Codex working in tandem. Different agents with different skills shipping different parts of the UI.

And it works. Remarkably well.

The agent is fast. You answer a few questions, describe what you want, and it delivers a working interface. Features that used to take days now take hours. The productivity gain is real and it's not going away.

But here's the thing nobody talks about: **the design comes after.**

`[IMAGE 2: Screenshot of a Claude Code session showing a feature page being built — terminal output with the agent creating components]`

Traditionally, software has been built design-first. You iron out the entire user experience and information architecture. You build a design system. You define your tokens — your colors, spacing, typography scales. Then you start coding against that spec. The design is the contract.

With agentic coding, everything happens on the go. You describe what you want, answer a few clarifying questions, and let the agent deliver. The output is probabilistic — you don't really know what you'll get until you see it running live.

For a small project, this is fine. For a growing product? It becomes a real problem.

---

### Design Drift Is the Silent Tax on Agentic Coding

As your codebase grows, context limitations mean the agent starts losing sight of the bigger picture. What you get is a slow, creeping drift — slightly different spacing here, a subtly different heading hierarchy there, button styles that don't quite match across pages. The design language starts to fragment.

I call this **design drift**, and it's the silent tax on every AI-built interface.

The agent is optimizing locally — producing something that looks good in isolation. But it's not checking whether that output is globally consistent with everything else it shipped yesterday, or last week, or three sprints ago. Each session is a fresh start. Each prompt produces a plausible-but-slightly-different interpretation of your design intent.

Brad Frost nailed this concept years ago with Atomic Design — atoms, molecules, organisms, templates, pages. The whole point was composability and consistency through shared building blocks. We solved this problem once with design systems and design tokens.

Now we need to solve it again, for agents.

`[IMAGE 3: A visual showing the concept — maybe a grid of 4 slightly different button styles or card layouts, labeled "Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4" showing subtle drift]`

---

### MCPs Changed the Game. Design Is Still the Weak Link.

MCPs have opened up AI agents to an incredible range of capabilities. Your agent can now talk to your database, your CI pipeline, your error tracker, your analytics. It can read your codebase, understand your architecture, and ship changes that actually work.

But consistent, well-designed interfaces? That's still the weak link.

This is coming from someone who has a lot of experience building interfaces and has been deep in the AI coding ecosystem. The code quality has gotten remarkably good. The design quality hasn't kept pace.

And that's not because AI can't design. It's because we haven't given agents the right tools to design *consistently*.

---

### Enter Paper

This is where Paper comes in, and why I was genuinely excited last night.

Paper is a design tool where the canvas is actual HTML and CSS. There's no proprietary format, no conversion step. What you see in the design tool is the code. It's built by Stephen Haney — the creator of Radix UI (4M+ monthly npm downloads) and Stitches — so the engineering pedigree is serious.

But the interesting part isn't the tool itself. It's the MCP.

**The setup**

Paper has an MCP server that lets AI coding agents read and write designs directly. I connected it to Claude Code and decided to test it by recreating my live Domain Collective website in Paper.

`[IMAGE 4: Screenshot of Paper's desktop app with the MCP connection indicator, showing the artboard being built]`

I pointed Claude Code at my running dev server, had it capture the page content, and then asked it to recreate it in Paper.

What happened next was genuinely magical.

---

### Watching an Agent Design in Real Time

Claude Code took over Paper and started building my homepage. Section by section, element by element. I could see the design materializing on the canvas in real time — the nav bar, the hero section, the feature grid, the testimonials, the footer.

The contextual animations Paper plays while the agent is working? Just icing on the cake.

One shot. And it was really impressive.

`[IMAGE 5: Side-by-side comparison — the Paper artboard next to the live website. Full page view showing how closely it matched.]`

Paper uses HTML and CSS as its underlying rendering engine, which is exactly why this works so well. LLMs already think in HTML. There's no format translation, no proprietary API to learn, no abstract design-tool concepts to map. The agent writes HTML, and Paper renders it as a design.

The results weren't pixel-perfect — but they were far closer than I expected.

---

### What's Missing (And What I'd Fix)

Let me be honest about the gaps — it's still early.

**Images don't transfer.** The MCP struggles with images, so the hero illustration and logo came through as placeholder boxes. There needs to be a way to pull in local assets or reference images from URLs reliably.

**SVG icons get recreated from scratch.** The agent tries to write inline SVGs which are approximations at best. An icon pack plugin — where the MCP can call with a pack name and icon name — would solve this instantly.

**No design tokens concept.** This is the big one. I couldn't find any way to define design tokens in Paper — colors, spacing scales, typography hierarchies that persist across artboards. For a single screen this is fine. For a multi-page design system? You need tokens that the agent can reference, not just inline styles it generates per-element.

I worked around this by asking Claude Code to create a dedicated Design System artboard before building the other screens. It did a great job — color palette, typography scale, button styles, spacing rhythm, card patterns — all on one reference artboard.

`[IMAGE 6: Screenshot of the Design System artboard showing the color palette, typography, buttons, spacing]`

But this is a workaround. True design tokens — machine-readable, referenceable, enforceable — would be transformative. The W3C Design Tokens spec went stable in October 2025. If Paper adopted it, agents could reference `$color-brand-primary` instead of guessing `#18181b` each time.

---

### The Pricing Gap

A quick note on pricing because I think it matters for adoption.

Paper is the first tool I've seen with MCP-based pricing — 100 tool calls per week on the free plan, 1,000,000 on Pro at $20/month. That tells you something about how agentic pricing models are evolving.

But 100 to 1,000,000 is a massive jump. I burned through my free allocation building a few screens and hit the wall. There's no middle tier for someone who wants to take this for a proper spin — maybe a weekend-long design sprint — without committing to $20/month.

A tier in between — say $5-8 for 5,000-10,000 calls — would let a lot more people experience what this tool can really do. Right now the free tier is just enough to get you excited and not enough to finish anything meaningful.

---

### What I Built

Before I hit the limit, here's what Claude Code created in Paper:

- **Homepage** — Full desktop layout with hero, feature grid, testimonials, FAQ, CTA, and footer
- **Design System** — Color palette, typography, buttons, spacing, cards, border radius reference
- **Features Hub** — Six color-coded feature cards linking to detail pages
- **Six Feature Detail Pages** — Dashboard, Auto Sync, Nameservers, DNS, WHOIS, Security — each with unique accent colors, benefit cards, and detail sections
- **Integrations Page** — Seven registrar cards plus a full feature support matrix
- **Roadmap Page** — Started but hit the MCP limit

That's ten artboards. All generated by an AI agent controlling a design tool through MCP. All matching the live website closely enough that the comparison screenshots speak for themselves.

`[IMAGE 7: Zoomed-out view of all artboards in Paper, showing the full set of pages created]`

---

### The Bigger Picture

Here's what excites me.

We're at an inflection point where:

1. **AI agents can ship UI faster than any human team** — but without design guardrails, the output drifts
2. **Design systems solved this problem for human teams** — but they're not yet "agent-ready"
3. **MCP servers are creating the integration layer** — Paper, Figma, Storybook are all building MCP bridges
4. **The W3C Design Tokens spec just went stable** — giving us a universal, machine-readable format for design decisions

The missing piece is connecting all of these. An agent that can:
- Read your design tokens from a standard spec
- Reference your component library through Storybook MCP
- Create and validate designs in Paper (or Figma)
- Ship code that's guaranteed to match

That's where we're heading. And Paper — despite being early, despite the rough edges — gave me the first tangible glimpse of what that workflow actually feels like.

Brad Frost recently wrote about "agentic design systems" — design systems built specifically for AI agents to consume and enforce. The Storybook team demonstrated constrained generation where agents can only compose from approved components. Figma shipped MCP support (though it's paywalled — not available on free plans).

Paper's bet is different and, I think, potentially more elegant: make the design canvas native code. If the design IS HTML/CSS, agents don't need a translation layer. They already speak the language.

---

### My Background (For Context)

I've been building user interfaces professionally for 12 years — from agency work to product companies to my own startups. I've worked across the full stack but my heart has always been at the intersection of design and engineering. I've watched every major shift in how we build interfaces — responsive design, component architectures, design systems, and now agentic coding.

I say this not to flex but to give context: when I tell you that watching an AI agent build a design in real time felt genuinely new, I mean it. I've been around long enough to know the difference between a gimmick and a glimpse of the future.

This was the latter.

---

### What's Next

I'm planning to upgrade to Paper Pro and spend a proper weekend redesigning some Domain Collective interfaces from scratch — not recreating existing ones, but letting the agent explore new design directions while I direct the vision.

I also want to try Figma's new MCP integration for comparison, though it seems like MCP access isn't available on the free plan there either.

If you're building with AI coding tools and care about design quality — and you should — keep an eye on this space. The tools are early but the direction is clear.

The age of agentic design is starting. And it's about time.

---

`[FINAL IMAGE: A clean screenshot of the finished Paper homepage artboard — the best single visual from the project]`

---

## Image Checklist (8 images total)

| # | Image | Purpose |
|---|-------|---------|
| 1 | **Cover: Side-by-side Paper vs. live site** | Hook — immediately shows the result |
| 2 | **Claude Code terminal building a feature page** | Shows agentic coding in action |
| 3 | **Design drift concept visual** | Illustrates the core problem (could create in Paper or just annotate screenshots) |
| 4 | **Paper desktop app with MCP active** | Shows the tool and setup |
| 5 | **Full-page Paper vs. live site comparison** | The money shot — proves the quality |
| 6 | **Design System artboard** | Shows the workaround for tokens |
| 7 | **All artboards zoomed out** | Shows the scope of what was built |
| 8 | **Final hero artboard (close-up)** | Clean closing visual |

## Companion Thread (5-7 tweets)

**Tweet 1 (Hook):**
I've been building UIs for 12 years.

Last night I tried @paper_design for the first time and saw a glimpse of what's coming for agentic design interfaces.

Here's what happened (and why it matters):

**Tweet 2 (Problem):**
I'm building @DomainCltv entirely with AI coding agents — Claude Code + Codex.

The agents ship UI incredibly fast. But there's a problem nobody talks about: design drift.

Each session produces slightly different spacing, typography, button styles. The design language slowly fragments.

**Tweet 3 (The Experience):**
Paper's MCP lets AI agents read AND write designs. The canvas is actual HTML/CSS — no proprietary format.

I connected Claude Code, pointed it at my live site, and asked it to recreate the homepage.

Watching the agent build a design in real time? Genuinely magical.

`[Attach the side-by-side comparison image]`

**Tweet 4 (Results):**
Before hitting the free tier limit, Claude Code created:

- Full homepage
- Design system reference
- Features hub + 6 detail pages
- Integrations page with feature matrix

10 artboards. All generated by an AI agent controlling a design tool through MCP.

`[Attach the zoomed-out all-artboards image]`

**Tweet 5 (Gaps):**
It's early. Images don't transfer, SVG icons get approximated, and there's no design tokens concept yet.

But the direction is clear: make the design canvas native code, and agents don't need a translation layer. They already speak HTML.

**Tweet 6 (Bigger Picture):**
We're at an inflection point:

- AI agents ship UI faster than any human team
- But without design guardrails, the output drifts
- MCP servers are creating the integration layer
- W3C Design Tokens spec just went stable

The age of agentic design is starting.

**Tweet 7 (CTA):**
I wrote the full breakdown as an X Article — the experience, what works, what's broken, and where this is all heading.

Read it here: [link to article]

---

## Tags/Mentions to Include

- @paper_design (Paper's X handle)
- @DomainCltv (your product)
- @AnthropicAI or @claudeai (Claude Code)
- @bradfrost (if referencing Atomic Design directly)
- Consider tagging @StephenHaney (Paper's founder — previously built Radix UI)

## Posting Strategy

- **Publish the article** first
- **Post the companion thread** linking to it within 30 minutes
- **Engage aggressively** with replies in the first 2-3 hours
- **Best posting times:** Weekday 8-10 AM or 7-9 PM (your timezone)
- **Follow-up QT** 2-3 days later with a different angle (e.g., the design tokens gap specifically)
