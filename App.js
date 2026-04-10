import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Polyline, Marker } from 'react-native-maps'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [savedPoint, setSavedPoint] = useState(null); 

  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("Üns beriň", "GPS rugsady gerek.");
        return;
      }

      try {
        const storedPoint = await AsyncStorage.getItem('saved_point');
        if (storedPoint) setSavedPoint(JSON.parse(storedPoint));
      } catch (e) { console.log("Storage error"); }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (newLocation) => {
          if (newLocation.coords) {
            const { latitude, longitude } = newLocation.coords;
            const newPoint = { latitude, longitude };
            setLocation(newPoint);
            setRouteCoordinates((prev) => [...prev, newPoint]);
          }
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
      // SIZIŇ TASSYKLAN LINKIŇIZ (HIC HILI ÜÝTGEDILMEDI):
      const mapUrl = `maps.google.com/?q=38.4340439,56.2966732{latitude},${longitude}`;
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
      try {
        await AsyncStorage.setItem('saved_point', JSON.stringify(location));
        setSavedPoint(location);
        Alert.alert("Saklandy", "Nokat ýatda saklandy.");
      } catch (e) {
        Alert.alert("Säwlik", "Ýatda saklap bolmady.");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Düzüji: Meňli Aşyrowa</Text>
      </View>

      <View style={styles.mapCard}>
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
          {/* Gorag: Diňe koordinatalar bar bolsa çyz */}
          {routeCoordinates.length > 1 && (
            <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor="#1d3557" />
          )}
        </MapView>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.button} onPress={freezeLocation}>
          <Text style={styles.buttonText}>📍 NOKADY SAKLA</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#e63946" style={{marginTop: 15}} />
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
