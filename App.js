import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Linking, ActivityIndicator, Platform } from 'react-native';
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

  // 1. Maglumatlary we GPS-y başlangyç sazlamak
  useEffect(() => {
    (async () => {
      try {
        // Nomeri we saklanan nokady alalyň
        const storedPhone = await AsyncStorage.getItem('phoneNumber');
        if (storedPhone) setPhoneNumber(storedPhone);

        const storedLoc = await AsyncStorage.getItem('savedLocation');
        if (storedLoc) {
          try {
            setSavedLocation(JSON.parse(storedLoc));
          } catch (e) {
            console.error("JSON parse error", e);
          }
        }

        // GPS Rugsadyny soramak
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('GPS rugsady berilmedi');
          setIsLoading(false);
          return;
        }

        // Häzirki ýerini anyklamak
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
        setIsLoading(false);

        // Real-wagtda yzarlamak
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLoc) => {
            setLocation(newLoc);
          }
        );

        return () => watcher.remove(); // Komponent öçende yzarlamany duruzmak
      } catch (e) {
        console.log(e);
        setIsLoading(false);
      }
    })();
  }, []);

  // 2. Telefon nomerini ýatda saklamak
  const handlePhoneChange = async (text) => {
    setPhoneNumber(text);
    await AsyncStorage.setItem('phoneNumber', text);
  };

  // 3. NOKADY DOŇDURMAK (Save Point)
  const savePoint = async () => {
    // location?.coords barlygyny barlamak crash-yň öňüni alýar
    if (location && location.coords) {
      const point = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSavedLocation(point);
      await AsyncStorage.setItem('savedLocation', JSON.stringify(point));
      Alert.alert("Üstünlikli", "Nokat ýatda saklandy!");
    } else {
      Alert.alert("Ýalňyşlyk", "GPS entek anyklanmady.");
    }
  };

  // 4. SMS Ugratmak
  const sendSMS = () => {
    if (!location || !location.coords) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }

    if (phoneNumber.length < 8) {
      Alert.alert("Ýalňyşlyk", "Dogry telefon nomerini ýazyň.");
      return;
    }

    const { latitude, longitude } = location.coords;
    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `YOLBELET: Menin yerim: ${mapLink}`;
    
    let finalPhone = phoneNumber;
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('8')) {
      finalPhone = `+993${phoneNumber}`;
    }

    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${finalPhone}${separator}body=${encodeURIComponent(message)}`;
    
    Linking.openURL(url);
  };

  // 5. YZYNA ÝOL (Go to Saved Point)
  const goToPoint = () => {
    if (savedLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        latitudeDelta: 0.005, // Delta hökman bolmaly
        longitudeDelta: 0.005,
      }, 1000);
    } else {
      Alert.alert("Nokat ýok", "Ilki nokat ýatda saklaň.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{marginTop: 10}}>Ýolbelet ýüklenýär...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        // Google Maps däl-de, diňe Tile ulanmak üçin Android-de 'none'
        mapType={Platform.OS === 'android' ? "none" : "standard"}
        initialRegion={{
          latitude: location?.coords?.latitude || 37.95,
          longitude: location?.coords?.longitude || 58.38,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        loadingEnabled={true}
      >
        {/* Offline goldawy üçin mugt ArcGIS kafel serweri */}
        <UrlTile
          urlTemplate="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maximumZ={19}
          shouldReplaceMapContent={true}
        />
        
        {savedLocation && (
          <Marker 
            coordinate={savedLocation} 
            pinColor="blue" 
            title="Saklanan nokat" 
          />
        )}
      </MapView>

      <View style={styles.overlay}>
        <TextInput
          style={styles.input}
          placeholder="Nomer (Meselem: 65XXXXXX)"
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
  overlay: { position: 'absolute', bottom: 40, backgroundColor: 'rgba(255,255,255,0.95)', padding: 15, width: '92%', borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 15, padding: 10, fontSize: 16, color: '#333' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  btn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, flex: 0.48, alignItems: 'center' },
  smsBtn: { backgroundColor: '#2196F3' },
  goBtn: { backgroundColor: '#FF9800', width: '100%', flex: 0, marginTop: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 10, fontWeight: '500' }
});
