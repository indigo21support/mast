import {StyleSheet} from 'react-native';
import config from '@config/config.js';

const maxFormWidth = 500;
const formMarginLeftRight = 40;

const styles = StyleSheet.create({
  btnHeader: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row'
  },
  topHeaderTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff'
  },
  topHeader: {
    padding: 10,
    width: '100%',
    height: 'auto',
    backgroundColor: config.colorScheme,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  errorText: {
    color: config.colorScheme,
    width: '100%',
    paddingLeft: 10,
    marginTop: 0,
    marginBottom: 5,
    maxWidth: maxFormWidth,
  },
  dropdownAlert: {
    zIndex: 100000,
  },
  shortDesc: {
    fontSize: 13,
    color: '#3e3e3e',
    textAlign: 'justify',
    maxWidth: maxFormWidth,
  },
  changeQrCode: {
    position: 'absolute',
    width: '100%',
    bottom: 120,
    left: 0,
    alignItems: 'center',
    display: 'flex'
  },
  changeQrCodeText: {
    color: '#000',
    fontSize: 16,
    width: 150,
    textAlign: 'right',
    textDecorationLine: 'underline'
  },
  longDesc: {
    fontSize: 18,
    color: '#3e3e3e',
    textAlign: 'justify',
    maxWidth: maxFormWidth
  },
  container: {
    alignItems: 'center',
    width: '100%',
    height: 600,
    display: 'flex',
    paddingLeft: 20,
    paddingRight: 20,
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    width: '100%',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 30,
    maxWidth: maxFormWidth,
  },
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
    justifyContent: 'center'
  },
  input: {
    color: '#000',
    fontSize: 16,
    padding: 15,
    backgroundColor: '#dadada',
    marginLeft: formMarginLeftRight,
    marginRight: formMarginLeftRight,
    borderRadius: 10,
    width: '100%',
    maxWidth: maxFormWidth,
  },
  linkButton: {
    width: '100%',
    maxWidth: maxFormWidth,
    padding: 15,
    marginLeft: formMarginLeftRight,
    marginRight: formMarginLeftRight,
    borderColor: '#3e3e3e',
    borderWidth: 0.5,
    borderRadius: 10,
  },
  searchIcon: {
    position: 'absolute',
    zIndex: 10,
    top: 10,
    right: 15,
  },
  linkButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    width: '100%',
    color: '#000',
    textAlign: 'center',
  },
  primaryButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    width: '100%',
    color: config.colorSchemeContrast,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    maxWidth: maxFormWidth,
    padding: 15,
    marginLeft: formMarginLeftRight,
    marginRight: formMarginLeftRight,
    backgroundColor: config.colorScheme,
    borderRadius: 25,
  },
  forgotPasswordLink: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3e3e3e',
    width: '100%',
    maxWidth: maxFormWidth,
    textAlign: 'right',
    marginTop: -15,
    marginBottom: 10,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#dadada',
    marginBottom: 20,
    paddingLeft: 20,
    color: '#000',
  },
  backTopButton: {
    marginBottom: 20,
  },
  backTopButtonText: {
    color: 'blue',
    fontSize: 18,
  }
});

export default styles;
