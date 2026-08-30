# Migrating an existing surface

## Storage keys

The canonical key is **`brains.a11y.v1`**. The core reads two legacy keys once,
on first run, and folds whatever it finds into the new blob — so nobody loses a
preference they had already set.

| Legacy key | Written by | Axes recovered |
|---|---|---|
| `brains.prefs` | shard-audit | density, motion, contrast, accent |
| `shard.viewing.v1` | shard-financial-tool, shard-books-site | theme, text size, line spacing, and `dyslexia: true` → `readingFont: 'hyperlegible'` |

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

For `shard-website` and `BRAINS-website`, which are static HTML with inline
React via Babel and no npm:

```html
<head>
  <script>/* paste the output of noFlashScript() here, inline */</script>
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/base.css">
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/shard.css">
  <link rel="stylesheet" href="/vendor/brains-a11y/tokens/panel.css">
  <script src="/vendor/brains-a11y/brains-a11y.js"></script>
</head>
<script>
  var prefs = BrainsA11y.init();
  // BrainsA11y.update(prefs, { theme: 'bone' });
</script>
```

Copy `dist/brains-a11y.js` and the three CSS files into the site's `vendor/`
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
