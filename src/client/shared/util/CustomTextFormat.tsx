import React from 'react';
import dayjs, { Dayjs } from 'dayjs';

interface ITextFormatProps {
  value: string | number | Date | Dayjs | null | undefined;
  type: 'date' | 'number';
  format?: string;
  blankOnInvalid?: boolean;
}

const CustomTextFormat: React.FC<ITextFormatProps> = ({ value, type, format, blankOnInvalid }) => {
  if (value === null || value === undefined) {
    return blankOnInvalid ? null : <span />;
  }

  if (type === 'date') {
    const date = dayjs(value);
    if (!date.isValid()) {
      return blankOnInvalid ? null : <span />;
    }
    return <span>{date.format(format || 'DD/MM/YYYY')}</span>;
  }

  return <span>{String(value)}</span>;
};

export default CustomTextFormat;
