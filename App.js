import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Linking, ActivityIndicator } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [location, setLocation] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savedLocation, setSavedLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef(null);

  // 1. GPS we Nomeri Yüklemek
  useEffect(() => {
    (async () => {
      try {
        // Nomeri we saklanan nokatlary ýükle
        const storedPhone = await AsyncStorage.getItem('phoneNumber');
        if (storedPhone) setPhoneNumber(storedPhone);

        const storedLocation = await AsyncStorage.getItem('savedLocation');
        if (storedLocation) setSavedLocation(JSON.parse(storedLocation));

        // GPS Rugsadyny soramak
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('GPS rugsady berilmedi');
          setIsLoading(false);
          return;
        }

        // Iň takyk koordinatany alarys (3-5 metr takyklyk üçin)
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        setLocation(loc);
        setIsLoading(false);

        // Real-wagtda yzarlamak
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000,
            distanceInterval: 1,
          },
          (newLoc) => {
            setLocation(newLoc);
          }
        );
      } catch (e) {
        console.log(e);
        setIsLoading(false);
      }
    })();
  }, []);

  // 2. Nomeri Saklamak
  const handlePhoneChange = async (text) => {
    setPhoneNumber(text);
    await AsyncStorage.setItem('phoneNumber', text);
  };

  // 3. Nokady Yatda Saklamak
  const savePoint = async () => {
    if (location) {
      const point = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSavedLocation(point);
      await AsyncStorage.setItem('savedLocation', JSON.stringify(point));
      Alert.alert("Üstünlikli", "Nokat ýatda saklandy!");
    }
  };

  // 4. SMS Ugratmak (Seniň formatyňda)
  const sendSMS = () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }

    if (phoneNumber.length < 8) {
      Alert.alert("Ýalňyşlyk", "Dogry telefon nomerini ýazyň.");
      return;
    }

    // Google Maps formaty (Seniň tassyklan formatyň)
     const mapLink = `Maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = `YOLBELET: Menin yerim: ${mapLink}`;
    
    // Nomeriň başyny barlamak (+993 ýa-da 8)
    let finalPhone = phoneNumber;
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('8')) {
      finalPhone = `+993${phoneNumber}`;
    }

    const url = `sms:${finalPhone}?body=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  // 5. Saklanan Nokada Gaýdyp barmak
  const goToPoint = () => {
    if (savedLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...savedLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } else {
      Alert.alert("Nokat ýok", "Ilki nokat ýatda saklaň.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>GPS anyklanýar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: location?.coords?.latitude || 37.95,
          longitude: location?.coords?.longitude || 58.38,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* ArcGIS Offline Keş üçin Kafel (Tile) ulgamy */}
        <UrlTile
          urlTemplate="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maximumZ={19}
          flipY={false}
        />
        
        {savedLocation && (
          <Marker coordinate={savedLocation} pinColor="blue" title="Saklanan nokat" />
        )}
      </MapView>

      <View style={styles.overlay}>
        <TextInput
          style={styles.input}
          placeholder="Nomer (8... ýa-da +993...)"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btn} onPress={savePoint}>
            <Text style={styles.btnText}>Nokat Ýatda Sakla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.btn, styles.smsBtn]} onPress={sendSMS}>
            <Text style={styles.btnText}>SMS Ugrat</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.btn, styles.goBtn]} onPress={goToPoint}>
          <Text style={styles.btnText}>Saklanan Nokada Bar</Text>
        </TouchableOpacity>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  map: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 40, backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, width: '90%', borderRadius: 15, elevation: 5 },
  input: { borderBottomWidth: 1, marginBottom: 15, padding: 8, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  btn: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  smsBtn: { backgroundColor: '#2196F3' },
  goBtn: { backgroundColor: '#FF9800', width: '100%', flex: 0 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 10 }
});
