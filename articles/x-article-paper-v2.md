# X Article: Agentic Design — A Late Night with Paper

> **Format:** X Article (long-form)
> **Companion:** 6-tweet promotional thread
> **Audience:** Developers and designers building with AI coding tools
> **Tone:** Personal, conversational, opinionated — late-night discovery energy
> **Word count:** ~2,800 words
> **Primary keyword:** agentic design
> **Secondary keywords:** design drift, Paper MCP, AI coding tools, design systems

---

## Title

**I tried Paper last night. It gave me a glimpse of what's coming for agentic design.**

## Cover Image

`[IMAGE 1: Side-by-side — Paper artboard of Domain Collective homepage next to the live website. No caption needed, the visual speaks for itself.]`

---

## Article

Just tried Paper last night and it gave me a glimpse of what's coming for agentic design interfaces.

Before I get into it — some context on why this matters to me and why it might matter to you.

---

### I build everything with AI agents now

I'm building Domain Collective — one dashboard to manage domains across seven registrars. The entire UI is built with agentic coding. Claude Code and Codex working in tandem. Different agents, different skills, different parts of the interface. The whole thing.

And before you ask — yes, it works. The agents are absurdly fast. You answer a few questions, describe what you need, and you get a working interface back. Features that used to take days happen in hours. I'm not going back to the old way.

But I've been building user interfaces for 12 years. Agency work, product companies, my own startups. I've shipped with every major framework, lived through the responsive design revolution, the component architecture shift, the design system era. I've watched every major transition in how we build for screens.

So when I say there's a problem with how we're building UI right now, I'm not being dramatic.

`[IMAGE 2: Screenshot of Claude Code terminal mid-session — building a feature page for Domain Collective. Shows the agent creating components in real time.]`

---

### The problem nobody's talking about

Here's how software used to get built: design first, code second.

You'd iron out the user experience. Map the information architecture. Build a design system with tokens — colors, spacing, type scales, component patterns. Then you'd code against that spec. The design was the contract. Everyone knew what "correct" looked like before a single line was written.

With agentic coding, that whole sequence flipped.

Now everything happens on the go. You describe what you want, answer a few clarifying questions, and let the agent deliver. The output is probabilistic. You genuinely don't know what you're going to get until you see it running live. You're reviewing output, not directing input.

For a small project? Fine. Ship it.

For a growing product with dozens of screens? You start noticing things.

The spacing on the features page doesn't quite match the homepage. The heading hierarchy drifts between sections. Buttons that looked identical last week now have subtly different padding. The card radius on page A is 12px. On page B it's 14px. On page C the agent decided 16px felt right.

**Design drift.** That's what I call it.

The agent optimizes locally. It produces something that looks good in isolation. But it has no memory of what it shipped yesterday or three sprints ago. Each session is a fresh start. Each prompt produces a plausible-but-slightly-different version of your design language.

As the codebase grows and context limitations kick in, the drift accelerates. You end up with a slop of slightly different versions of your actual design intent.

`[IMAGE 3: Four card components side by side, subtly different — different border radius, spacing, font weights. Labeled "Session 1", "Session 2", "Session 3", "Session 4". Caption: "Same component. Four different agent sessions. Spot the differences."]`

Anyone remember Brad Frost's Atomic Design? Atoms, molecules, organisms, templates, pages. That whole methodology existed because we needed shared building blocks to keep interfaces consistent across teams.

We solved this problem once with design systems and design tokens.

Now we need to solve it again. For agents.

---

### MCPs gave agents superpowers. Design isn't one of them.

MCPs have opened up agents to a wild range of capabilities. Your agent can talk to Sentry, PostHog, your database, your CI pipeline. It can read your codebase, understand your architecture, run your tests, and ship changes that actually compile.

But consistent, well-designed interfaces? Still the weak link.

The code quality from AI agents has gotten remarkably good. The design quality hasn't kept pace. Not because AI can't design — but because we haven't given agents the right tools to design *consistently*.

That's what was on my mind when I opened Paper last night.

---

### What happened when I connected Claude Code to Paper

Paper is a design tool where the canvas is real HTML and CSS. Not a proprietary format that gets converted to code. The design literally IS code. It's built by Stephen Haney — same person behind Radix UI (4M+ monthly npm downloads) and Stitches. The engineering pedigree checks out.

Paper has an MCP server. That means AI agents can read and write to the design canvas directly.

I connected it to Claude Code, spun up my local dev server for Domain Collective, and told the agent: "Look at my live website and recreate it in Paper."

What happened next — I'm not going to oversell this — was genuinely magical.

`[IMAGE 4: Paper desktop app showing the homepage being constructed. The agent's working indicator visible on the artboard.]`

Claude Code took over Paper and started building my homepage. The nav bar appeared. Then the hero section. Then the feature grid, card by card. The testimonials. The FAQ accordion. The footer with all its link columns.

Section by section. Element by element. In real time on the canvas.

Paper plays these contextual animations while the agent is working — little visual cues showing where the agent is currently operating. Just icing on the cake. You're watching an AI agent design an interface and the design tool itself is responding to it.

One shot. And the result was really impressive.

`[IMAGE 5: Full side-by-side comparison — Paper artboard on left, live Domain Collective website on right. Desktop width, full page.]`

### Why it works this well

Paper uses HTML and CSS as its rendering engine. LLMs already think in HTML. There's no format translation, no proprietary API to learn, no abstract design-tool concepts to map between. The agent writes HTML. Paper renders it as a design. That's it.

This is a fundamentally different approach from Figma's MCP, where designs exist in a proprietary format and need to be translated. Paper skips the translation entirely. The design IS the code the agent already speaks.

The results weren't pixel-perfect. But they were far closer than I was expecting. Look at the comparison shots — the typography hierarchy, the card layouts, the spacing rhythm. It's all there.

---

### What's broken (honest take)

It's early. Paper is in public alpha and it shows in places. Here's what I ran into:

**Images don't come through.** The MCP can't reliably pull images from localhost or external URLs. My hero illustration and logo rendered as empty placeholder boxes. This needs fixing — design without images is just wireframing.

**SVG icons get approximated.** The agent tries to recreate icons as inline SVGs and the results are rough. A simple fix: an icon pack plugin where the MCP calls with a pack name and icon name (like "lucide/arrow-right") and gets the real SVG back.

**No design tokens.** This is the big one. I couldn't find any way to define tokens in Paper — colors, spacing scales, type hierarchies that persist across artboards and that agents can reference by name. For a single screen, inline styles are fine. For a multi-page design system? You need tokens.

I worked around it. Before building the remaining screens, I asked Claude Code to create a dedicated Design System artboard — color palette, type scale, buttons, spacing rhythm, card patterns, border radius reference. It did a great job.

`[IMAGE 6: The Design System artboard — showing organized rows of color swatches, typography samples, button variants, spacing blocks.]`

But it's a workaround. The agent is referencing a visual artboard, not a structured token file. True design tokens — machine-readable, referenceable, enforceable — would be transformative here. The W3C Design Tokens spec went stable in October 2025. If Paper adopted it, agents could reference `$color-brand-primary` instead of guessing `#18181b` each time.

That would go a long way toward solving design drift at the tool level.

---

### On the pricing

Quick aside because I think this matters for adoption.

Paper is the first tool I've seen with MCP-based pricing. Free plan: 100 tool calls per week. Pro at $20/month: 1,000,000 per week.

That's the first time I'm seeing agentic pricing — billing based on how much your AI agent uses the tool, not how much you do. Interesting model. Makes sense directionally.

But 100 to 1,000,000 is a massive gap with nothing in between.

I burned through my free allocation building a handful of screens and hit the wall. Couldn't finish the Roadmap page. If you want to take Paper for a real spin — a weekend design sprint, a proper evaluation — 100 calls won't get you there and $20/month might feel steep for a tool you're still evaluating.

Something in the middle — $5-8 for 5,000-10,000 calls — would let a lot more people experience what this tool can actually do. Right now the free tier is just enough to get you excited and not enough to finish anything.

---

### What I actually built

Before hitting the limit, Claude Code created 10 artboards in Paper:

- Full homepage with hero, features, testimonials, FAQ, and footer
- Design system reference artboard
- Features hub with six color-coded feature cards
- Six individual feature detail pages — each with unique accent colors, benefit cards, and content sections
- Integrations page with seven registrar cards and a full feature support matrix
- Roadmap page (started, then the limit hit)

All generated by an AI agent controlling a design tool through MCP. All matching the live website closely enough that the comparison screenshots speak for themselves.

`[IMAGE 7: Zoomed-out canvas view in Paper showing all 10 artboards laid out. Shows the scope of what was generated in one session.]`

Ten artboards. One evening. One agent.

---

### Where this is all heading

Here's what I think is actually happening:

We're at a point where AI agents can ship UI faster than any human team. But speed without design guardrails produces what the industry is starting to call "AI slop" — interfaces that are fast and generic and all look vaguely the same. Clean enough to ship, not good enough to love.

Design systems solved this problem for human teams. But most design systems aren't agent-ready. They're documented for people to read, not for machines to consume and enforce.

The pieces are converging though:

**MCP servers are creating the integration layer.** Paper, Figma, and Storybook are all building MCP bridges that let agents interact with design tools and component libraries directly.

**The W3C Design Tokens spec went stable.** We now have a vendor-neutral, machine-readable format for design decisions. Colors, spacing, typography — all expressible as structured data that agents can consume.

**Brad Frost is writing about "agentic design systems."** Design systems built specifically for AI agents to reference and enforce. The Storybook team demonstrated constrained generation where agents can only compose from pre-approved components. The idea: don't let the agent improvise. Give it building blocks and rules.

The vision that gets me excited:

An agent that reads your design tokens from a standard spec. References your component library through Storybook MCP. Creates and validates designs in Paper. Ships code that's guaranteed to match. Design drift becomes a solved problem because the agent never had the freedom to drift in the first place.

We're not there yet. But last night, watching Claude Code build a full design in Paper — using the same HTML it already thinks in, rendering it on a canvas I could inspect and modify — I could see the shape of it.

Paper's bet is that if the design canvas is native code, agents don't need a translation layer. They already speak the language.

I think that bet is going to prove right.

---

### What's next for me

I'm planning to upgrade to Paper Pro and do a proper design sprint — not recreating existing screens but exploring new design directions for Domain Collective with the agent. Director mode, not operator mode. I set the vision, the agent explores.

I also want to try Figma's MCP for comparison. They shipped it recently but MCP access isn't on the free plan there either (only 6 calls/month on Starter). So that comparison will have to wait until I decide which tool deserves my paid commitment.

If you're building with AI coding tools and you care about the quality of what ships — keep an eye on this space. The tools are early. The rough edges are real. But the direction is clear and the implications are significant.

The age of agentic design is starting.

It's about time somebody showed up with the right tools for it.

---

`[IMAGE 8: Clean close-up of the Paper homepage artboard — the hero section with gradient heading, feature cards below. The best single frame from the project.]`

---

## Image Checklist

| # | What to capture | Notes |
|---|----------------|-------|
| 1 | Side-by-side: Paper homepage artboard vs. live site | Cover image. Crop to show hero + first section. 1600x900 for X card display. |
| 2 | Claude Code terminal mid-build | Show the agent actively creating components. Crop to a compelling moment. |
| 3 | Design drift concept — 4 similar-but-different cards | Create this visual. Label each "Session 1-4". Make differences subtle but noticeable (radius, padding, font weight). |
| 4 | Paper desktop app with working indicator | Screenshot while agent is actively building. Show the MCP connection. |
| 5 | Full page side-by-side comparison | The money shot. Full homepage in both. Let the fidelity speak for itself. |
| 6 | Design System artboard | Clean capture showing all token categories. Zoom to fill frame. |
| 7 | All artboards zoomed out | Canvas view showing all 10 artboards. Demonstrates scope. |
| 8 | Hero section close-up | The gradient heading, the feature cards. Best single visual from the project. |

---

## Companion Thread (6 tweets)

**Tweet 1 (Hook):**
Tried @paper_design last night.

I've been building interfaces for 12 years and this is the first time I've seen an AI agent design in real time on a canvas.

Here's what happened and why it matters for anyone building with AI coding tools:

**Tweet 2 (Context):**
I'm building @DomainCltv entirely with AI agents — Claude Code + Codex.

The agents ship UI fast. But there's a problem growing with every sprint: design drift.

Slightly different spacing, subtly different heading hierarchies, button styles that don't quite match. The design language fragments.

**Tweet 3 (The experience):**
Paper's canvas is actual HTML/CSS. No proprietary format.

Connected it to Claude Code via MCP. Pointed the agent at my live site. Said "recreate this."

Watched the homepage materialize section by section on the canvas. Nav, hero, features, testimonials, footer.

One shot. Really impressive.

`[Attach side-by-side comparison]`

**Tweet 4 (What was built):**
Before hitting the free tier limit (100 MCP calls/week), Claude Code generated:

- Full homepage
- Design system artboard
- Features hub + 6 detail pages
- Integrations page with feature matrix

10 artboards. One evening. One agent.

`[Attach zoomed-out canvas view]`

**Tweet 5 (Honest gaps + pricing):**
It's early. Images don't transfer, SVGs get approximated, and there's no design tokens concept yet.

Pricing: 100 free calls/week vs 1M at $20/mo is too big a gap. A $5-8 middle tier would let way more people properly evaluate this.

But the direction? Right on the money.

**Tweet 6 (Vision + CTA):**
We solved design consistency once with design systems and tokens.

Now we need to solve it again — for agents.

Paper, Figma MCP, Storybook MCP, W3C Design Tokens spec — the pieces are converging.

Full writeup with screenshots and comparison shots:
[link to article]

---

## Mentions

- @paper_design — Paper
- @DomainCltv — Domain Collective
- @AnthropicAI — Anthropic / Claude
- @stephenhaney — Paper's founder (Radix UI creator)
- @bradfrost — Atomic Design / agentic design systems (only if he engages)

## Posting Playbook

1. **Publish the article** during peak hours (weekday 8-10 AM or 7-9 PM IST)
2. **Post the companion thread** 15-30 minutes after the article goes live
3. **Engage with every reply** for the first 3 hours — this is the critical window for the algorithm
4. **Quote-tweet the article** 2-3 days later with a different angle (e.g., zoom in on the design tokens gap specifically, or the pricing model discussion)
5. **Follow up** with a short post when you upgrade to Pro and try the redesign sprint

## SEO Notes (for X Article indexing)

- **Primary keyword in title:** "agentic design" appears in headline
- **Secondary keywords** used naturally: "design drift", "Paper MCP", "design tokens", "AI coding tools"
- **Alt text for images:** Describe what's shown for accessibility and search indexing
- **Internal X links:** Embed your own relevant tweets if any exist about Domain Collective or AI coding
