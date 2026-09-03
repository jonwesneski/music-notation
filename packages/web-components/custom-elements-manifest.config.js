/**
 * The three staff subclasses (`music-staff`, `music-staff-vocal`,
 * `music-staff-guitar-tab`) extend `StaffClassicalElementBase`, whose own base
 * resolves `HTMLElement` through a runtime-safe `_MaybeHTMLElement` fallback
 * (SSR support). The analyzer's built-in custom-element detection only follows a
 * superclass chain that ends at a literal `HTMLElement`/`LitElement`, so it skips
 * these three. This plugin builds their manifest entries from the same
 * `@customElement` / `@attr` / `@example` JSDoc block the other elements use.
 */
const STAFF_SUBCLASS_TAGS = {
  StaffElement: 'music-staff',
  StaffVocalElement: 'music-staff-vocal',
  StaffGuitarTabElement: 'music-staff-guitar-tab',
};

function commentText(comment) {
  if (!comment) {
    return '';
  }
  if (typeof comment === 'string') {
    return comment;
  }
  return comment.map((part) => part.text ?? '').join('');
}

function staffSubclassesPlugin() {
  return {
    name: 'staff-subclasses',
    analyzePhase({ ts, node, moduleDoc }) {
      if (!ts.isClassDeclaration(node) || !node.name) {
        return;
      }
      const className = node.name.text;
      const tagName = STAFF_SUBCLASS_TAGS[className];
      if (!tagName) {
        return;
      }

      const jsDocBlocks = node.jsDoc ?? [];
      const jsDoc = jsDocBlocks[jsDocBlocks.length - 1];
      const description = commentText(jsDoc?.comment).trim();

      const attributes = [];
      for (const tag of jsDoc?.tags ?? []) {
        if (!['attr', 'attribute'].includes(tag.tagName?.text)) {
          continue;
        }
        const raw = commentText(tag.comment).trim();
        const match = raw.match(/^(?:\{([^}]*)\}\s*)?(\S+?)\s+-\s+([\s\S]*)$/);
        if (!match) {
          continue;
        }
        const attribute = { name: match[2], description: match[3].trim() };
        if (match[1]) {
          attribute.type = { text: match[1] };
        }
        attributes.push(attribute);
      }

      moduleDoc.declarations ??= [];
      let declaration = moduleDoc.declarations.find(
        (d) => d.name === className
      );
      if (!declaration) {
        declaration = { kind: 'class', name: className };
        moduleDoc.declarations.push(declaration);
      }
      declaration.customElement = true;
      declaration.tagName = tagName;
      if (description) {
        declaration.description = description;
      }
      if (attributes.length) {
        declaration.attributes ??= [];
        for (const attribute of attributes) {
          const existing = declaration.attributes.find(
            (a) => a.name === attribute.name
          );
          if (existing) {
            existing.description = attribute.description;
            if (attribute.type) {
              existing.type = attribute.type;
            }
          } else {
            declaration.attributes.push(attribute);
          }
        }
      }

      moduleDoc.exports ??= [];
      const alreadyExported = moduleDoc.exports.some(
        (e) => e.kind === 'custom-element-definition' && e.name === tagName
      );
      if (!alreadyExported) {
        moduleDoc.exports.push({
          kind: 'custom-element-definition',
          name: tagName,
          declaration: { name: className, module: moduleDoc.path },
        });
      }
    },
  };
}

/**
 * The analyzer must see every `src` file so it can resolve the staff base-class
 * chain, but the published manifest should only describe the custom elements.
 * Drop every module that neither declares a custom element nor exports a
 * custom-element definition.
 */
function keepOnlyElementModulesPlugin() {
  return {
    name: 'keep-only-element-modules',
    packageLinkPhase({ customElementsManifest }) {
      customElementsManifest.modules = customElementsManifest.modules.filter(
        (mod) => {
          const declaresElement = (mod.declarations ?? []).some(
            (d) => d.customElement
          );
          const exportsElement = (mod.exports ?? []).some(
            (e) => e.kind === 'custom-element-definition'
          );
          return declaresElement || exportsElement;
        }
      );
    },
  };
}

export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.browser-test.ts',
    'src/**/*.spec.ts',
    'src/**/*.stories.ts',
    'src/**/*.d.ts',
    'src/test-fixtures/**',
    'src/storybook-utils/**',
  ],
  outdir: '.',
  litelement: false,
  fast: false,
  catalyst: false,
  plugins: [staffSubclassesPlugin(), keepOnlyElementModulesPlugin()],
};
