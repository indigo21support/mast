import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import globalStyles from '@assets/styles/Styles.tsx';

const PdfViewerScreen = ({navigation, UI, setUI}) => {
  const imageUrl = 'https://api-mast.memorialworks.com/storage/app/public/uploads/a2%20example_page-0001.jpg';

  const viewImage = (url) => {
    const images =[];

    images.push({
      id: 0,
      filename: imageUrl,
      uri: imageUrl,
    });

    setUI({
      ...UI,
      imageFiles: images,
      imageIndex: 0,
      imageViewer: true,
      imageOnLongPress: image => {

      },
    });
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
     
            style={{
              ...styles.icon,
              marginRight: 10,
            }}
          />
          <Text style={globalStyles.topHeaderTitle}>{'ROUTE PDF GUIDE'}</Text>
        </TouchableOpacity>
      </View>

      
      <TouchableOpacity
         onPress={() => viewImage()}
      >
      <Image 
       
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover" 
      />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingBottom: 20,
  },

  image: {
    width: '100%', // Adjust the width as needed
    height: '90%', // Adjust the height as needed
  },
});

export default PdfViewerScreen;
