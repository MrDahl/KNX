# Example KNX CAD Symbols

Student page: seventh navigation item, CAD symbols. Full-width reference with search, category filtering, desktop table and narrow-container cards. Columns: Symbol, English name, What it represents. No product-reference column or manufacturer branding.

## Supplying the drawings

Send one UTF-8 .txt document in this format. An SVG may span multiple lines:

```text
- Push-button sensor // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
  <!-- complete symbol geometry -->
</svg>

- Valve actuator, 6-channel // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
  <!-- complete symbol geometry -->
</svg>
```

Use a distinct symbol name for each variant. Preserve channel counts in names where relevant. Include a viewBox and all geometry; keep font-dependent labels readable. Standalone vectors should not rely on external fonts, scripts, stylesheets or embedded bitmap images.

## Integration workflow

1. Split entries at each name followed by `//`, retaining the complete multiline SVG through its closing tag. Review duplicates and unmatched names; never silently replace a different variant.
2. Review each SVG, remove active content/external dependencies, and visually check labels, proportions and line visibility.
3. Save each asset under public/symbols and map its path in src/symbols/catalogue.ts. Match existing slots where appropriate; otherwise add an English name, category and description for the actual drawing.
4. Check the image at normal and enlarged sizes. Search uses name, description, category and keywords.

There is no student-facing upload or raw-code editor. The owner's text file will be integrated into the repository after review. Existing generic placeholders are not extracted or reconstructed CAD drawings.
