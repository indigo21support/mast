import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import config from '@config/config.js';

const FullPageMenu = ({UI, setUI}) => {
    console.log(UI.menuActions);
  return (
    <View style={styles.container}>
        <View style={styles.whiteForm}>
        <Text style={styles.actionTitle}>{UI.menuTitle}</Text>

            { UI.menuActions.map ( (item, index) => (
                <TouchableOpacity key={index} onPress={ () => {
                    setUI({...UI, menu: false });
                    item.onPress();
                }} style={styles.navigation}>
                        <Text style={styles.navigationText}>{item.title}</Text>
                </TouchableOpacity>
            )) }
           
            <TouchableOpacity onPress={ async () => {
                setUI({
                    ...UI,
                    menu: false
                });
            }} style={styles.navigationButtons}>
                    <Text style={styles.navigationText}>CLOSE</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
    actionTitle: {
        fontSize: 22,
        color: '#000',
        fontWeight: 'bold',
   
        marginBottom: 20,
        marginTop: 20,
        width: '100%',
        textAlign: 'center'
    },
    navigationButtons: {
      backgroundColor: '#dadada',
      display: 'flex',
      alignItems: 'center',
      padding: 10,
      borderRadius: 30,
      marginTop: 30,
    },
    navigation: {
        borderBottomColor: '#dadada',
        borderBottomWidth: 1,
        padding: 10,
        paddingTop: 15,
        paddingBottom: 15
    },
    navigationText: {
        color: '#000',
        fontSize: 18
    },
    navigationContainer: {
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: 30,
        paddingRight: 30,
    },
  shortDesc: {
    marginBottom: 25,
    fontSize: 40,
    textAlign: 'center',
    color: 'white',
    zIndex: 10,
    fontWeight: 'bold',
  },
  icon: {
    marginBottom: 15,
  },
  confirmButton: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 500,
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#fff',
    padding: 15,
    width: '50%',
    textAlign: 'center',
    marginTop: 34,
    marginLeft: 10,
    marginRight: 10
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 20,
  },

  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#fff',
    padding: 15,
    width: '50%',
    textAlign: 'center',
    marginTop: 34,
    marginLeft: 10,
    marginRight: 10
  },
  cancelButtonText: {
    color: config.colorSchemeConstrast,
    fontSize: 20,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    color: config.colorSchemeContrast,
    zIndex: 10,
  },
  container: {
    paddingLeft: 30,
    paddingRight: 30,
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10000,
  },
  whiteForm: {
    padding: 10,
    width: '80%',
    minHeight: 80,
    backgroundColor: '#fff',
    borderRadius: 10,
  }
});

export default FullPageMenu;
