import React, {useEffect} from 'react';
import './global.css';
import HomeStackNavigator from './src/stacks/Home';
import {Provider} from 'react-redux';
import {store} from './src/redux/store';
import {checkAppVersion} from './src/constants';
import {ThemeProvider} from './src/contexts/ThemeContext';

const App: React.FC = () => {
  useEffect(() => {
    checkAppVersion();
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
