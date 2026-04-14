import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Dimensions, Switch } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [isReady, setIsReady] = useState(false); 
  const [isTracking, setIsTracking] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedPoint, setSavedPoint] = useState(null); 
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const mapRef = useRef(null);

  // 1. Ilkinji rugsat we ýönekeý kordinata (Accuracy peseldildi)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      try {
        // Çalt işlemesi üçin pes takyklykda alýarys
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (e) { console.log("GPS entek taýýar däl"); }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));
    })();
  }, []);

  // 2. Ýoly yzarlamak (Diňe Switch açyk bolsa oýanýar)
  useEffect(() => {
    let subscriber;
    if (isTracking && isReady) {
      subscriber = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 20 },
        (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentLocation({ latitude, longitude });
          setRouteCoordinates((prev) => [...prev, { latitude, longitude }]);
        }
      );
    }
    return () => subscriber?.then(s => s.remove());
  }, [isTracking, isReady]);

  // 1-nji wersiýadaky ýaly takyk paýlaşmak funksiýasy
  const shareLocation = async () => {
    setLoading(true);
    try {
      // Düwmä basylanda täze we takyk kordinata soralyň
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCurrentLocation({ latitude, longitude });

      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
      } else {
        await Share.share({ message: messageBody });
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "GPS maglumatyny alyp bolmady.");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <ScrollView contentContainerStyle={styles.splashContainer}>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeader}>Programma barada:</Text>
          <Text style={styles.aboutText}>
            Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meňli Aşyrowa Altyýewna</Text>. 
            Bu programmany ýolda kynçylyga uçranlara çalt kömek bermek üçin döretdim.
          </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => setIsReady(true)}>
          <Text style={styles.buttonText}>KARTANY AÇ</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        // showsUserLocation={true} - KRASH SEBÄPLI AÝYRDYK
        initialRegion={{
          latitude: currentLocation?.latitude || 37.96,
          longitude: currentLocation?.longitude || 58.32,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {currentLocation && <Marker coordinate={currentLocation} title="Meniň ýerim" />}
        <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#e63946" />
        {savedPoint && <Marker coordinate={savedPoint} pinColor="blue" title="Doňdurlan" />}
      </MapView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Ýoly yzarla:</Text>
          <Switch value={isTracking} onValueChange={setIsTracking} trackColor={{ false: "#d1d1d1", true: "#e63946" }} />
        </View>

        <TouchableOpacity style={styles.button} onPress={shareLocation}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📍 ÝERIMI PAÝLAŞ</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, {backgroundColor: '#457b9d', marginTop: 10}]} onPress={async () => {
            if (currentLocation) {
              await AsyncStorage.setItem('saved_point', JSON.stringify(currentLocation));
              setSavedPoint(currentLocation);
              Alert.alert("Tassyklama", "Nokat ýatda saklandy.");
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
  aboutHeader: { fontSize: 22, fontWeight: 'bold', color: '#1d3557' },
  aboutText: { fontSize: 16, color: '#333', lineHeight: 24 },
  map: { width: '100%', height: Dimensions.get('window').height * 0.45 },
  container: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#1d3557' },
  button: { backgroundColor: '#e63946', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
