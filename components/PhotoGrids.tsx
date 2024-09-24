const {useState} = require('react');
import * as storage from '@utils/AppStorage.tsx';
import RNFS from 'react-native-fs';
import * as database from '@utils/AppSqliteDb.tsx';
import {useEffect} from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import {
  getAllPhotosByMemorialAndQuestions,
  getCurrentMemorials,
} from '../helpers/MemorialDataHelper';

export default PhotoGrids = ({setUI, UI, item, index, setPageInfo}) => {
  const [uiFilePath, setUiFilePath] = useState('');
  const onPhotoClick = async () => {
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

    let images = [];

    for (const i in imgs) {
      let filePath =
        'file:///data/user/0/com.frontendrn/cache/' + imgs[i]['filename'];

      const exists = await RNFS.exists(filePath);

      if (!exists) {
        const baseUrl = await storage.get('baseUrl');

        filePath = baseUrl + '/view-photo?filename=' + item['filename'];
      }

      images.push({
        id: imgs[i].id,
        filename: imgs[i]['filename'],
        uri: filePath,
      });
    }

    setUI({
      ...UI,
      imageFiles: images,
      imageIndex: index,
      imageViewer: true,
      imageOnLongPress: image => {
        setUI({
          ...UI,
          confirm: true,
          confirmType: 'question',
          confirmMessage:
            'Would you like to delete this photo "' + image.id + '"?',
          confirmOnOkay: async () => {
            await database.remove('CompletedMemorialPhotos', 'id = ? ', [
              image.id,
            ]);

            const completedMemorials = await getCurrentMemorials({
              questionNumber: 'Q3',
            });

            const cmp = await database.getRecords(
              'CompletedMemorialPhotos',
              'completedMemorialId = ?',
              [completedMemorials[0].id],
            );

            if (cmp.length === 0) {
              setPageInfo(prevPageInfo => {
                return {
                  ...prevPageInfo,
                  attachment: 'Attach photo(s)',
                };
              });
              return;
            } else {
              setPageInfo(prevPageInfo => {
                return {
                  ...prevPageInfo,
                  attachment: cmp.length + ' Attached photo(s)',
                };
              });
            }

            setPageInfo(prevPageInfo => {
              const photoRemaining = prevPageInfo.photos.filter(photoData => {
                return photoData.id !== image.id; // Only filter out id 138
              });

              return {
                ...prevPageInfo,
                photos: photoRemaining,
              };
            });
          },
        });
      },
    });
  };

  let filePath = 'file:///data/user/0/com.frontendrn/cache/' + item['filename'];

  useEffect(() => {
    RNFS.exists(filePath)
      .then(async exists => {
        if (!exists) {
          const baseUrl = await storage.get('baseUrl');

          setUiFilePath(baseUrl + '/view-photo?filename=' + item['filename']);
        } else {
          setUiFilePath(filePath);
        }
      })
      .catch(error => {});
  }, []);

  return (
    <TouchableOpacity
      style={styles.imgGrids}
      onPress={async () => {
        await onPhotoClick();
      }}>
      {uiFilePath !== '' && (
        <Image
          style={{
            width: '100%',
            height: '100%',
          }}
          source={{
            uri: uiFilePath,
          }}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imgGrids: {
    width: '30%',
    height: 150,
    margin: 2
  },
});
