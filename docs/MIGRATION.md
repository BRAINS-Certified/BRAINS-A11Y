# Migrating an existing surface

## Storage keys

The canonical key is **`brains.a11y.v1`**. The core reads two legacy keys once,
on first run, and folds whatever it finds into the new blob — so nobody loses a
preference they had already set.

| Legacy key | Written by | Axes recovered |
|---|---|---|
| `brains.prefs` | shard-audit **and** BRAINS-build-tracker | **Two apps share this key with different schemas.** shard-audit writes `{density, motion, contrast, accent}`; the build tracker writes `{theme, text_size, line_spacing, dyslexia}` in snake_case with an upper-case text size. The mapper reads both; the key sets do not overlap, so a blob simply carries whatever its own app wrote |
| `shard.viewing.v1` | shard-financial-tool | theme, text size, line spacing, and `dyslexia: true` → `readingFont: 'hyperlegible'` |
| `sb:theme`, `sb:text-size`, `sb:line-spacing`, `sb:dyslexia` | shard-books-site | the same four axes, but as separate string keys rather than a JSON blob |
| `shard.prefs` | shard-website (shardlabs.com.au) | the same four axes again, with its own casing — `light` for Bone, `S`/`M`/`L`, `Standard`/`Tight`/`Roomy` |

An unset theme follows `prefers-color-scheme` rather than forcing Midnight —
shard-books-site already did this, and losing it would have shown light-mode
visitors a dark page on their first visit.

Migration is read-only: the old keys are left in place, so a rollback loses
nothing. Remove them only once every surface is on the package.

## Next.js (App Router)

```js
// next.config.js — required, the package ships JSX source
module.exports = { transpilePackages: ['@brains/a11y'] };
```

```jsx
// app/layout.jsx
import { noFlashScript } from '@brains/a11y/core/no-flash';
import { A11yProvider } from '@brains/a11y/react';
import '@brains/a11y/tokens/base.css';
import '@brains/a11y/tokens/shard.css';   // or brains.css
import '@brains/a11y/tokens/panel.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><script dangerouslySetInnerHTML={{ __html: noFlashScript() }} /></head>
      <body>
        <A11yProvider>
          <a className="a11y-skip-link" href="#main">Skip to content</a>
          {children}
        </A11yProvider>
      </body>
    </html>
  );
}
```

Then mount `<A11yPanel />` in the header — on **every** page, not only behind
authentication. The gap that prompted `GlobalAccessibilityBar` in Shard Books
was exactly this: the panel lived inside the authenticated shell, so signed-out
users got a hard-coded theme and no controls at all.

## Astro

```astro
---
import NoFlash from '@brains/a11y/astro/NoFlash.astro';
import A11yPanel from '@brains/a11y/astro/A11yPanel.astro';
import '@brains/a11y/tokens/base.css';
import '@brains/a11y/tokens/shard.css';
import '@brains/a11y/tokens/panel.css';
---
<html lang="en">
  <head><NoFlash /></head>
  <body>
    <a class="a11y-skip-link" href="#main">Skip to content</a>
    <header><A11yPanel /></header>
  </body>
</html>
```

## Static HTML, no build step

`BrainsA11y.mountPanel` is the **canonical non-React panel**. It renders the
same DOM, `.a11y-panel__*` class names and accessibility semantics as the React
`<A11yPanel>` — same markup, same keyboard contract, same store. Every
non-React surface should use it instead of hand-rolling a panel.

```html
<head>
  <script>/* paste the output of noFlashScript() here, inline */</script>
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/base.css">
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/shard.css">   <!-- or brains.css -->
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/panel.css">
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/trigger.css"> <!-- if using trigger -->
  <script src="/vendor/brains-a11y/dist/brains-a11y.js"></script>
</head>
<body>
  <a class="a11y-skip-link" href="#main">Skip to content</a>

  <header>
    <!-- Option A: panel inline, always visible -->
    <div id="a11y-panel"></div>
  </header>

  <script>
    // Apply saved preferences and prevent flash (init() = read() + apply())
    BrainsA11y.init();

    // Mount the canonical panel — identical to React <A11yPanel>
    BrainsA11y.mountPanel('#a11y-panel');

    // Option B: trigger + collapsible panel (open/close, Escape, click-outside)
    // BrainsA11y.mount('#a11y-trigger-slot', {
    //   variant: 'label',
    //   label: 'Display & reading',
    //   // panelTarget: '#a11y-panel-slot', // optional explicit location for the panel
    // });
  </script>
</body>
```

### API reference

```js
// Panel only, in any element
var handle = BrainsA11y.mountPanel(target, opts);
// target — CSS selector string or Element
// opts   — { axes?, title?, headingLevel? }   (all optional)
// Returns { destroy() }

// Trigger button only
var trigger = BrainsA11y.mountTrigger(target, opts);
// opts   — { variant?, placement?, icon?, label?, controls? }   (all optional)
// Returns { setExpanded(bool), destroy() }

// Trigger + popover panel wired together
var combo = BrainsA11y.mount(triggerTarget, opts);
// opts   — all mountTrigger opts + { panelTarget?, axes?, title?, headingLevel? }
// Returns { destroy() }
```

Copy `dist/brains-a11y.js` and the CSS files into the site's `vendor/`
directory. Pin the copied version in a comment so it can be re-synced.

## Replacing an existing implementation

1. Add the package and the token imports; remove the surface's own token
   definitions for the eight axes.
2. Delete the surface's preferences module, provider, panel and no-flash
   script. Keep its tests — point them at the package.
3. For shard-audit specifically, delete the enumerated `data-density` utility
   rules from `globals.css` and switch the components' padding to the
   `--space-*` tokens. This is the largest single change in any retrofit.
4. Run the surface's own axe suite. The panel ships correct radiogroup
   semantics, so violations that appear are almost always in the surrounding
   page, not the panel.
