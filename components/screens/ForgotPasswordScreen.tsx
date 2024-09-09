import React, {useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import styles from '@assets/styles/Styles.tsx';
import config from '@config/config.js';
import {setEmail} from '@redux/actions/forgotPasswordActions.tsx';
import {useTranslation} from 'react-i18next';
import * as forgotPassService from '@services/ForgotPasswordService.tsx';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';

const ForgotPasswordScreen = ({navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {email} = useSelector(state => state.forgotPassword);
  const dispatch = useDispatch();
  const {t} = useTranslation();

  const onBackButton = () => {
    dispatch(setEmail(null));

    navigation.navigate('Login');
  };

  const validateEmail = async () => {
    if (email === null || email === '') {
      return;
    }

    setUI({...UI, loading: true});
    const response = await forgotPassService.verifyUserByEmail(email);
    setUI({...UI, loading: false});

    if (response.status) {
      navigation.navigate('OTP', {
        email: email,
        redirectPage: 'ChangePassword',
      });
    } else {

      await alert({
        type: DropdownAlertType.Error,
        title: t('Forgot Password'),
        message: t("Your email doesn't exists."),
      });
    }
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
            {t('FORGOT PASSWORD')}
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
              'Please provide your email so we can verify your account and send the OTP security code. Thank you.',
            )}
          </Text>

          <TextInput
            style={styles.input}
            placeholderTextColor="#3e3e3e"
            placeholder={t('Email')}
            onChangeText={text => dispatch(setEmail(text))}
            value={email}
          />

          <Text style={styles.errorText}>
            {email !== null && email === '' ? t('Invalid Email') : null}
          </Text>

          <TouchableOpacity
            onPress={validateEmail}
            style={{
              ...styles.primaryButton,
              opacity: email === null || email === '' ? 0.5 : 1,
            }}>
            <Text style={styles.primaryButtonText}>{t('SUBMIT')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onBackButton()}
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

export default ForgotPasswordScreen;
