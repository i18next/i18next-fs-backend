import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next.use(Backend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  },
});
