import React, { useSyncExternalStore } from 'react';

type TranslationTree = Record<string, unknown>;
type InterpolationValues = Record<string, string | number | null | undefined>;

interface TranslatorState {
  previousLocale: string | null;
  defaultLocale: string | null;
  locale: string | null;
  lastChange: number;
  translations: Record<string, TranslationTree>;
  renderInnerTextForMissingKeys: boolean;
  missingTranslationMsg: string;
}

const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

const mergeTranslations = (target: TranslationTree, source: TranslationTree): TranslationTree => {
  for (const [key, value] of Object.entries(source)) {
    if (blockedKeys.has(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const current = target[key];
      target[key] = mergeTranslations(
        current && typeof current === 'object' && !Array.isArray(current) ? (current as TranslationTree) : {},
        value as TranslationTree,
      );
    } else {
      target[key] = value;
    }
  }
  return target;
};

const findTranslation = (tree: unknown, segments: string[]): unknown => {
  if (segments.length === 0) return tree;
  if (!tree || typeof tree !== 'object') return undefined;

  for (let end = 1; end <= segments.length; end += 1) {
    const key = segments.slice(0, end).join('.');
    if (!Object.prototype.hasOwnProperty.call(tree, key)) continue;
    const result = findTranslation((tree as TranslationTree)[key], segments.slice(end));
    if (result !== undefined) return result;
  }
  return undefined;
};

export class TranslatorContext {
  static context: TranslatorState = {
    previousLocale: null,
    defaultLocale: null,
    locale: null,
    lastChange: Date.now(),
    translations: {},
    renderInnerTextForMissingKeys: true,
    missingTranslationMsg: 'translation-not-found',
  };

  private static listeners = new Set<() => void>();

  static subscribe = (listener: () => void) => {
    TranslatorContext.listeners.add(listener);
    return () => TranslatorContext.listeners.delete(listener);
  };

  static getSnapshot = () => TranslatorContext.context.lastChange;

  private static change() {
    TranslatorContext.context.lastChange += 1;
    TranslatorContext.listeners.forEach(listener => listener());
  }

  static registerTranslations(locale: string, translation: TranslationTree) {
    const current = TranslatorContext.context.translations[locale] ?? {};
    TranslatorContext.context.translations[locale] = mergeTranslations(current, translation);
    TranslatorContext.change();
  }

  static setDefaultLocale(locale: string) {
    TranslatorContext.context.defaultLocale = locale;
    TranslatorContext.change();
  }

  static setMissingTranslationMsg(message: string) {
    TranslatorContext.context.missingTranslationMsg = message;
    TranslatorContext.change();
  }

  static setRenderInnerTextForMissingKeys(value: boolean) {
    TranslatorContext.context.renderInnerTextForMissingKeys = value;
    TranslatorContext.change();
  }

  static setLocale(locale: string) {
    TranslatorContext.context.previousLocale = TranslatorContext.context.locale;
    TranslatorContext.context.locale = locale || TranslatorContext.context.defaultLocale;
    TranslatorContext.change();
  }
}

const interpolate = (value: string, values?: InterpolationValues): React.ReactNode => {
  if (!values) return value;
  const matches = [...value.matchAll(/{{\s*(\w+)\s*}}/g)];
  if (matches.length === 0) return value;

  const parts: (string | number | null | undefined)[] = [];
  let cursor = 0;
  matches.forEach(match => {
    const matchIndex = match.index ?? 0;
    parts.push(value.slice(cursor, matchIndex));
    const replacement = values[match[1]];
    parts.push(replacement);
    cursor = matchIndex + match[0].length;
  });
  parts.push(value.slice(cursor));

  return parts.map(part => (part == null ? '' : String(part))).join('');
};

const allowedTags = new Set(['A', 'B', 'BR', 'EM', 'HR', 'I', 'STRONG']);
const voidTags = new Set(['BR', 'HR']);

const safeHref = (href: string | null) => {
  if (!href) return undefined;
  if (href.startsWith('/')) return href;
  try {
    const url = new URL(href);
    return ['http:', 'https:'].includes(url.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
};

const renderSafeHtml = (html: string): React.ReactNode => {
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, '');
  const document = new DOMParser().parseFromString(html, 'text/html');

  const convert = (node: Node, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as HTMLElement;
    const children = Array.from(element.childNodes).map((child, index) => convert(child, `${key}-${index}`));
    if (!allowedTags.has(element.tagName)) return React.createElement(React.Fragment, { key }, children);

    const props: Record<string, unknown> = { key };
    if (element.tagName === 'A') {
      props.href = safeHref(element.getAttribute('href'));
      if (element.getAttribute('target') === '_blank') {
        props.target = '_blank';
        props.rel = 'noopener noreferrer';
      }
    }
    return voidTags.has(element.tagName)
      ? React.createElement(element.tagName.toLowerCase(), props)
      : React.createElement(element.tagName.toLowerCase(), props, children);
  };

  return Array.from(document.body.childNodes).map((node, index) => convert(node, `translation-${index}`));
};

const resolveTranslation = (contentKey: string, values?: InterpolationValues, children?: React.ReactNode): React.ReactNode => {
  const { translations, locale, defaultLocale, renderInnerTextForMissingKeys, missingTranslationMsg } = TranslatorContext.context;
  if (Object.keys(translations).length === 0) return null;

  const activeLocale = locale || defaultLocale;
  const translated = activeLocale ? findTranslation(translations[activeLocale], contentKey.split('.')) : undefined;
  const fallback = renderInnerTextForMissingKeys && children != null ? children : `${missingTranslationMsg}[${contentKey}]`;
  const raw = ['boolean', 'number', 'string'].includes(typeof translated) ? String(translated) : fallback;
  const rendered = typeof raw === 'string' ? interpolate(raw, values) : raw;

  return typeof rendered === 'string' && /<[a-z][\s\S]*>/i.test(rendered) ? renderSafeHtml(rendered) : rendered;
};

interface TranslateProps {
  contentKey: string;
  interpolate?: InterpolationValues;
  component?: React.ElementType;
  children?: React.ReactNode;
}

export const Translate = ({ contentKey, interpolate: values, component: Component = 'span', children }: TranslateProps) => {
  useSyncExternalStore(TranslatorContext.subscribe, TranslatorContext.getSnapshot, TranslatorContext.getSnapshot);
  return React.createElement(Component, null, resolveTranslation(contentKey, values, children));
};

export const translate = (contentKey: string, values?: InterpolationValues, children?: React.ReactNode): any =>
  resolveTranslation(contentKey, values, children);

export default Translate;
