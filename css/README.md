# Stylesheet Structure

`style.less` is the only LESS entrypoint compiled by `make.sh`.

- `foundation/`: design tokens, mixins, base element rules, layout helpers, and responsive overrides.
- `layout/`: site-wide chrome such as header and footer.
- `components/`: shared component treatment that spans multiple pages.
- `sections/`: reusable homepage or listing sections.
- `pages/`: page-specific rules that map directly to Hugo layouts or content pages.
- `legacy/`: compatibility rules for older templates and generated article markup.

Keep broad variables and reusable patterns in `foundation/`; keep selectors close
to the template or content page that owns them. Prefer LESS mixins for repeated
visual treatment when adding a utility class would only make templates noisier.
