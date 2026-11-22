import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next.use(Backend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  },
});

// create calls back once every language is written to addPath
new Backend().create?.(['en'], 'translation', 'key', 'value', () => {});
