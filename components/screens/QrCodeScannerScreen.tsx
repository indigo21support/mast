import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, Text, Platform, TouchableOpacity, Alert} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {request, PERMISSIONS} from 'react-native-permissions';
import Icon from 'react-native-vector-icons/AntDesign';
import globalStyles from '@assets/styles/Styles';
import * as storage from '@utils/AppStorage';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';
import {useTranslation} from 'react-i18next';

const QrCodeScannerScreen = ({navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const [isCameraAuthorized, setCameraAuthorized] = useState(false);
  const [doneScanning, setDoneScanning] = useState(false);
  const {t} = useTranslation();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const cameraPermission = Platform.select({
      android: PERMISSIONS.ANDROID.CAMERA,
      ios: PERMISSIONS.IOS.CAMERA,
    });

    try {
      const result = await request(cameraPermission);
      if (result === 'granted') {
        setCameraAuthorized(true);
      }
    } catch (error) {
      console.log('Camera permission error:', error);
    }
  };

  
  const handleBarcodeScanned = async ({data}) => {
    if (doneScanning) {
      return;
    }

    setDoneScanning(true);
    
     try {
        const result = JSON.parse(data);

        if ('baseUrl' in result) {
         
          await setUI({
            ...UI,
            loading: true,
          });

            await storage.set('baseUrl', result.baseUrl);

            await alert({
              type: DropdownAlertType.Success,
              title: 'Success',
              message: t('Success'),
            });

            
            navigation.navigate('Login');
            setTimeout ( async () => {

              await setUI({
                ...UI,
                loading: false,
              });
  
            }, 2000);
        } else {
          
          await setUI({
            ...UI,
            loading: false,
          });

          await alert({
            type: DropdownAlertType.Error,
            title: 'Failed',
            message: t('Failed'),
          });
        }

     } catch (error) {
        console.log(error);
        await alert({
          type: DropdownAlertType.Error,
          title: 'Failed',
          message: t('Failed'),
        });
     }
  };

  return (
    <View style={styles.container}>
      <View style={globalStyles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={globalStyles.btnHeader}>
          <Icon
            name={'arrowleft'}
            size={25}
            color="#fff"
            style={{
              ...styles.icon,
              marginRight: 10,
            }}
          />
          <Text style={globalStyles.topHeaderTitle}>{'SCAN QR'}</Text>
        </TouchableOpacity>
      </View>

      {isCameraAuthorized ? (
        <RNCamera
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}
          onBarCodeRead={handleBarcodeScanned}
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        />
      ) : (
        <Text>Camera permission not granted</Text>
      )}

      <DropdownAlert
        style={styles.dropdownAlert}
        alert={func => (alert = func)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
});

export default QrCodeScannerScreen;
