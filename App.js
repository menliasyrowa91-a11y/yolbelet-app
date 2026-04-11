import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Polyline, Marker } from 'react-native-maps'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [savedPoint, setSavedPoint] = useState(null); 
  const [status, setStatus] = useState("Ulanmaga taýýar");

  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("GPS Rugsady", "Karta we SMS üçin GPS rugsady gerek.");
        return;
      }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

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
      Alert.alert("Garaşyň", "GPS entek tutmady.");
      return;
    }
    const { latitude, longitude } = location;

    // SENIŇ "IŞLEDİ" DİÝEN TAKYK LINKIŇ:
    const mapUrl = `maps.google.com/093{latitude},${longitude}`;
    const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync([], messageBody);
      setStatus("SMS taýýarlandy");
    } else {
      await Share.share({ message: messageBody });
      setStatus("Paýlaşyldy");
    }
  };

  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Doňduryldy", "Nokat ýatda saklandy.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* BAŞLYK */}
        <View style={styles.header}>
          <Text style={styles.logoText}>📍 ÝOLBELET</Text>
          <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
        </View>

        {/* SENIŇ ÖZÜŇI TANYŞDYRÝAN WE MAKSADYŇY AÝDYŇLAŞDYRÝAN TEKSTIŇ */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeader}>Programma barada:</Text>
          <Text style={styles.aboutText}>
            Salam! Men <Text style={styles.authorName}>Meňli Aşyrowa Altyýewna</Text>. 
            Bu programmany ýolda kynçylyga uçranlara kömek bermek üçin döretdim.
          </Text>
          <Text style={styles.instructionText}>
            Aşakdaky düwmä basyp, GPS koordinataňyzy SMS arkaly ugradyp bilersiňiz. 
            Mundan başga-da, gelen ýoluňyzy karta çyzyp we nokadyňyzy doňduryp bilersiňiz.
          </Text>
        </View>

        {/* KARTA BÖLÜMI */}
        <View style={styles.mapCard}>
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
            <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#1d3557" />
            {savedPoint && <Marker coordinate={savedPoint} pinColor="red" />}
          </MapView>
        </View>

        {/* DÜWMELER */}
        <View style={styles.actionSection}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.freezeButton} onPress={freezeLocation}>
              <Text style={styles.buttonText}>📍 NOKADY SAKLA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton} onPress={shareLocation}>
              <Text style={styles.buttonText}>✉️ ÝERIMI UGRAT</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', paddingVertical: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 34, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 16, color: '#457b9d' },
  aboutCard: { backgroundColor: '#ffffff', padding: 20, marginHorizontal: 20, borderRadius: 15, elevation: 3, marginBottom: 20 },
  aboutHeader: { fontSize: 18, fontWeight: 'bold', color: '#1d3557', marginBottom: 10 },
  aboutText: { fontSize: 15, color: '#333', lineHeight: 22 },
  authorName: { fontWeight: 'bold', color: '#e63946' },
  instructionText: { fontSize: 13, color: '#666', marginTop: 15, fontStyle: 'italic' },
  mapCard: { height: 300, marginHorizontal: 20, borderRadius: 15, overflow: 'hidden', marginBottom: 20, elevation: 4 },
  map: { flex: 1 },
  actionSection: { alignItems: 'center', paddingHorizontal: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  freezeButton: { backgroundColor: '#1d3557', padding: 18, borderRadius: 12, width: '48%', alignItems: 'center' },
  sendButton: { backgroundColor: '#e63946', padding: 18, borderRadius: 12, width: '48%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 14 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#adb5bd', fontSize: 12 },
});
