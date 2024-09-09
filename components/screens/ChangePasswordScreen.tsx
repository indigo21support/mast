import React, {useState} from 'react';
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
import {
  setPassword,
  setPasswordConfirmation,
  setEmail
} from '@redux/actions/forgotPasswordActions.tsx';
import {setOtp} from '@redux/actions/twoFactorAuthActions.tsx';
import {useTranslation} from 'react-i18next';
import ChangePasswordDto from '@objects/interfaces/ChangePasswordDto.tsx';
import * as changePasswordService from '@services/ChangePasswordService.tsx';
import * as utils from '@utils/Utils.tsx';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';


const hasInvalidPassword: boolean = (
  password: string,
  passwordConfirmation: string,
) => {
  return (
    password === '' ||
    passwordConfirmation === '' ||
    passwordConfirmation === null ||
    password === null ||
    password !== passwordConfirmation
  );
};

const ChangePasswordScreen = ({route, navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {otp, email} = useSelector(state => state.twoFactorAuth);
  const {password, passwordConfirmation} = useSelector(
    state => state.forgotPassword,
  );
  const dispatch = useDispatch();
  const {t} = useTranslation();

  const resetFormInputs = () => {
    dispatch(setPassword(null));
    dispatch(setPasswordConfirmation(null));
    dispatch(setOtp(null));
    dispatch(setEmail(null));
  };

  const onBackButton = () => {
    resetFormInputs();
    navigation.navigate('Login');
  };

  const processChangePassword = async () => {
    if (hasInvalidPassword(password, passwordConfirmation)) {
      return;
    }

    if (!utils.isPasswordSecured(password)) {

      await alert({
        type: DropdownAlertType.Error,
        title: t('Change Password'),
        message: t("The password that you are trying to submit does't meet the password security standands. please update your password to a secured one. Thank you"),
      });
      
      return;
    }

    const changePasswordDto: ChangePasswordDto = {
      otp: otp,
      email: email,
      password: password,
    };

    setUI({...UI, loading: true});
    console.log(changePasswordDto);
    const response = await changePasswordService.changeUserPassword(
      changePasswordDto,
    );
    setUI({...UI, loading: false});

    if (response.status) {
      resetFormInputs();

      setUI({...UI, loading: false});
      setUI({
        ...UI,
        alert: true,
        alertTitle: t('COMPLETED'),
        alertMessage: t(
          'You have successfully changed your password. Thank you',
        ),
        alertOnClose: () => {
          navigation.navigate('Login');
        },
      });
    } else {
      await alert({
        type: DropdownAlertType.Error,
        title: t('Change Password'),
        message: t('An error occured. Please check your entries. Thank you'),
      });
    }
  };

  return (
    <ImageBackground
      source={require('@assets/images/background.jpeg')}
      style={styles.backgroundImage}>
      <DropdownAlert
        style={styles.dropdownAlert}
        ref={ref => {
          if (ref) {
            dropDownAlertRef = ref;
          }
        }}
      />

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
            {t('CHANGE PASSWORD')}
          </Text>

          <Text
            style={{
              ...styles.shortDesc,
              textAlign: 'left',
              fontStyle: 'italic',
              marginBottom: 15,
              marginTop: 15,
            }}>
            {t(
              `To obtain a secure password, the password should contain both uppercase and lowercase characters with minimum of 8 characters, at least one numeric digit, and one special character.`,
            )}
          </Text>

          <TextInput
            style={styles.input}
            placeholderTextColor="#3e3e3e"
            placeholder={t('New Password')}
            onChangeText={text => dispatch(setPassword(text))}
            value={password}
            secureTextEntry={true}
          />

          <Text style={styles.errorText}>
            {password === '' ? t('Password is required') : null}
          </Text>

          <TextInput
            style={{...styles.input}}
            placeholderTextColor="#3e3e3e"
            secureTextEntry={true}
            placeholder={t('New Password Confirmation')}
            onChangeText={text => dispatch(setPasswordConfirmation(text))}
            value={passwordConfirmation}
          />

          <Text style={styles.errorText}>
            {passwordConfirmation === ''
              ? t('Password confirmation is required')
              : null}
          </Text>

          <TouchableOpacity
            onPress={processChangePassword}
            style={{
              ...styles.primaryButton,
              opacity: hasInvalidPassword(password, passwordConfirmation)
                ? 0.5
                : 1,
            }}>
            <Text style={styles.primaryButtonText}>{t('SAVE CHANGES')}</Text>
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

export default ChangePasswordScreen;
