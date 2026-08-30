# Security

## Reporting

Report suspected vulnerabilities privately to **hello@shardlabs.com.au**. Do
not open a public issue.

## Threat surface

This package is client-side only. It has no network calls, no server
component, no dependencies, and no access to anything beyond `localStorage`
and `document.documentElement`.

The two areas worth review:

**The no-flash script is injected as raw HTML.** It is generated from constants
in `core/index.mjs` and interpolates only `JSON.stringify` output of those
constants — never user input, never stored values. If a future change
interpolates anything read from storage into that string, that is an XSS
vector and must be rejected in review.

**Stored preferences are untrusted input.** Everything read from
`localStorage` passes through `normalise()`, which allow-lists per axis and
discards anything unrecognised. Values reach the DOM only via `setAttribute`
with a fixed attribute name, never via `innerHTML`.

## Privacy

Preferences are stored on the device and are never transmitted. There is no
telemetry, no cookie, and no server round-trip. A person's accessibility needs
are sensitive; this package is designed so that using it discloses nothing.
