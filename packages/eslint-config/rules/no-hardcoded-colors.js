const COLOR_UTILS =
  'bg|text|border|ring|inset-ring|outline|fill|stroke|accent|caret|decoration|divide|shadow|from|via|to';
const PALETTE =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|white|black';

// Tailwind palette / literal-color utilities, shade optional so undefined
// tokens that reuse palette names (bg-amber, text-green) are caught too.
const paletteClass = new RegExp(
  `(?:^|[\\s'"\`{:(])((?:[\\w-]+:)*(?:${COLOR_UTILS})-(?:${PALETTE})(?:-\\d{2,3})?(?:/\\d{1,3})?)(?=$|[\\s'"\`})(])`,
  'g'
);

// Arbitrary color values: bg-[#...], text-[oklch(...)], border-[rgb(...)], ...
const arbitraryColor = new RegExp(
  `((?:[\\w-]+:)*(?:${COLOR_UTILS})-\\[(?:#|rgba?\\(|hsla?\\(|oklch\\(|oklab\\(|hwb\\(|lab\\(|lch\\(|color-mix\\(|color\\())`,
  'g'
);

// Raw hex / color functions in CSS contexts (<style> blocks, style attributes).
const cssColorLiteral = /(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color-mix)\()/g;

// Named colors assigned to color-only CSS properties.
const cssNamedColor =
  /\b((?:color|background-color|border(?:-[a-z]+)*-color|outline-color|caret-color|accent-color|fill|stroke)\s*:\s*(?!var\(|inherit\b|currentcolor\b|transparent\b|initial\b|unset\b|revert\b|none\b)[a-zA-Z][\w-]*)/gi;

const COLOR_PROPS = new Set([
  'color',
  'background-color',
  'border-color',
  'outline-color',
  'caret-color',
  'accent-color',
  'fill',
  'stroke'
]);

const KEYWORD_VALUES = /^(?:var\(|inherit$|currentcolor$|transparent$|initial$|unset$|revert$|none$)/i;

const CLASS_REGEXES = [paletteClass, arbitraryColor];
const CSS_REGEXES = [cssColorLiteral, cssNamedColor];

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded colors (Tailwind palette classes, hex/rgb/oklch literals, arbitrary color values); UI must use the semantic theme tokens from packages/ui/src/global.css.'
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      hardcodedColor:
        'Hardcoded color "{{match}}". Use the theme\'s semantic tokens instead — bg-primary, text-muted-foreground, border-border, bg-destructive, etc. (full list: packages/ui/src/global.css). @repo/ui components already handle colors and dark mode. If no existing token fits, do not invent a color: ask the user and add it through the theme workflow (see .agents/skills/ui-and-theme/SKILL.md).'
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const allow = (context.options[0]?.allow ?? []).map((pattern) => new RegExp(pattern));

    function report(matchText, index) {
      if (allow.some((regex) => regex.test(matchText))) return;
      context.report({
        loc: {
          start: sourceCode.getLocFromIndex(index),
          end: sourceCode.getLocFromIndex(index + matchText.length)
        },
        messageId: 'hardcodedColor',
        data: { match: matchText }
      });
    }

    function scanText(text, baseOffset, regexes) {
      for (const regex of regexes) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(text))) {
          const matched = match[1] ?? match[0];
          report(matched, baseOffset + match.index + match[0].indexOf(matched));
          if (regex.lastIndex === match.index) regex.lastIndex += 1;
        }
      }
    }

    function attributeName(attr) {
      if (!attr || attr.type !== 'SvelteAttribute') return null;
      return attr.key?.name ?? null;
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        scanText(sourceCode.getText(node), node.range[0], CLASS_REGEXES);
      },
      TemplateElement(node) {
        scanText(node.value.raw, node.range[0], CLASS_REGEXES);
      },
      SvelteLiteral(node) {
        scanText(node.value, node.range[0], CLASS_REGEXES);
        const name = attributeName(node.parent);
        if (name === 'style') {
          scanText(node.value, node.range[0], CSS_REGEXES);
        } else if (name === 'fill' || name === 'stroke' || name === 'color') {
          const value = node.value.trim();
          if (value && !KEYWORD_VALUES.test(value) && !value.startsWith('url(')) {
            report(value, node.range[0] + node.value.indexOf(value));
          }
        }
      },
      SvelteStyleDirective(node) {
        const property = node.key?.name?.name;
        for (const part of node.value ?? []) {
          if (part.type !== 'SvelteLiteral') continue;
          scanText(part.value, part.range[0], [cssColorLiteral]);
          const value = part.value.trim();
          if (
            COLOR_PROPS.has(property) &&
            value &&
            !KEYWORD_VALUES.test(value) &&
            !/^#|\(/.test(value)
          ) {
            report(value, part.range[0] + part.value.indexOf(value));
          }
        }
      },
      SvelteStyleElement(node) {
        scanText(sourceCode.getText(node), node.range[0], CSS_REGEXES);
      }
    };
  }
};
