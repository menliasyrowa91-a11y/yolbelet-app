import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Asset } from 'expo-asset';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState([]); // Hakyky ýörän ýoluňyzyň nokatlary
  const [isTracking, setIsTracking] = useState(false);
  const mapRef = useRef(null);

  // 1. ÝERIMI SMS BILEN UGRAT
  const shareLocation = async () => {
    setLoading(true);
    try {
      let { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert("Rugsat ýok", "GPS rugsady gerek.");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const url = `Maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      const msg = "YOLBELET: Menin yerim: " + url;

      const isSms = await SMS.isAvailableAsync();
      if (isSms) {
        await SMS.sendSMSAsync([], msg);
      } else {
        await Share.share({ message: msg });
      }
      setStatus("Ýerleşýän ýeriňiz paýlaşyldy");
    } catch (e) {
      Alert.alert("Hata", "GPS tapylmady.");
    } finally { setLoading(false); }
  };

  // 2. ÝOL ÝAZGYSYNY BAŞLAT/DURUZ (Hakyky ýörän ýoluňyz üçin)
  const toggleTracking = async () => {
    if (isTracking) {
      setIsTracking(false);
      setStatus("Ýol ýazgy edildi.");
      return;
    }

    let { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') return;

    setIsTracking(true);
    setPath([]); // Täze ýazgy üçin öňki ýoly arassalaýar
    setStatus("Ýörän ýoluňyz ýazylýar...");

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 3, // Her 3 metrden bir nokat goýar (iň takygy)
      },
      (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        setPath((currentPath) => [...currentPath, { latitude, longitude }]);
      }
    );
  };

  // 3. OFFLINE KMZ GÖRKEZMEK
  const loadOfflineKMZ = async () => {
    try {
      const kmz = Asset.fromModule(require('./assets/Yolbelet-un-offline.kmz'));
      await kmz.downloadAsync();
      Alert.alert("Offline Karta", "KMZ gatlagy işjeňleşdirildi.");
      setStatus("Offline gatlak açyk");
    } catch (e) {
      Alert.alert("Hata", "KMZ faýly tapylmady.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Düzüji: Meňli Aşyrowa</Text>
      </View>

      {/* KARTA MEÝDANÇASY - Hakyky ýoluňyzy şunda görersiňiz */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {path.length > 0 && (
            <Polyline
              coordinates={path}
              strokeColor="#e63946"
              strokeWidth={5}
            />
          )}
        </MapView>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.button, {backgroundColor: isTracking ? '#1d3557' : '#e63946'}]} 
          onPress={toggleTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? "⏹️ ÝAZGYNY DURUZ" : "🚶 ÝOL ÝAZGYSYNY BAŞLAT"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, {backgroundColor: '#457b9d'}]} onPress={shareLocation}>
          <Text style={styles.buttonText}>📲 ÝERIMI SMS UGRAT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, {backgroundColor: '#2a9d8f'}]} onPress={loadOfflineKMZ}>
          <Text style={styles.buttonText}>🗺️ OFFLINE KMZ ÝÜKLE</Text>
        </TouchableOpacity>

        <Text style={styles.statusText}>Ýagdaý: {status}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', paddingVertical: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d' },
  mapContainer: { width: '100%', height: 350, borderRadius: 20, overflow: 'hidden', elevation: 5, marginBottom: 20 },
  map: { width: '100%', height: '100%' },
  actionSection: { width: '100%' },
  button: { padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 12, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  statusText: { textAlign: 'center', color: '#1d3557', marginTop: 10, fontWeight: '500' }
});
