import {useEffect, useState} from 'react';
import CheckBox from '@react-native-community/checkbox';
import * as storage from '@utils/AppStorage.tsx';
import * as database from '@utils/AppSqliteDb.tsx';
import * as utils from '@utils/Utils';
import store from '@redux/store';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import config from '@config/config';

const OtherCheckbox = () => {
  const [checkbox, setCheckbox] = useState(false);
  const [others, setOthers] = useState('');

  useEffect(() => {
    const getExistingRecord = async () => {
      const memorialId = await storage.get('memorialId');
      const records = await database.getRecords(
        'CompletedMemorials',
        `
                memorialId = ? AND questionNumber = ?
            `,
        [memorialId, 'OTHERS'],
      );

      console.log(records);

      for (const i in records) {
        const obj = records[i];

        if (obj.questionNumber === 'OTHERS') {
          setCheckbox(true);
          setOthers(obj.comments);
        }
      }
    };
    getExistingRecord();
  }, []);

  const toggleCheckboxValue = async (condition: any, question: any) => {
    const memorialId = await storage.get('memorialId');

    const state = store.getState();

    const key = 'check-' + memorialId + '-' + question + '-ins';

    await database.remove('Sync', 'key = ?', [key]);

    if (condition) {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'OTHERS',
        comments: others,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
      });

      await database.insert('Sync', {
        key: key,
        Payload:
          `
            INSERT INTO completed_memorials SET 
            memorial_id = '${memorialId}',
            time = '${utils.getMysqlTime()}',
            geostamp = '` +
          state.geoLocation.latlong.latitude +
          '|' +
          state.geoLocation.latlong.longitude +
          `',
            question_number = 'OTHERS',
            pass_fail = 'failed',
            comments = '${others}',
            created_at = '${utils.getMysqlDateTime()}',
            updated_at = '${utils.getMysqlDateTime()}',
            deleted_at = ''
          `,
        Status: 'PENDING',
        CreatedAt: utils.getMysqlDateTime(),
        UpdatedAt: utils.getMysqlDateTime(),
      });
    } else {
      await database.remove(
        'CompletedMemorials',
        `
                  memorialId = ? AND questionNumber = ?
              `,
        [memorialId, 'OTHERS'],
      );
    }
  };

  const setCommentData = async (text, question) => {
    const memorialId = await storage.get('memorialId');

    const check = await database.getRecords(
      'CompletedMemorials',
      `
              memorialId = ? AND questionNumber = ?
          `,
      [memorialId, question],
    );

    if (check.length > 0) {
      // update
      await database.update(
        'CompletedMemorials',
        {
          comments: others,
        },
        'id = ?',
        check[0].id,
      );
    } else {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'OTHERS',
        comments: others,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
      });
    }
  };

  return (
    <View>
      <View style={styles.inlineCheckbox}>
        <CheckBox
          disabled={false}
          value={checkbox}
          tintColors={config.colorScheme}
          onValueChange={newValue => {
            setCheckbox(newValue);
            toggleCheckboxValue(newValue, 'OTHERS');
          }}
        />
        <Text
          style={{
            color: '#000',
          }}>
          {'Others'}
        </Text>
      </View>

      <TextInput
        editable={checkbox}
        multiline
        numberOfLines={4}
        maxLength={40}
        placeholder={'Description..'}
        placeholderTextColor={'#e5e5e5'}
        onChangeText={text => {
          setOthers(text);
          setTimeout(() => {
            setCommentData(text, 'OTHERS');
          }, 3000);
        }}
        value={others}
        style={{
          margin: 10,
          marginLeft: 50,
          backgroundColor: '#fff',
          borderRadius: 10,
          color: '#000',
          opacity: checkbox ? 1 : 0.5,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inlineCheckbox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 50,
  },
});

export default OtherCheckbox;
