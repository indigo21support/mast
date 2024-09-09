import React, {useState} from 'react';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '@components/screens/LoginScreen';
import DashboardScreen from '@components/screens/DashboardScreen';
import ForgotPasswordScreen from '@components/screens/ForgotPasswordScreen';
import SurveySummaryScreen from '@components/screens/SurveySummaryScreen';
import AuthOtpScreen from '@components/screens/AuthOtpScreen';
import ChangePasswordScreen from '@components/screens/ChangePasswordScreen';
import InitialScreen from '@components/screens/InitialScreen';
import SendMessageScreen from '@components/screens/SendMessageScreen';
import QrCodeScannerScreen from '@components/screens/QrCodeScannerScreen';
import JobDetailsScreen from '@components/screens/JobDetailsScreen';
import PreviousMemorialMapScreen from '@components/screens/PreviousMemorialMapScreen';
import PdfViewerScreen from '@components/screens/PdfViewerScreen';
import MemorialFormDetails from '@components/screens/MemorialFormDetails';
import SurveyQuestions from '@components/SurveyQuestions';
import store from '@redux/store';
import FullPageLoading from '@components/common/FullPageLoading';
import FullPageAlert from '@components/common/FullPageAlert';
import FullPageConfirm from '@components/common/FullPageConfirm';
import FullPageMenu from '@components/common/FullPageMenu';
import {MenuProvider} from 'react-native-popup-menu';
import ImageView from 'react-native-image-viewing';
import './locales/index';

const Stack = createNativeStackNavigator();

const App = () => {
  const [UI, setUI] = useState({
    loading: false,
    loadingTitle: 'Please Wait',
    alertType: 'success',
    alert: false,
    alertTitle: 'COMPLETED!',
    alertMessage: '',
    alertOnClose: () => {},
    confirm: false,
    confirmType: 'success',
    confirmTitle: 'ARE YOU SURE?',
    confirmMessage: '',
    confirmOnCancel: () => {},
    confirmOnOkay: () => {},
    menu: false,
    menuTitle: 'Action',
    menuActions: [],
    imageViewer: false,
    imageFiles: [],
    imageIndex: 0,
    imageOnLongPress: () => {},
    refresh: 0
  });

  return (
    <MenuProvider>
      <Provider store={store}>
        {UI.loading ? <FullPageLoading title={UI.loadingTitle} /> : null}

        {UI.menu ? <FullPageMenu UI={UI} setUI={setUI} /> : null}

        <ImageView
          images={UI.imageFiles}
          imageIndex={UI.imageIndex}
          visible={UI.imageViewer}
          onLongPress={ (gesture, image) => {
            setUI({...UI, imageViewer: false });
            UI.imageOnLongPress(gesture);
          }}
          onRequestClose={() => setUI({...UI, imageViewer: false})}
        />

        <NavigationContainer>
          {UI.alert ? (
            <FullPageAlert
              type={UI.alertType}
              title={UI.alertTitle}
              message={UI.alertMessage}
              onClose={() => {
                setUI({...UI, alert: false});
                UI.alertOnClose();
              }}
            />
          ) : null}

          {UI.confirm ? (
            <FullPageConfirm
              type={UI.confirmType}
              title={UI.confirmTitle}
              message={UI.confirmMessage}
              onOkay={() => {
                setUI({...UI, confirm: false});
                UI.confirmOnOkay();
              }}
              onCancel={() => {
                setUI({...UI, confirm: false});
                UI.confirmOnCancel();
              }}
            />
          ) : null}

          <Stack.Navigator>

            <Stack.Screen
              name="InitialScreen"
              options={{
                headerShown: false,
              }}>
              {props => <InitialScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen
              name="Login"
              options={{
                headerShown: false,
              }}>
              {props => <LoginScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="ForgotPassword" options={{headerShown: false}}>
              {props => (
                <ForgotPasswordScreen {...props} UI={UI} setUI={setUI} />
              )}
            </Stack.Screen>

            <Stack.Screen name="OTP" options={{headerShown: false}}>
              {props => <AuthOtpScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="ChangePassword" options={{headerShown: false}}>
              {props => (
                <ChangePasswordScreen {...props} UI={UI} setUI={setUI} />
              )}
            </Stack.Screen>

            <Stack.Screen name="Dashboard" options={{headerShown: false}}>
              {props => <DashboardScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="SurveyQuestions" options={{headerShown: false}}>
              {props => <SurveyQuestions {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="SurveySummary" options={{headerShown: false}}>
              {props => <SurveySummaryScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="JobDetails" options={{headerShown: false}}>
              {props => <JobDetailsScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="QrCodeScanner" options={{headerShown: false}}>
              {props => <QrCodeScannerScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="MemorialDetails" options={{headerShown: false}}>
              {props => <MemorialFormDetails {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="PdfViewer" options={{headerShown: false}}>
              {props => <PdfViewerScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="SendMessage" options={{headerShown: false}}>
              {props => <SendMessageScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

            <Stack.Screen name="PreviousMemorialMap" options={{headerShown: false}}>
              {props => <PreviousMemorialMapScreen {...props} UI={UI} setUI={setUI} />}
            </Stack.Screen>

          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    </MenuProvider>
  );
};

export default App;
