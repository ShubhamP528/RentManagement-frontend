import React, {useEffect} from 'react';
import './global.css';
import HomeStackNavigator from './src/stacks/Home';
import {Provider} from 'react-redux';
import {store} from './src/redux/store';
import {checkAppVersion} from './src/constants';
import {ThemeProvider} from './src/contexts/ThemeContext';
import codePush from '@revopush/react-native-code-push';

// Optional: define sync options
const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
  installMode: codePush.InstallMode.IMMEDIATE,
  updateDialog: {
    title: 'Update available',
    optionalUpdateMessage:
      'A new version is ready. Would you like to install it now?',
    optionalInstallButtonLabel: 'Yes',
    optionalIgnoreButtonLabel: 'Later',
  },
};
const App: React.FC = () => {
  useEffect(() => {
    checkAppVersion();
    codePush.sync(codePushOptions);
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <HomeStackNavigator />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
