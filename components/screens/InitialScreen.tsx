import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
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
import DropdownAlert from 'react-native-dropdownalert';

const hasErrorOnUserEntry = (username, password) => {
  return (
    username === '' ||
    password === '' ||
    username === undefined ||
    password === undefined
  );
};

const InitialScreen = ({navigation, UI, setUI}) => {
  const {username, password} = useSelector(state => state.login);
  const {opacityValue, setOpacity} = useState(0);
  const dispatch = useDispatch();

  const {t} = useTranslation();

  useEffect( () => {
    const checkSession = async () => {
      const isLoggedIn = await storage.exists('accessToken');
      const isBaseUrlExists = await storage.exists('baseUrl');

      switch (true) {
        case isBaseUrlExists && isLoggedIn:
            navigation.navigate('Dashboard');
        break;

        case isBaseUrlExists && !isLoggedIn:
            navigation.navigate('Login');
        break;
      }
    };

    checkSession();
  }, []);

  const handleQrCodeScanner = async () => {
    navigation.navigate('QrCodeScanner');
  };

  return (
    <ImageBackground
      source={require('@assets/images/background.jpeg')}
      style={styles.backgroundImage}>
      <ScrollView style={{
        opacity: opacityValue
      }}>
        <View style={styles.container}>
          <Image
            source={require('@assets/images/logo.png')}
            style={{...styles.logoImage, marginTop: 90}}
          />
          <Text style={styles.title}>{config.appTitle}</Text>

          <Text style={{
            ...styles.longDesc, 
            marginTop: 30,
            marginBottom: 30
            }}>
            {t('To obtain the web api configuration settings for the ' + config.appName + ' App, Please scan the QR Code in the web page. Thank you') }
          </Text>
          

          <TouchableOpacity style={styles.primaryButton} onPress={handleQrCodeScanner}>
            <Text style={styles.primaryButtonText}>{t('SCAN QR CODE')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default InitialScreen;
