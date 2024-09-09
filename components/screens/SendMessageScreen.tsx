import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb';
import * as storage from '@utils/AppStorage';
import globalStyles from '@assets/styles/Styles';
import {useSelector} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound';
import * as utils from '@utils/Utils';
import * as syncService from '@services/SyncService';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';

const SendMessageScreen = ({navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {questions} = useSelector(state => state.surveyQuestion);
  const [pageTitle, setPageTitle] = useState('NEW MESSAGE');
  const [jobDetails, setJobDetails] = useState({});
  const [subject, setSubject] = useState(null);
  const [message, setMessage] = useState(null);

  const {t} = useTranslation();

  const sendMessage = async () => {
    if (message === '' || message === null) {
      return;
    }

    const memorialId = await storage.get('memorialId');
    const userStr = await storage.get('user');
    const user = JSON.parse(userStr);

    console.log(user);

    setUI({
        ...UI,
        loading: true,
    });

    const response = await syncService.processSendMessage('', message, memorialId);
    setMessage(null);

    console.log(response);

    setUI({
        ...UI,
        loading: false,
    });

    await alert({
      type: DropdownAlertType.Success,
      title: t('Message Sent!'),
      message: t('You have successfully sent your message. Thank you'),
    });

    setTimeout ( () => {
        navigation.goBack();
    }, 1000);
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
          <Text style={globalStyles.topHeaderTitle}>{pageTitle}</Text>
        </TouchableOpacity>
      </View>

{/*       
      <View style={{...styles.formRow, marginTop: 30}}>
        <TextInput
          style={{...globalStyles.input, marginLeft: 0, width: '100%'}}
          placeholderTextColor="#3e3e3e"
          placeholder={t('SUBJECT')}
          onChangeText={setSubject}
          value={subject}
        />

        <Text style={globalStyles.errorText}>{subject === '' ? t('Invalid Subject') : ''}</Text>
      </View> */}

      <View style={{...styles.formRow, marginTop: 20 }}>
        <TextInput
            editable
          multiline={true}
          numberOfLines={10}
          style={{...globalStyles.input, marginLeft: 0, width: '100%'}}
          placeholderTextColor="#3e3e3e"
          placeholder={t('MESSAGE')}
          onChangeText={setMessage}
          value={message}
        />

        <Text style={globalStyles.errorText}>{message === '' ? t('Invalid Message') : ''}</Text>
      </View>

      <View style={styles.formRow}>
        <TouchableOpacity onPress={sendMessage}  style={{...globalStyles.primaryButton, marginLeft: 0, opacity: (message === '' || message === null ? 0.5 : 1) }} >
          <Text style={globalStyles.primaryButtonText}>{t('SEND')}</Text>
        </TouchableOpacity>
      </View>

      <DropdownAlert
        style={globalStyles.dropdownAlert}
        alert={func => (alert = func)}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  summaryText: {
    color: '#000',
    fontSize: 15,
    width: '30%',
    textAlign: 'right',
  },
  formRow: {
    paddingLeft: 10,
    paddingRight: 10
  },
  summaryTextValue: {
    color: '#000',
    fontSize: 15,
    width: '50%',
    fontWeight: 'bold',
    paddingLeft: 30,
  },
  summaryItem: {
    backgroundColor: '#dadada',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  attachText: {
    marginRight: 10,
    color: '#000',
  },
  attachment: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  questionNumber: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  itemTitle: {
    color: '#000',
    fontWeight: 'normal',
    fontSize: 18,
  },
  itemCategory: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: '#000',
    width: '100%',
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#dadada',
    height: 40,
  },
  comments: {
    fontSize: 14,
    color: '#000',
    width: '100%',
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#dadada',
    height: 60,
  },
  container: {
    flex: 1,
    width: '100%',
    paddingBottom: 20,
    display: 'flex',
  },
  itemCategoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  item: {
    backgroundColor: '#e0e0e0',
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 30,
    paddingTop: 10,
    marginBottom: 20,
    width: '100%',
    borderRadius: 20,
    minHeight: 80,
  },
});

export default SendMessageScreen;
