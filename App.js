import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Polyline, Marker } from 'react-native-maps'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [savedPoint, setSavedPoint] = useState(null); 

  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("GPS Rugsady", "Karta we SMS üçin GPS rugsady gerek.");
        return;
      }

      // Ýatda saklanan nokady oka
      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

      // Ýoly yzarlamak (Offline ýol çyzmak üçin)
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          const newPoint = { latitude, longitude };
          setLocation(newPoint);
          setRouteCoordinates((prev) => [...prev, newPoint]);
        }
      );
    })();
  }, []);

  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS maglumaty entek alynmady.");
      return;
    }
    const { latitude, longitude } = location;

    // SENIŇ TAKYK DOGRY DIÝEN LINKIŇ:
    const mapUrl = `maps.google.com/?q={latitude},${longitude}`;
    const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync([], messageBody);
    } else {
      await Share.share({ message: messageBody });
    }
  };

  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Doňduryldy", "Nokat ýatda saklandy, kartaňyzda gyzyl bolup görner.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.authorText}>Meňli Aşyrowa Altyýewna</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.95,
            longitude: 58.38,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation={true}
        >
          {/* Gelen ýoluňyzy çyzýan çyzyk */}
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#1d3557" />
          
          {/* Saklanan (doňdurylan) nokat */}
          {savedPoint && <Marker coordinate={savedPoint} pinColor="red" />}
        </MapView>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.freezeBtn} onPress={freezeLocation}>
          <Text style={styles.btnText}>📍 NOKADY SAKLA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sendBtn} onPress={shareLocation}>
          <Text style={styles.btnText}>✉️ ÝERIMI UGRAT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 15, alignItems: 'center', backgroundColor: '#fff' },
  logoText: { fontSize: 30, fontWeight: 'bold', color: '#1d3557' },
  authorText: { fontSize: 12, color: '#e63946', fontWeight: 'bold' },
  mapContainer: { flex: 1, margin: 10, borderRadius: 20, overflow: 'hidden', elevation: 4 },
  map: { flex: 1 },
  buttonRow: { padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  freezeBtn: { backgroundColor: '#1d3557', padding: 18, borderRadius: 15, width: '48%', alignItems: 'center' },
  sendBtn: { backgroundColor: '#e63946', padding: 18, borderRadius: 15, width: '48%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' }
});
