# English and Danish localization plan

Status: proposed architecture; translation support is not implemented yet.

Use `i18next` with `react-i18next`. Keep English as the default and fallback language, with Danish (`da`) as the second supported language. Store reviewed translations in the repository; no runtime translation service is required.

## Resource structure

Organize resources under `src/locales/en/` and `src/locales/da/`, with matching files for `common`, `telegram`, `objects`, `hopCount`, `topology`, `dpt` and `symbols`. Use stable semantic keys, such as `telegram.generate` and `hopCount.startingValue`, rather than English sentences as identifiers.

Translate complete sentences. Use interpolation for numbers, addresses and other runtime values; avoid assembling translated sentences from fragments. Include form labels, errors, tooltips, SVG labels, screen-reader labels, empty states and source-status notes.

## Protocol and reference data

Keep DPT identifiers, canonical standard names, format codes, units, addresses, service names and hexadecimal/binary payloads independent of language. Translate their explanations, not their identifiers. Store translated DPT descriptions by DPT ID; retain edition, page and review-status metadata alongside the canonical data.

The model currently returns English reason strings (for example, `traceRoute`). Before translating these, return stable reason codes and structured values, then render the appropriate localized message in the UI. Apply the same separation to codec validation errors. Do not make model logic depend on displayed text or translated enum labels.

Create a reviewed KNX terminology glossary before translating the technical material. Keep Hop Count / HC consistent and distinguish the sending-address marker S from communication flags C, R, W, T, U and I.

## Language selection and numeric input

Provide an `English / Dansk` selector that stores the preference locally and updates the document's `lang` attribute. Changing language must preserve the active page, form values, generated telegram and simulation state.

Use locale-aware formatting for displayed quantities. Keep internal numbers and protocol encoding locale-neutral. For Danish decimal input, define and test handling of the decimal comma explicitly; reject ambiguous mixed separators and never apply locale formatting to DPT IDs, KNX addresses or hex input.

## Rollout and verification

1. Extract the current English UI text and model message codes without changing the English output or protocol behavior.
2. Add the language selector, Danish navigation and common controls, then translate and review one complete page at a time.
3. Translate catalogue descriptions and source notes separately, preserving unresolved standard questions.
4. Check translation-key parity, fallback behavior and long-text layouts. Verify that the same inputs produce identical telegram bytes in both languages and that changing language retains state. Test Danish decimal input and keyboard/screen-reader labels.

English fallback supports incomplete drafts, but missing Danish strings should be reported in CI so they cannot silently remain in a finished page.

## Reference

- https://react.i18next.com/latest/usetranslation-hook
- https://react.i18next.com/guides/multiple-translation-files
- https://www.i18next.com/principles/fallback
- https://www.i18next.com/translation-function/formatting
