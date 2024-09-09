import React, {useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import styles from '@assets/styles/Styles.tsx';
import config from '@config/config.js';
import {useSelector, useDispatch} from 'react-redux';
import {setOtp} from '@redux/actions/twoFactorAuthActions.tsx';
import {useTranslation} from 'react-i18next';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';
import * as otpService from '@services/OtpService.tsx';
import * as storage from '@utils/AppStorage.tsx';

const isOtpInvalid = otp => {
  return otp === null || otp === undefined || otp === '';
};

const AuthOtpScreen = ({route, navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {otp} = useSelector(state => state.twoFactorAuth);
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const {redirectPage, email} = route.params;

  const onBackButton = () => {
    dispatch(setOtp(null));
    
    navigation.navigate('Login');
  };

  const processOtpAuthentication = async () => {
    if (isOtpInvalid(otp)) {
      return;
    }

    setUI({...UI, loading: true });
    const response = await otpService.verifyOtp(email, otp);
    setUI({...UI, loading: false});

    if (!response.status) {

      await alert({
        type: DropdownAlertType.Error,
        title: t('OTP Authentication'),
        message: t("Invalid One-Time-Pin"),
      });
      
      return;
    }

    storage.set('accessToken', response.token);
    
    navigation.navigate(redirectPage, {
      email: email,
      otp: otp,
    });
  };

  return (
    <ImageBackground
      source={require('@assets/images/background.jpeg')}
      style={styles.backgroundImage}>
      <ScrollView>
        <View style={styles.container}>
          <Text
            style={{
              ...styles.title,
              marginTop: 100,
            }}>
            {config.appTitle}
          </Text>

          <Text
            style={{
              ...styles.title,
              textAlign: 'left',
              marginBottom: 5,
              marginLeft: 0,
            }}>
            {t('OTP AUTHENTICATION')}
          </Text>

          <Text
            style={{
              ...styles.shortDesc,
              textAlign: 'left',
              marginBottom: 15,
              fontStyle: 'italic',
              marginTop: 15,
            }}>
            {t(
              `An OTP (One-Time-Pin) has been sent to your registered account\'s mobile number. Kindly input the correct OTP to proceed to the next step. Thank you.`,
            )}
          </Text>

          <TextInput
            style={styles.input}
            placeholderTextColor="#3e3e3e"
            keyboardType="numeric"
            maxLength={6}
            placeholder={t('OTP (ONE-TIME-PIN)')}
            onChangeText={text => dispatch(setOtp(text))}
            value={otp}
          />

          <Text style={styles.errorText}>
            {otp !== null && otp === ''
              ? t('OTP (One-Time-Pin) is Required')
              : null}
          </Text>

          <TouchableOpacity
            onPress={processOtpAuthentication}
            style={{
              ...styles.primaryButton,
              opacity: isOtpInvalid(otp) ? 0.5 : 1,
            }}>
            <Text style={styles.primaryButtonText}>{t('SUBMIT')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onBackButton() }
            style={{...styles.linkButton, marginTop: 20}}>
            <Text style={styles.linkButtonText}>{t('BACK')}</Text>
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

export default AuthOtpScreen;
