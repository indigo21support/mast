import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb';
import * as storage from '@utils/AppStorage';
import globalStyles from '@assets/styles/Styles';
import {useSelector} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound';
import * as utils from '@utils/Utils';

const JobDetailsScreen = ({navigation, UI, setUI}) => {
  const {search, data} = useSelector(state => state.bookedJob);
  const {questions} = useSelector(state => state.surveyQuestion);
  const [pageTitle, setPageTitle] = useState('');
  const [jobDetails, setJobDetails] = useState({});

  const {t} = useTranslation();

  const processSubmitSurvey = async () => {
    if (answered < questions.length) {
      return;
    }

    const memorialId = await storage.get('memorialId');
    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%memorialId-' + memorialId + '-%',
    );

    navigation.navigate('Dashboard');
  };

  const fetchData = async () => {
    const memorialId = await storage.get('memorialId');

    const graveNumber = await storage.get('graveNumber');
    const jd = await database.getRecords('Jobs', 'memorialId = ?', [memorialId]);
    console.log(jd);

    setJobDetails(jd[0]);

    setPageTitle(t(jd[0]['familyName'] + ' - ' + graveNumber));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 1000);
  }, [search]);

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

      <View style={styles.summaryItem}>
        <Text style={styles.summaryText}>{t('Question Set')}:</Text>
        <Text style={{...styles.summaryTextValue}}>{jobDetails.questionSet}</Text>
      </View>

      <View style={{...styles.summaryItem, backgroundColor: '#fff'}}>
        <Text style={styles.summaryText}>{t('Scheme Name')}:</Text>
        <Text style={{...styles.summaryTextValue}}>{jobDetails.schemeShortName}</Text>
      </View>

      <View style={styles.summaryItem}>
        <Text style={styles.summaryText}>{t('Cemetery Name')}:</Text>
        <Text style={{...styles.summaryTextValue}}>{jobDetails.cemeteryName}</Text>
      </View>
      
      <View style={{...styles.summaryItem, backgroundColor: '#fff'}}>
        <Text style={styles.summaryText}>{t('Memorial Height')}:</Text>
        <Text style={{...styles.summaryTextValue}}>{jobDetails.memorialHeightName}</Text>
      </View>

      <View style={{...styles.summaryItem}}>
        <Text style={styles.summaryText}>{t('Section')}:</Text>
        <Text style={{...styles.summaryTextValue}}>{jobDetails.section}</Text>
      </View>

      <View style={{...styles.summaryItem, backgroundColor: '#fff'}}>
        <Text style={styles.summaryText}>{t('Status')}:</Text>
        <Text style={{...styles.summaryTextValue}}>{jobDetails.statusName}</Text>
      </View>



     
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

export default JobDetailsScreen;
