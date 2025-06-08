// import React, {useEffect} from 'react';

// import './global.css';
// import HomeStackNavigator from './src/stacks/Home';
// import {Provider} from 'react-redux';
// import {store} from './src/redux/store';
// import {checkAppVersion} from './src/constants';

// const App: React.FC = () => {
//   useEffect(() => {
//     checkAppVersion();
//   }, []);

//   return (
//     <Provider store={store}>
//       <HomeStackNavigator />
//     </Provider>
//   );
// };

// export default App;

import React, {useEffect} from 'react';
import codePush from '@revopush/react-native-code-push';
import './global.css';
import HomeStackNavigator from './src/stacks/Home';
import {Provider} from 'react-redux';
import {store} from './src/redux/store';
import {checkAppVersion} from './src/constants';

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
    // kicks off the OTA update check
    checkAppVersion();
    codePush.sync(codePushOptions);
  }, []);

  return (
    <Provider store={store}>
      <HomeStackNavigator />
    </Provider>
  );
};

// Wrap your root App with the CodePush HOC before exporting.
// This HOC wires in the native bridge integration under the hood.
export default codePush(codePushOptions)(App);
