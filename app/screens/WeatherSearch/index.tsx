import React, { useEffect, useState } from 'react';
import { View, Platform, PermissionsAndroid, ToastAndroid, Linking, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { connect } from 'react-redux';
import CommonStyles from '../../utils/CommonStyles';
import WeatherSearchContainer from './WeatherSearchContainer';
import getWeatherData from '../../actions/WeatherActions';
import { CONSTANTS } from '../../utils/Constants';
import { showAlert, isEmpty } from '../../utils/utilFunctions';

const SearchScreen = (props) => {

  // handling the city entered by user 
  const [city, setCity] = useState(''); 

  useEffect(() => {
    const getGeoCoordinates = async() => {
      const isLocationPermitted = await hasLocationPermission();
      if (isLocationPermitted) {
        Geolocation.getCurrentPosition(
            (position) => {
              alert(`Fetching city requires paid plans for reverse geoencoding, here are coordinates:\n\n ${JSON.stringify(position)}`)
              console.log(position);
            },
            (error) => {
              // See error code charts below.
              console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    }
    getGeoCoordinates();
  }, [])

  // saving the value of textinput in the state
  const onChangeSearchText = (city: string) => {
    setCity(city);
  }

  // called when the search button is clicked, checking for empty string
  const onPressSearch = () => {
    if(isEmpty(city)) return showAlert(CONSTANTS.lengthAlert);
    props.fetchWeatherData(city); // method to dispatch the action
  }

  const hasPermissionIOS = async () => {
    const openSetting = () => {
      Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings');
      });
    };
    const status = await Geolocation.requestAuthorization('whenInUse');

    if (status === 'granted') {
      return true;
    }

    if (status === 'denied') {
      Alert.alert('Location permission denied');
    }

    if (status === 'disabled') {
      Alert.alert(
        `Turn on Location Services to allow "${appConfig.displayName}" to determine your location.`,
        '',
        [
          { text: 'Go to Settings', onPress: openSetting },
          { text: "Don't Use Location", onPress: () => {} },
        ],
      );
    }

    return false;
  }

  const hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const hasPermission = await hasPermissionIOS();
      return hasPermission;
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  return (
    <View style={CommonStyles.containerTop}>
      {/* container component */}
      <WeatherSearchContainer
        weatherData={props.weatherData}
        isWeatherDataLoading={props.isWeatherDataLoading}
        onChangeText={(text) => onChangeSearchText(text)}
        value={city}
        onPressButton={() => onPressSearch()}
      />
    </View>
  )
};

const mapStateToProps = state => {
  return {
    weatherData: state.weatherForecaseReducer.data,
    isWeatherDataLoading: state.weatherForecaseReducer.isLoading,
  };
};

const mapDispatchToProps = dispatch => ({
  fetchWeatherData: (city) => dispatch(getWeatherData(city))
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchScreen);
