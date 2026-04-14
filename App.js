import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Dimensions, Switch } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [isReady, setIsReady] = useState(false); 
  const [isTracking, setIsTracking] = useState(false); 
  const [status, setStatus] = useState("Garaşyň...");
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedPoint, setSavedPoint] = useState(null); 
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Rugsat", "Karta we GPS üçin rugsat gerek.");
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setStatus("Ulanmaga taýýar");

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));
    })();
  }, []);

  useEffect(() => {
    let subscriber;
    if (isTracking && isReady) {
      subscriber = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 15 },
        (location) => {
          const { latitude, longitude } = location.coords;
          const newCoord = { latitude, longitude };
          setCurrentLocation(newCoord);
          setRouteCoordinates((prev) => [...prev, newCoord]);
        }
      );
    }
    return () => { if (subscriber) subscriber.then(s => s.remove()); };
  }, [isTracking, isReady]);

  const shareLocation = async () => {
    if (!currentLocation) {
      Alert.alert("Garaşyň", "GPS heniz anyklanmady.");
      return;
    }
    setLoading(true);
    try {
      const { latitude, longitude } = currentLocation;
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
      } else {
        await Share.share({ message: messageBody });
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "GPS alyp bolmady.");
    } finally {
      setLoading(false);
    }
  };

  // 1. SALAMLAŞYK TAGTASY (Siziň dizaýnyňyz)
  if (!isReady) {
    return (
      <ScrollView contentContainerStyle={styles.splashContainer}>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeader}>Programma barada:</Text>
          <Text style={styles.aboutText}>
            Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meňli Aşyrowa Altyýewna</Text>. 
            Bu programmany ýolda kynçylyga uçranlara ýa-da adresi tapyp bilmeýänlere 
            çalt kömek bermek üçin döretdim.
          </Text>
          <Text style={styles.instructionText}>
            Aşakdaky düwmä basyp, GPS koordinatanyzy SMS arkaly dostlaryňyza ugradyp bilersiňiz.
          </Text>
        </View>

        <View style={styles.actionSectionSplash}>
          {loading ? (
            <ActivityIndicator size="large" color="#e63946" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={() => setIsReady(true)}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.statusTextSplash}>{status}</Text>
        </View>

        <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
      </ScrollView>
    );
  }

  // 2. ESASY KARTA EKRANY
  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <MapView
        ref={mapRef}
        provider={null}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: currentLocation?.latitude || 37.96,
          longitude: currentLocation?.longitude || 58.32,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#e63946" />
        {savedPoint && <Marker coordinate={savedPoint} pinColor="blue" title="Doňdurlan" />}
      </MapView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Ýoly yzarla (Switch):</Text>
          <Switch value={isTracking} onValueChange={setIsTracking} trackColor={{ false: "#d1d1d1", true: "#e63946" }} />
        </View>

        <TouchableOpacity style={styles.button} onPress={shareLocation}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📍 ÝERIMI PAÝLAŞ</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, {backgroundColor: '#457b9d', marginTop: 10}]} onPress={async () => {
          if (currentLocation) {
            await AsyncStorage.setItem('saved_point', JSON.stringify(currentLocation));
            setSavedPoint(currentLocation);
            Alert.alert("Yatda saklandy", "Nokat doňduryldy.");
          }
        }}>
          <Text style={styles.buttonText}>❄️ NOKADY DOŇDUR</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flexGrow: 1, padding: 25, backgroundColor: '#f8f9fa', justifyContent: 'center' },
  aboutCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 4, marginBottom: 30 },
  aboutHeader: { fontSize: 22, fontWeight: 'bold', color: '#1d3557', marginBottom: 10 },
  aboutText: { fontSize: 16, color: '#333', lineHeight: 24, marginBottom: 15 },
  instructionText: { fontSize: 14, color: '#457b9d', fontStyle: 'italic' },
  actionSectionSplash: { alignItems: 'center', marginBottom: 40 },
  button: { backgroundColor: '#e63946', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12, elevation: 5, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statusTextSplash: { marginTop: 15, color: '#457b9d', fontWeight: 'bold' },
  footerText: { textAlign: 'center', color: '#999', fontSize: 12 },
  
  map: { width: '100%', height: Dimensions.get('window').height * 0.4 },
  container: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#1d3557' }
});
