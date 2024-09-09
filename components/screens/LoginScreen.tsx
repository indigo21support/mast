import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import {connect, useSelector, useDispatch} from 'react-redux';
import styles from '@assets/styles/Styles.tsx';
import config from '@config/config.js';
import {setUsername, setPassword} from '@redux/actions/loginActions.tsx';
import {useTranslation} from 'react-i18next';
import * as loginService from '@services/LoginService.tsx';
import * as storage from '@utils/AppStorage.tsx';
import {setOtp} from '@redux/actions/twoFactorAuthActions.tsx';
import RequestResponse from '@objects/interfaces/RequestResponse.tsx';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';

const hasErrorOnUserEntry = (username, password) => {
  return (
    username === '' ||
    password === '' ||
    username === undefined ||
    password === undefined
  );
};

const LoginScreen = ({navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {username, password} = useSelector(state => state.login);
  const dispatch = useDispatch();

  const {t} = useTranslation();

  const scanQrCode = () => {
    navigation.navigate('QrCodeScanner');
  };

  useEffect( () => {
    const checkSession = async () => {
      const isLoggedIn = await storage.exists('accessToken');
      const isBaseUrlExists = await storage.exists('baseUrl');

      if(!isBaseUrlExists) {
          navigation.navigate('QrCodeScanner');
          return;
      }

      if (isLoggedIn) {
        navigation.navigate('Dashboard');
      }
    };

    checkSession();
  }, []);

  const handleLogin = async () => {
    if (hasErrorOnUserEntry(username, password)) {
      dispatch(setUsername(''));
      dispatch(setPassword(''));
      return;
    }

    setUI({
      ...UI,
      loading: true,
    });

    const result: RequestResponse = await loginService.loginUser(
      username,
      password,
    );

    setUI({
      ...UI,
      loading: false,
    });

    if (result.status) {
      dispatch(setOtp(null));
      dispatch(setUsername(undefined));
      dispatch(setPassword(undefined));

      navigation.navigate((config.enableOtpSecurity ? 'OTP' : 'Dashboard'), {
        redirectPage: 'Dashboard',
        email: username,
      });
    } else {

      await alert({
        type: DropdownAlertType.Error,
        title: t('Login Authentication'),
        message: t('Invalid Email or Password, Please check you entries. Thank you'),
      });
    }
  };

  return (
    <ImageBackground
      source={require('@assets/images/background.jpeg')}
      style={styles.backgroundImage}>
      <ScrollView>
        <View style={{...styles.container,
        height: Dimensions.get('window').height
        }}>
          <Image
            source={require('@assets/images/logo.png')}
            style={{...styles.logoImage, marginTop: 90}}
          />
          <Text style={styles.title}>{config.appTitle}</Text>

          <TextInput
            style={styles.input}
            placeholderTextColor="#3e3e3e"
            placeholder="Email"
            onChangeText={text => dispatch(setUsername(text))}
            value={username}
          />

          <Text style={styles.errorText}>
            {username !== null && username === '' ? t('Invalid Email') : null}
          </Text>

          <TextInput
            placeholderTextColor="#3e3e3e"
            style={styles.input}
            placeholder={t('Password')}
            onChangeText={text => dispatch(setPassword(text))}
            value={password}
            secureTextEntry={true}
          />

          <Text style={styles.errorText}>
            {password !== null && password === ''
              ? t('Invalid Password')
              : null}
          </Text>

          <Text
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordLink}>
            {t('Forgot Password?')}
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{t('LOGIN')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={scanQrCode} style={styles.changeQrCode}>
              <Text style={styles.changeQrCodeText}>{t('Scan QR Code') }</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DropdownAlert
        style={styles.dropdownAlert}
        alert={func => (alert = func)}
      />

    </ImageBackground>
  );
};

const mapStateToProps = state => ({
  username: state.login.username,
  password: state.login.password,
});

const mapDispatchToProps = dispatch => ({
  updateUsername: username =>
    dispatch({type: 'SET_USERNAME', payload: username}),
  updatePassword: password =>
    dispatch({type: 'SET_PASSWORD', payload: password}),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);
