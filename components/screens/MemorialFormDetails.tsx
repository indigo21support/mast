import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb';
import * as storage from '@utils/AppStorage';
import globalStyles from '@assets/styles/Styles';
import {useSelector} from 'react-redux';
import MessageScreen from '../MessageScreen';
import QuestionCheckboxes from '../QuestionCheckboxes';
import OtherCheckbox from '../OtherCheckbox';
import PhotoGrids from '../PhotoGrids';
import MapCustom from '@components/MapCustom';
import {
  getAllPhotosByMemorialAndQuestions,
  viewActionMenu,
  updateMemorialHeightData,
  processPhotoAttachment,
} from '../../helpers/MemorialDataHelper';

const MemorialFormDetails = ({navigation, UI, setUI}) => {
  const {t} = useTranslation();
  const [pageInfo, setPageInfo] = useState({
    pageTitle: '',
    category: 'SELECT',
    memorialHeight: 'SELECT',
    memorialHeightId: -1,
    attachment: '',
    photos: [],
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const {questions} = useSelector(state => state.surveyQuestion);

  const fetchData = async () => {
    const memorialId = await storage.get('memorialId');
    const graveNumber = await storage.get('graveNumber');
    const jd = await database.getRecords('Jobs', 'memorialId = ?', [
      memorialId,
    ]);

    setPageInfo(prevPageInfo => {
      return {
        ...prevPageInfo,
        pageTitle: jd[0]['familyName'] + ' - ' + graveNumber,
      };
    });

    setPageInfo(prevPageInfo => {
      return {
        ...prevPageInfo,
        currentGraveNumber: graveNumber,
      };
    });
  };

  const viewSummaryDetails = async () => {
    navigation.pop();
    navigation.navigate('SurveySummary');
  };

  const viewPDF = async () => {
    navigation.navigate('PdfViewer');
  };

  const viewPreviousMemorialLocation = async () => {
    navigation.navigate('PreviousMemorialMap');
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const getCurrentRecord = async () => {
      const memorialId = await storage.get('memorialId');

      const item = {
        questionNumber: 'Q1',
      };

      const record = await database.getRecords(
        'CompletedMemorials',
        'memorialId = ? AND questionNumber = ?',
        [memorialId, item.questionNumber],
      );

      if (record.length > 0) {
        if (record[0].passFail !== '') {
          await storage.set('currentCategory', record[0].passFail);
          setPageInfo(prevPageInfo => {
            return {
              ...prevPageInfo,
              category: record[0].passFail.toUpperCase(),
            };
          });
        }

        if (record[0].comments !== '') {
          //setComment(record[0].comments);
        }
      }
    };

    getCurrentRecord();
  }, []);

  useEffect(() => {
    const getMemorialHeightValue = async () => {
      const memorialId = await storage.get('memorialId');

      const memorials = await database.getRecords('Jobs', 'memorialId = ?', [
        memorialId,
      ]);

      if (memorials.length > 0) {
        const name = memorials[0]['memorialHeightName'];
        if (name !== 'null') {
          setPageInfo(prevPageInfo => {
            return {
              ...prevPageInfo,
              memorialHeight: name,
            };
          });
        }
      }
    };

    getMemorialHeightValue();
  }, []);

  const viewMemorialHeight = async () => {
    const result = await database.getRecords('MemorialHeights', '', []);

    const options = [];

    for (const i in result) {
      const data = result[i];

      options.push({
        title: data['Name'],
        onPress: async () => {
          setPageInfo(prevPageInfo => {
            return {
              ...prevPageInfo,
              memorialHeight: data['Name'],
              memorialHeightId: data['OriginalId'],
            };
          });

          await updateMemorialHeightData(data);
        },
      });
    }

    setUI({
      ...UI,
      menu: true,
      menuTitle: t('MEMORIALS'),
      menuActions: options,
    });
  };

  useEffect(() => {
    const getPhotos = async () => {
      const imgs = await getAllPhotosByMemorialAndQuestions('Q3', setPageInfo);

      if (imgs.length === 0) {
        setPageInfo(prevPageInfo => {
          return {
            ...prevPageInfo,
            attachment: '',
          };
        });
        return;
      }

      setPageInfo(prevPageInfo => {
        return {
          ...prevPageInfo,
          photos: imgs,
        };
      });
    };

    getPhotos();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsMapReady(true);
    }, 1);

    return () => clearTimeout(timeout);
  }, []);

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
              marginRight: 10,
            }}
          />
          <Text style={globalStyles.topHeaderTitle}>{pageInfo.pageTitle}</Text>
        </TouchableOpacity>
      </View>

      <MessageScreen navigation={navigation} UI={UI} setUI={setUI} />

      <ScrollView style={styles.container}>
        <Text style={styles.genericQuestionMsg}>
          {t('Q1. Does memorial pass current safety test requirements')}
        </Text>

        <TouchableOpacity
          onPress={() => viewActionMenu(setPageInfo, setUI, UI, t)}
          style={{
            ...styles.itemCategory,
            marginTop: 0,
            marginLeft: 10,
            marginRight: 10,
            width: 'auto',
          }}>
          <Text style={styles.itemCategoryText}>{pageInfo.category}</Text>
        </TouchableOpacity>

        {pageInfo.category === 'FAIL' || pageInfo.category === 'FAILED' ? (
          <View>
            <Text
              style={{
                ...styles.genericQuestionMsg,
                marginLeft: 50,
              }}>
              Q1.A Reason for failure test?
            </Text>

            {questions.map((item, index) => (
              <QuestionCheckboxes key={index} item={item} />
            ))}
            {<OtherCheckbox />}
          </View>
        ) : null}

        {pageInfo.category !== 'NO MEMORIAL PRESENT' ? (
          <View>
            <Text style={styles.genericQuestionMsg}>
              {t('Q2. What is the memorial height?')}
            </Text>

            <TouchableOpacity
              onPress={() => viewMemorialHeight()}
              style={{
                ...styles.itemCategory,
                marginTop: 0,
                marginLeft: 10,
                marginRight: 10,
                width: 'auto',
              }}>
              <Text style={styles.itemCategoryText}>
                {pageInfo.memorialHeight}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.column}>
          <Text style={{...styles.genericQuestionMsg, width: '85%'}}>
            {t('Q3. Photograph of memorial')}
          </Text>
          <TouchableOpacity
            onPress={() => {
              processPhotoAttachment(
                UI,
                setUI,
                {
                  questionNumber: 'Q3',
                },
                setPageInfo,
              );
            }}
            style={{
              width: '15%',
              display: 'flex',
              justifyContent: 'center',
            }}>
            <Icon
              name={'plus'}
              size={25}
              color="#74EE15"
              style={{...styles.iconBooked}}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.photosContainer}>
          {pageInfo.photos.map((item, index) => {
            return (
              <PhotoGrids
                key={item.id}
                setPageInfo={setPageInfo}
                UI={UI}
                setUI={setUI}
                item={item}
                index={index}
              />
            );
          })}
        </View>

        <View style={{marginTop: 20, paddingLeft: 20, paddingRight: 20}}>
          <TouchableOpacity
            style={{
              ...globalStyles.primaryButton,
              marginLeft: 0,
            }}
            onPress={() => viewSummaryDetails()}>
            <Text style={globalStyles.primaryButtonText}>
              {t('VIEW SUMMARY')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{marginTop: 20, paddingLeft: 20, paddingRight: 20}}>
          <TouchableOpacity
            style={{
              ...globalStyles.primaryButton,
              marginLeft: 0,
              backgroundColor: '#dadada',
            }}
            onPress={() => viewPDF()}>
            <Text style={{...globalStyles.primaryButtonText, color: '#000'}}>
              {t('VIEW ROUTE PDF GUIDE')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{marginTop: 20, paddingLeft: 20, paddingRight: 20}}>
          <TouchableOpacity
            style={{
              ...globalStyles.primaryButton,
              marginLeft: 0,
              backgroundColor: '#dadada',
            }}
            onPress={() => viewPreviousMemorialLocation()}>
            <Text style={{...globalStyles.primaryButtonText, color: '#000'}}>
              {t('VIEW PREVIOUS MEMORIAL LOCATION')}
            </Text>
          </TouchableOpacity>
        </View>

        {isMapReady && <MapCustom />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gridbox1: {
    backgroundColor: 'white',
    width: '100%',
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },
  boxes: {
    backgroundColor: 'blue',
    width: '100%',
    height: 60,
  },
  gridColumn: {
    width: 150,
    height: '100%',
    marginRight: 15,
    marginLeft: 15,
  },
  up: {
    height: 20,
    width: 20,
    backgroundColor: 'blue',
  },
  down: {
    height: 20,
    width: 20,
    backgroundColor: 'blue',
  },
  gridText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  gridPill: {
    width: 150,
    height: 60,
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  photosContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  genericQuestionMsg: {
    color: '#000',
    margin: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    fontSize: 18,
  },
  summaryText: {
    color: '#000',
    fontSize: 15,
    width: '50%',
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
  column: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
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
  buttonContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row', // Arrange buttons in a row
    justifyContent: 'space-between', // Space between buttons
    width: '100%', // Adjust width as needed
  },
});

export default MemorialFormDetails;
