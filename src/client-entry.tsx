import { Provider } from 'react-redux';
import { bindActionCreators } from 'redux';
import App from './client/app';
import setupAxiosInterceptors from './client/config/axios-interceptor';
import { loadIcons } from './client/config/icon-loader';
import getStore from './client/config/store';
import { registerLocale } from './client/config/translation';
import { clearAuthentication } from './client/shared/reducers/authentication';
const store = getStore();
registerLocale(store);
const actions = bindActionCreators({ clearAuthentication }, store.dispatch);
setupAxiosInterceptors(() => actions.clearAuthentication('login.error.unauthorized'));
loadIcons();
export default function Pirot() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
