import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Image } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Polyline, Marker } from 'react-native-maps'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [savedPoint, setSavedPoint] = useState(null); 
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      // 1. Rugsat soramak
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus("Rugsat berilmedi");
        return;
      }

      // 2. Ýatda saklanan nokady okamak
      try {
        const storedPoint = await AsyncStorage.getItem('saved_point');
        if (storedPoint) setSavedPoint(JSON.parse(storedPoint));
      } catch (e) {
        console.log("AsyncStorage error:", e);
      }

      // 3. GPS Yzarlamak
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          const newPoint = { latitude, longitude };
          setLocation(newPoint);
          setRouteCoordinates((prev) => [...prev, newPoint]);
        }
      );

      return () => watcher.remove(); 
    })();
  }, []);

  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    setLoading(true);
    setStatus("Ugradylýar...");

    try {
      const { latitude, longitude } = location;
      
      // DOGRY: Seniň islän formatyň, hiç hili üýtgeşme ýok!
      const mapUrl = `maps.google.com/?q=$${latitude},${longitude}`;
      const messageBody = `YOLBELET: Menin yerim: ${messageBody}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], `YOLBELET: Menin yerim: ${mapUrl}`);
        setStatus("SMS taýýar");
      } else {
        await Share.share({ message: `YOLBELET: Menin yerim: ${mapUrl}` });
        setStatus("Paýlaşyldy");
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "Maglumat ugradylmady.");
      setStatus("Näsazlyk");
    } finally {
      setLoading(false);
    }
  };

  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Nokat Doňduryldy", "Ýeriňiz ýatda saklandy.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('./assets/icon.png')} 
          style={styles.mainIcon} 
          resizeMode="contain"
        />
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
      </View>

      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          initialRegion={{
            latitude: 37.95,
            longitude: 58.38,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {location && (
            <Marker coordinate={location} pinColor="#1d3557" title="Häzirki ýeriňiz" />
          )}

          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeColor="#1d3557" strokeWidth={4} />
          )}

          {savedPoint && (
            <Marker coordinate={savedPoint} pinColor="#e63946" title="Doňdurylan Nokat" />
          )}

          {savedPoint && location && (
            <Polyline 
              coordinates={[location, savedPoint]} 
              strokeColor="#ffb703" 
              strokeWidth={3} 
              lineDashPattern={[5, 5]} 
            />
          )}
        </MapView>
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutHeader}>Programma barada:</Text>
        <Text style={styles.aboutText}>
          Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meňli Aşyrowa Altyýewna</Text>. 
          Bu programmany azaşanlara çalt kömek bermek üçin döretdim.
        </Text>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={[styles.button, {backgroundColor: '#1d3557', marginBottom: 12}]} onPress={freezeLocation}>
          <Text style={styles.buttonText}>📍 NOKADY DOŇDUR</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={shareLocation}>
            <Text style={styles.buttonText}>✉️ ÝERIMI UGRAT</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet — Düzüji: Meňli Aşyrowa</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', paddingVertical: 40, paddingHorizontal: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  mainIcon: { width: 80, height: 80, marginBottom: 10 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d' },
  mapCard: { height: 320, width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 20, elevation: 5 },
  map: { flex: 1 },
  aboutCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 20, width: '100%', elevation: 3, marginBottom: 20 },
  aboutHeader: { fontSize: 16, fontWeight: 'bold', color: '#1d3557', marginBottom: 5 },
  aboutText: { fontSize: 14, color: '#333', lineHeight: 22 },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 18, borderRadius: 15, width: '100%', alignItems: 'center', elevation: 4 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 13, fontWeight: '500' },
  footerText: { marginTop: 30, color: '#adb5bd', fontSize: 11, textAlign: 'center' },
});
