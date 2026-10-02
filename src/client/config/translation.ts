import { TranslatorContext } from 'app/shared/jhipster/language';
import { Storage } from 'app/shared/jhipster/storage';

import { setLocale } from 'app/shared/reducers/locale';

TranslatorContext.setDefaultLocale('tr');
TranslatorContext.setRenderInnerTextForMissingKeys(false);

export const languages: any = {
  tr: { name: 'Türkçe' },
  en: { name: 'English' },
  // jhipster-needle-i18n-language-key-pipe - JHipster will add/remove languages in this object
};

export const locales = Object.keys(languages).sort();

export const registerLocale = store => {
  store.dispatch(setLocale(Storage.session.get('locale', 'tr')));
};
