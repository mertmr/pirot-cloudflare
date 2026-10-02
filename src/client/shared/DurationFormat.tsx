import React from 'react';
import { TranslatorContext } from 'app/shared/jhipster/language';

import dayjs from 'dayjs';

export interface IDurationFormat {
  value: any;
  blankOnInvalid?: boolean;
  locale?: string;
}

export const DurationFormat = ({ value, blankOnInvalid, locale }: IDurationFormat) => {
  if (blankOnInvalid && !value) {
    return null;
  }

  if (!locale) {
    locale = TranslatorContext.context.locale ?? undefined;
  }

  return (
    <span title={value}>
      {dayjs
        .duration(value)
        .locale(locale ?? 'tr')
        .humanize()}
    </span>
  );
};
