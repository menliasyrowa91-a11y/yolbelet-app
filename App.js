import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState([]);
  const trackingSubscriber = useRef(null);

  const [region, setRegion] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    (async () => {
      let { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus("GPS rugsady berilmedi");
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMapReady(true);
    })();
  }, []);

  // FUNKSIÝA 1: ÝERIMI UGRAT (DEGMELI DÄL: Seniň original tekstiň we linkiň)
  const shareLocation = async () => {
    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`; // Seniň original formatyň
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýarlandy");
      } else {
        await Share.share({ message: messageBody });
      }
    } catch (error) {
      Alert.alert("Hata", "GPS tapylmady.");
    } finally {
      setLoading(false);
    }
  };

  // FUNKSIÝA 2: NOKADY ÝATDA SAKLA
  const savePointA = async () => {
    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setSavedLocation(location.coords);
      setStatus("A nokady saklandy");
      Alert.alert("Üstünlik", "A nokady ýatda saklandy!");
    } catch (error) {
      Alert.alert("Hata", "Nokady saklap bolmady.");
    } finally {
      setLoading(false);
    }
  };

  // FUNKSIÝA 3: ÝOL ÝAZGYSY (Mugt we Durnukly)
  const toggleTracking = async () => {
    if (isTracking) {
      if (trackingSubscriber.current) {
        trackingSubscriber.current.remove();
        trackingSubscriber.current = null;
      }
      setIsTracking(false);
      setStatus(`Ýazgy durdy.`);
      return;
    }
    setIsTracking(true);
    setPath([]); 
    trackingSubscriber.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (newLoc) => {
        const newCoord = { latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude };
        setPath((prev) => [...prev, newCoord]);
      }
    );
  };

  // FUNKSIÝA 4: YZYNA ÝOL GÖRKEZ
  const goToSavedPoint = async () => {
    if (!savedLocation) return;
    setLoading(true);
    try {
      let current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const url = `https://www.google.com/maps/dir/?api=1&origin=${current.coords.latitude},${current.coords.longitude}&destination=${savedLocation.latitude},${savedLocation.longitude}&travelmode=walking`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Hata", "Ugur açylmady.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
      </View>

      <View style={styles.mapContainer}>
        {mapReady && region ? (
          <MapView
            style={styles.map}
            initialRegion={region}
            mapCacheEnabled={true}
          >
            {/* IŇ DURNUKLY MUGT SERWER: Stadia Maps */}
            <UrlTile 
              urlTemplate="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png"
              maximumZ={19}
            />
            <Marker coordinate={region} title="Siz şu ýerde" />
            {savedLocation && <Marker coordinate={savedLocation} pinColor="blue" title="A nokady" />}
            <Polyline coordinates={path} strokeColor="#e63946" strokeWidth={4} />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="small" color="#1d3557" />
            <Text style={styles.mapLoadingText}>Karta taýýarlanýar...</Text>
          </View>
        )}
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutText}>
          Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meñli Aşyrowa</Text>. 
          Bu programma ýoluňyzy ýitirmän, başlangyç nokada dolanmaga kömek eder.
        </Text>
      </View>

      <View style={styles.actionSection}>
        {loading ? <ActivityIndicator size="large" color="#e63946" /> : (
          <>
            <TouchableOpacity style={styles.button} onPress={shareLocation}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.navyBtn]} onPress={savePointA}>
              <Text style={styles.buttonText}>💾 NOKADY ÝATDA SAKLA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor: isTracking ? '#e63946' : '#2a9d8f', marginTop: 15}]} onPress={toggleTracking}>
              <Text style={styles.buttonText}>{isTracking ? "⏹️ ÝAZGYNY DURUZ" : "🚶 ÝOL ÝAZGYSYNY ÝAZ"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor: savedLocation ? '#457b9d' : '#ccc', marginTop: 15}]} onPress={goToSavedPoint} disabled={!savedLocation}>
              <Text style={styles.buttonText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  logoText: { fontSize: 32, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d' },
  mapContainer: { width: '100%', height: 220, borderRadius: 15, overflow: 'hidden', marginBottom: 20, elevation: 5, backgroundColor: '#ddd' },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapLoadingText: { marginTop: 10, fontSize: 12, color: '#666' },
  aboutCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, width: '100%', marginBottom: 20 },
  aboutText: { fontSize: 14, color: '#333', textAlign: 'center' },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 3 },
  navyBtn: { backgroundColor: '#1d3557', marginTop: 15 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 13 },
  footerText: { marginTop: 30, color: '#a8dadc', fontSize: 10 },
});
