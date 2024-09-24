import {StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import globalStyles from '@assets/styles/Styles.tsx';
import config from '../config/config';

const MessageScreen = ({navigation, UI, setUI}) => {
  const navigateToSendMessage = () => {
    navigation.navigate('SendMessage', {});
  };

  return (
    <TouchableOpacity
      onPress={navigateToSendMessage}
      style={styles.floatingButton}>
      <Icon
        name={'message1'}
        size={25}
        color="#fff"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    backgroundColor: config.colorScheme,
    width: 60,
    height: 60,
    zIndex: 10000,
    borderRadius: 30,
    bottom: 20,
    right: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10
  },
});

export default MessageScreen;
