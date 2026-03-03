# X Article: Agentic Design — A late night with Paper

> **Format:** X Article (long-form)
> **Companion:** 6-tweet promotional thread
> **Audience:** Developers and designers building with AI coding tools
> **Tone:** Personal, conversational, opinionated
> **Word count:** ~2,600 words

---

## Title

**I tried Paper last night. It showed me where agentic design is going.**

## Cover image

`[IMAGE 1: Side-by-side, Paper artboard of Domain Collective homepage next to the live website.]`

---

## Article

Tried Paper last night. It showed me something about where agentic design interfaces are heading.

Some context before I get into it.

---

### I build everything with AI agents now

I'm building Domain Collective, a dashboard that lets you manage domains across seven registrars in one place. The entire UI is built with agentic coding. Claude Code and Codex running together, different agents handling different parts of the interface.

It works. The agents are fast. You describe what you need, answer a few questions, and get a working interface back. Things that used to take days now take hours. I'm not going back.

I've been building user interfaces for 12 years though. Agency work, product teams, my own startups. I've shipped with most of the major frameworks and watched every big shift in how we build for screens, from responsive design through component architectures through design systems.

So when I say something is off with how we're building UI right now, I'm speaking from some experience.

`[IMAGE 2: Claude Code terminal mid-session, building a feature page for Domain Collective.]`

---

### The problem nobody's talking about

Here's how software used to get built: design first, code second.

You'd work out the user experience. Map the information architecture. Build a design system with tokens: colors, spacing, type scales, component patterns. Then you'd code against that spec. The design was the contract. Everyone knew what "correct" looked like before anyone wrote a line of code.

With agentic coding, that sequence flipped.

Now everything happens on the go. You describe what you want, the agent delivers. The output is probabilistic. You don't know what you're going to get until you see it running. You're reviewing output, not directing input.

For a small project, fine. Ship it.

For a growing product with dozens of screens, you start noticing things.

The spacing on the features page doesn't match the homepage. The heading hierarchy shifts between sections. Buttons that looked the same last week now have slightly different padding. The card radius on page A is 12px, page B is 14px, page C the agent went with 16px.

I've been calling this **design drift**.

The agent optimizes for what's in front of it. It makes something that looks right in isolation. But it has no memory of what it shipped yesterday or three sprints ago. Each session starts fresh. Each prompt produces a slightly different interpretation of your design language.

As the codebase grows and context limits kick in, the drift picks up speed. You end up with a bunch of almost-matching versions of what your design was supposed to be.

`[IMAGE 3: Four card components side by side, each subtly different. Different border radius, spacing, font weights. Labeled "Session 1" through "Session 4". Caption: "Same component. Four agent sessions. Spot the differences."]`

Anyone remember Brad Frost's Atomic Design? Atoms, molecules, organisms. That methodology existed because we needed shared building blocks to keep interfaces consistent across teams.

We solved this once with design systems and design tokens.

Now we need to solve it again for agents.

---

### MCPs gave agents a lot of new abilities. Design isn't one of them.

MCPs have opened agents up to all kinds of things. Your agent can talk to Sentry, PostHog, your database, your CI pipeline. It reads your codebase, runs your tests, ships changes that compile.

Consistent interfaces? Still the weak spot.

The code quality from AI agents has gotten good. The design quality hasn't caught up. Not because agents can't design, but because we haven't given them the right tools to stay consistent.

That's what I was thinking about when I opened Paper.

---

### What happened when I connected Claude Code to Paper

Paper is a design tool where the canvas is actual HTML and CSS. Not a proprietary format that gets converted. The design is the code. It's built by Stephen Haney, the person behind Radix UI (4M+ monthly npm downloads) and Stitches.

Paper has an MCP server, which means AI agents can read from and write to the design canvas directly.

I connected it to Claude Code, started my local dev server for Domain Collective, and told the agent to look at my live site and recreate it in Paper.

I wasn't expecting much honestly. I've seen a lot of AI demos that look good in a tweet and fall apart when you try them.

This was different.

`[IMAGE 4: Paper desktop app showing the homepage being built. The agent's working indicator is visible on the artboard.]`

Claude Code started building my homepage in Paper. The nav bar showed up. Then the hero section. The feature grid, card by card. Testimonials. FAQ. Footer with all its link columns.

Piece by piece, on the canvas, in real time.

Paper shows these little animations while the agent works, visual cues for where it's operating. You're watching an AI agent put together an interface and the design tool is responding to it live.

One pass. And the result was close. Really close.

`[IMAGE 5: Full side-by-side, Paper artboard on left, live Domain Collective website on right. Desktop width, full page.]`

### Why it works this well

Paper's rendering engine is HTML and CSS. LLMs already think in HTML. There's no translation step, no proprietary API to learn. The agent writes HTML, Paper renders it as a design. That's the whole thing.

Compare this to Figma's MCP, where designs live in a proprietary format and need to be translated back and forth. Paper skips that. The design is already in the language the agent writes.

The output wasn't pixel-perfect. But it was much closer than I expected. The typography hierarchy, the card layouts, the spacing. Check the comparison shots.

---

### What's broken (honest take)

Paper is in public alpha and it shows in places. Here's what I ran into:

The MCP can't pull images reliably. My hero illustration and logo came through as empty boxes. Design without images is basically wireframing. This needs to work.

SVG icons get recreated from scratch as inline SVGs, and they look rough. An icon pack plugin would fix this. Let the MCP call something like "lucide/arrow-right" and get the real SVG back instead of the agent trying to draw it.

And the big one: no design tokens. I couldn't find a way to define persistent tokens in Paper, the kind of thing where your colors and spacing and type scales carry across artboards and agents can reference them by name. For one screen that's fine. For a multi-page system, you need this.

I worked around it by having Claude Code create a Design System artboard first. Color palette, type scale, buttons, spacing, card patterns, radius reference. All on one board that the agent could look at before building the rest.

`[IMAGE 6: The Design System artboard. Color swatches, typography samples, button variants, spacing blocks.]`

It's a workaround though. The agent is looking at a picture of tokens, not reading a structured file. If Paper adopted the W3C Design Tokens spec (which went stable in October 2025), agents could reference `$color-brand-primary` instead of eyeballing `#18181b` each time.

That alone would go a long way.

---

### On pricing

This is the first tool I've seen with MCP-based pricing. Free plan: 100 tool calls per week. Pro at $20/month: 1,000,000 per week.

Billing based on how much your agent uses the tool, not how much you do. I think that model makes sense.

But 100 to 1,000,000 is a huge jump with nothing between.

I used up my free calls building a few screens and hit the wall mid-way through the Roadmap page. If you want to properly evaluate Paper, a weekend design sprint, maybe try redesigning a few screens, 100 calls won't get you there. And $20/month feels like a commitment for a tool you're still figuring out.

Something around $5-8 for 5,000-10,000 calls would let people actually test this. The free tier gets you excited. It doesn't let you finish.

---

### What I built before hitting the limit

Claude Code created 10 artboards in Paper:

- Full homepage: hero, features, testimonials, FAQ, footer
- Design system reference board
- Features hub with six color-coded cards
- Six feature detail pages, each with its own accent color and content sections
- Integrations page with seven registrar cards and a feature support matrix
- Roadmap page (got started, then ran out of calls)

All generated by an AI agent working through MCP. All close enough to the live site that the screenshots make the case better than I can describe it.

`[IMAGE 7: Zoomed-out canvas in Paper, all 10 artboards visible.]`

Ten artboards. One evening. One agent.

---

### Where I think this is going

AI agents can ship UI faster than any team I've worked on. But speed without guardrails produces what people have started calling "AI slop." Interfaces that are fast and generic and look vaguely interchangeable. Good enough to ship, not good enough to care about.

Design systems solved consistency for human teams. But most design systems aren't built for agents. They're written for people to read, not for machines to enforce.

A few things are coming together though.

Paper, Figma, and Storybook are all building MCP servers that let agents interact with design tools and component libraries. The W3C Design Tokens spec went stable last year, giving us a machine-readable format for design decisions. Brad Frost has been writing about "agentic design systems," systems built specifically for agents to consume. The Storybook team showed constrained generation where agents can only assemble from approved components.

The version of this that I keep thinking about: an agent that reads your tokens from a standard spec, references your component library through Storybook, creates designs in Paper, and ships code that matches. Design drift goes away because the agent never had room to drift.

We're not there. But last night, watching Claude Code build a full design in Paper, writing the same HTML it already knows, on a canvas I could inspect and edit, I could see the outline of it.

Paper's bet is that a code-native canvas means agents don't need a translation layer. I think they're right.

---

### What's next

I'm going to upgrade to Paper Pro and spend a weekend doing a real design sprint. Not recreating existing screens this time, but exploring new directions for Domain Collective. I'll steer, the agent will explore.

I also want to try Figma's MCP. They launched it but MCP isn't on their free plan either (6 calls/month on Starter). So that'll have to wait until I figure out which one gets my money.

If you're building with AI tools and you care about what ships looking good and staying consistent, this is the space to watch. The tools are young. The rough edges are obvious. But something real is forming here.

---

`[IMAGE 8: Close-up of the Paper homepage artboard. The hero section with gradient heading and feature cards below.]`

---

## Image checklist

| # | What to capture | Notes |
|---|----------------|-------|
| 1 | Side-by-side: Paper homepage vs. live site | Cover image. Hero + first section. 1600x900. |
| 2 | Claude Code terminal mid-build | Agent actively creating components. |
| 3 | Design drift visual: 4 similar-but-different cards | Label "Session 1-4". Subtle differences in radius, padding, weight. |
| 4 | Paper desktop app, agent working | Working indicator visible on artboard. |
| 5 | Full page side-by-side comparison | Full homepage in both. The main proof. |
| 6 | Design system artboard | All token categories visible. |
| 7 | All artboards zoomed out | Canvas view, all 10 boards. Shows scope. |
| 8 | Hero section close-up | Gradient heading, feature cards. Best single frame. |

---

## Companion thread (6 tweets)

**Tweet 1:**
Tried @paper_design last night.

12 years building interfaces and this is the first time I've watched an AI agent design on a canvas in real time.

What happened and why it matters if you build with AI coding tools:

**Tweet 2:**
I build @DomainCltv entirely with AI agents. Claude Code + Codex.

They ship UI fast. But there's a growing problem: design drift.

Different spacing, different heading hierarchy, button styles that don't quite match across pages. The design language slowly falls apart.

**Tweet 3:**
Paper's canvas is actual HTML/CSS. No proprietary format.

Connected Claude Code via MCP. Pointed it at my live site. Said "recreate this."

Watched the homepage come together section by section on the canvas.

One pass. Way closer than I expected.

`[Attach side-by-side comparison]`

**Tweet 4:**
Before hitting the free limit (100 MCP calls/week), Claude Code made:

- Full homepage
- Design system board
- Features hub + 6 detail pages
- Integrations page with feature matrix

10 artboards. One evening.

`[Attach zoomed-out canvas]`

**Tweet 5:**
Still early. Images don't transfer, SVGs get approximated, no design tokens yet.

Pricing: 100 free calls/week vs 1M at $20/mo is a big jump. A middle tier would help people actually evaluate this.

The direction though? I think they're onto something.

**Tweet 6:**
We solved design consistency once with design systems and tokens.

Now we need to solve it for agents.

Paper, Figma MCP, Storybook MCP, W3C Design Tokens. The pieces are showing up.

Full writeup with comparison screenshots:
[link to article]

---

## Mentions

- @paper_design
- @DomainCltv
- @AnthropicAI
- @stephenhaney (Paper founder, built Radix UI)
- @bradfrost (if he engages)

## Posting playbook

1. Publish the article during peak hours (weekday 8-10 AM or 7-9 PM IST)
2. Post the thread 15-30 minutes after
3. Reply to every response for the first 3 hours
4. Quote-tweet 2-3 days later with a different angle (the tokens gap, or the pricing model)
5. Follow up when you upgrade to Pro with results from the design sprint

---

## Humanizer changes applied (v2 to v3)

**Em dashes:** Reduced from 15+ to 4. Replaced most with commas, periods, or restructured sentences.

**Rule of three:** Broke up "agency work, product companies, my own startups" and "Different agents, different skills, different parts." Removed several three-item lists that felt algorithmic.

**Bold inline headers:** Removed the bolded-header-plus-colon pattern from the "What's broken" section. Rewrote as flowing paragraphs instead of a formatted list.

**Inflated language:** "genuinely magical" became "This was different." "fundamentally different approach" became just describing the difference. "remarkably good" became "good." "transformative" removed.

**AI vocabulary:** Cut "genuinely" (appeared twice), "remarkably", "transformative", "converging", "implications are significant."

**Negative parallelism:** "Not because AI can't design, but because..." rewritten as a simpler sentence.

**Generic conclusion:** "The age of agentic design is starting. It's about time somebody showed up with the right tools for it" replaced with "something real is forming here." Less grand, more honest.

**Copula avoidance:** Several "serves as" / "represents" constructions simplified to "is."

**Hedging removed:** "I'm not going to oversell this" removed (was meta-hedging that calls attention to itself).

**Sentence rhythm:** Varied more deliberately. Mixed short and long. Added some incomplete thoughts and asides that feel more like someone actually talking.

**Overall:** Less polished, more human. The v2 read like a well-crafted blog post. This reads more like someone at a coffee shop telling you about something they tried last night.
