import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Image } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Polyline, Marker } from 'react-native-maps'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Taýýar");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [savedPoint, setSavedPoint] = useState(null); 

  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus("Rugsat ýok");
        return;
      }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

      // Artykmaç sazlamalary aýyrdyk, diňe iň esasy GPS yzarlamasy
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });
          setRouteCoordinates((prev) => [...prev, { latitude, longitude }]);
        }
      );
    })();
  }, []);

  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek tutmady.");
      return;
    }
    setLoading(true);
    try {
      const { latitude, longitude } = location;
      // Siziň "işledi" diýen linkiňiziň dogry formaty
      const mapUrl = `maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
      } else {
        await Share.share({ message: messageBody });
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "Ugradyp bolmady.");
    } finally {
      setLoading(false);
    }
  };

  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Saklandy", "Nokat ýatda saklandy.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Düzüji: Meňli Aşyrowa</Text>
      </View>

      <View style={styles.mapCard}>
        {/* MapView-ny iň sada görnüşde ulanýarys */}
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.95,
            longitude: 58.38,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {location && <Marker coordinate={location} title="Häzirki ýeriňiz" />}
          {savedPoint && <Marker coordinate={savedPoint} pinColor="red" title="Saklanan nokat" />}
          {routeCoordinates.length > 1 && <Polyline coordinates={routeCoordinates} strokeWidth={3} />}
        </MapView>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.button} onPress={freezeLocation}>
          <Text style={styles.buttonText}>📍 NOKADY SAKLA</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <TouchableOpacity style={[styles.button, {backgroundColor: '#e63946', marginTop: 15}]} onPress={shareLocation}>
            <Text style={styles.buttonText}>✉️ ÝERIMI UGRAT</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', padding: 20 },
  header: { marginVertical: 20, alignItems: 'center' },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d' },
  mapCard: { height: 350, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  map: { flex: 1 },
  actionSection: { width: '100%' },
  button: { backgroundColor: '#1d3557', padding: 18, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});