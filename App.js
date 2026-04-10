import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
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
    let isMounted = true;
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        if (isMounted) setStatus("Rugsat berilmedi");
        return;
      }

      try {
        const storedPoint = await AsyncStorage.getItem('saved_point');
        // CRASH GORAGY: JSON parse edilmezden öň barlag
        if (storedPoint && isMounted) {
            const parsed = JSON.parse(storedPoint);
            if(parsed && parsed.latitude) setSavedPoint(parsed);
        }
      } catch (e) { console.log("AsyncStorage error:", e); }

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          if (isMounted) {
            const { latitude, longitude } = newLocation.coords;
            const newPoint = { latitude, longitude };
            setLocation(newPoint);
            setRouteCoordinates((prev) => [...prev, newPoint]);
          }
        }
      );

      return () => {
        isMounted = false;
        if (watcher) watcher.remove();
      };
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
      
     // Edil şu durşuna, hiç hili http ýa-da https goşman:
const mapUrl = "maps.google.com/?q=" + latitude + "," + longitude;
      const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýar");
      } else {
        await Share.share({ message: messageBody });
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
      try {
        await AsyncStorage.setItem('saved_point', JSON.stringify(location));
        setSavedPoint(location);
        Alert.alert("Nokat Doňduryldy", "Ýeriňiz ýatda saklandy.");
      } catch (e) {
        console.log("Save error:", e);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
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
            <Marker coordinate={location} pinColor="#1d3557" title="Siz" />
          )}
          
          {/* CRASH GORAGY: Sanaw boş bolsa çyzma! */}
          {routeCoordinates.length > 1 && (
            <Polyline coordinates={routeCoordinates} strokeColor="#1d3557" strokeWidth={4} />
          )}

          {savedPoint && (
            <Marker coordinate={savedPoint} pinColor="#e63946" title="Doňdurylan" />
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
        <Text style={styles.aboutText}>Düzüji: Meňli Aşyrowa Altyýewna</Text>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={[styles.button, {backgroundColor: '#1d3557', marginBottom: 12}]} onPress={freezeLocation}>
          <Text style={styles.buttonText}>📍 NOKADY DOŇDUR</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <TouchableOpacity style={[styles.button, {backgroundColor: '#e63946'}]} onPress={shareLocation}>
            <Text style={styles.buttonText}>✉️ ÝERIMI UGRAT</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', padding: 20, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 30, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d' },
  mapCard: { height: 350, borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 5 },
  map: { flex: 1 },
  aboutCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 20, elevation: 2 },
  aboutText: { textAlign: 'center', fontWeight: 'bold', color: '#333' },
  actionSection: { alignItems: 'center' },
  button: { padding: 18, borderRadius: 15, width: '100%', alignItems: 'center', elevation: 3 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusText: { marginTop: 10, color: '#457b9d', fontWeight: '500' }
});
