import { formatDecimal } from '../util/decimal-format';
import React from 'react';
import dayjs from 'dayjs';

import { TranslatorContext } from './language';

interface TextFormatProps {
  value: string | number | Date;
  type: string;
  format?: string;
  blankOnInvalid?: boolean;
  locale?: string;
}

export const TextFormat = ({ value, type, format, blankOnInvalid, locale }: TextFormatProps) => {
  if (blankOnInvalid && (!value || !type)) return null;
  const activeLocale = locale ?? TranslatorContext.context.locale ?? undefined;

  if (type === 'date') {
    const date = dayjs(value);
    if (blankOnInvalid && !date.isValid()) return null;
    return <span>{activeLocale ? date.locale(activeLocale).format(format) : date.format(format)}</span>;
  }
  if (type === 'number') {
    return (
      <span>
        {typeof value === 'number' || typeof value === 'string'
          ? formatDecimal(value, Math.min(20, String(value).split('.')[1]?.length ?? 0), activeLocale)
          : String(value)}
      </span>
    );
  }
  return <span>{String(value)}</span>;
};
