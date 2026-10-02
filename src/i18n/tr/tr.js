import { all } from 'deepmerge';

// Load all locale fragments eagerly so translations are available at startup.
const modules = import.meta.glob('./*.json', { eager: true, import: 'default' });
const translations = Object.values(modules);

export default all(translations);
