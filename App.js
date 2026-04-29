import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Share, 
  ActivityIndicator, ScrollView, StatusBar, useColorScheme, Linking, Platform 
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Kml, Polyline, Marker, UrlTile } from 'react-native-maps'; // PROVIDER_GOOGLE aýryldy
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Asset } from 'expo-asset';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  
  const [location, setLocation] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [kmlUri, setKmlUri] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    async function prepareApp() {
      try {
        const asset = Asset.fromModule(require('./assets/Yolbelet-un-offline.kmz'));
        await asset.downloadAsync();
        setKmlUri(asset.localUri);
      } catch (e) {
        console.log("KMZ ýüklenip bilinmedi");
      }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedLocation(JSON.parse(storedPoint));

      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus === 'granted') {
        Location.watchPositionAsync(
          { 
            accuracy: Location.Accuracy.BestForNavigation, 
            distanceInterval: 5, 
            timeInterval: 2000 
          },
          (newLoc) => {
            const coords = { latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude };
            setLocation(coords);
            setRouteCoordinates(prev => [...prev, coords]);
          }
        );
      }
    }

    prepareApp();

    Alert.alert(
      "YOLBELET: AWTOMATIKI ÝATDA SAKLAMAK 📱",
      "Seniň gezelenç edýän meýdanlaryň awtomatiki usulda telefonyň ýadyna (cache) ýazylýar.\n\n" +
      "MÖHÜM: Karta doly ýazylar ýaly, internet bar wagty barjak meýdanyňyza bir gezek göz aýlaň.",
      [{ text: "Düşünikli, dowam et!" }]
    );

    return () => unsubscribeNet();
  }, []);

  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");
    try {
      // SENIŇ HAKYKY İŞLEÝÄN LİNKİŇ (DEGİLMEDİ)
      const mapUrl = `Maps.google.com/?q=${location.latitude},${location.longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýarlandy");
      } else {
        await Share.share({ message: messageBody });
        setStatus("Paýlaşyldy");
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "GPS maglumatyny alyp bolmady.");
      setStatus("Näsazlyk ýüze çykdy");
    } finally {
      setLoading(false);
    }
  };

  const savePointA = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedLocation(location);
      Alert.alert("Success", "A nokady (başlangyç) ýatda saklandy!");
      setStatus("A nokady saklandy");
    } else {
      Alert.alert("Hata", "GPS anyklanmady, nokady saklap bolmady.");
    }
  };

  const goToSavedPoint = async () => {
    if (!savedLocation || !location) {
      Alert.alert("Nokat ýok", "Ilki nokat ýatda saklaň!");
      return;
    }
    setLoading(true);
    setStatus("Ýol hasaplanýar...");
    try {
      // SENIŇ İŞLEÝÄN UGUR GÖRKEZİJİ LİNKİŇ (DEGİLMEDİ)
      const url = `http://googleusercontent.com/maps.google.com/6{location.latitude},${location.longitude}&destination=${savedLocation.latitude},${savedLocation.longitude}&travelmode=walking`;
      await Linking.openURL(url);
      setStatus("Karta açyldy");
    } catch (error) {
      Alert.alert("Hata", "Ugur hasaplananda ýalňyşlyk boldy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={[styles.logoText, { color: isDarkMode ? '#fff' : '#1d3557' }]}>📍 ÝOLBELET</Text>
        <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#2a9d8f' : '#e63946' }]}>
          <Text style={styles.statusBadgeText}>{isConnected ? "Online" : "Offline (Garrygala)"}</Text>
        </View>
      </View>

      <View style={[styles.mapWrapper, { elevation: isDarkMode ? 0 : 4 }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          // PROVIDER_GOOGLE AYRYLDY - KRASH BOLMAZ!
          mapType={Platform.OS === "android" ? "none" : "standard"}
          showsUserLocation={true}
          followsUserLocation={true}
          loadingEnabled={true}
          initialRegion={{
            latitude: 38.45,
            longitude: 56.30,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {/* MUGT OSM KARTASY GOŞULDY */}
          <UrlTile 
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {kmlUri && <Kml kmlAsset={kmlUri} />}
          <Polyline coordinates={routeCoordinates} strokeColor="#457b9d" strokeWidth={5} />
          {savedLocation && <Marker coordinate={savedLocation} pinColor="#e63946" title="Galan ýerim" />}
        </MapView>
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={() => setShowFullText(!showFullText)} style={[styles.aboutCard, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
        <Text style={[styles.aboutHeader, { color: isDarkMode ? '#a8dadc' : '#1d3557' }]}>Programma barada:</Text>
        <Text style={[styles.aboutText, { color: isDarkMode ? '#eee' : '#333' }]}>
           <Text style={{fontWeight: 'bold', color: '#e63946'}}></Text>. Bu ulgam siziň gerekli ýeriňizi tiz tapmagyňyz we azaşmazlygyňyz üçin niýetlenendir...
          {showFullText && (
            <Text>{"\n\n"}1. Ýeriňi ugrat: Duran nokadyňyzy SMS bilen ugradyň.{"\n"}2. Nokady sakla: Bilýän ýeriňizde nokady belleýärsiňiz, soňra yzyňyza ýol görkezer.</Text>
          )}
        </Text>
        <Text style={{color: '#457b9d', fontSize: 12, marginTop: 10, textAlign: 'right'}}>
          {showFullText ? "Gysgalt ▲" : "Doly oka ▼"}
        </Text>
      </TouchableOpacity>

      <View style={styles.actionSection}>
        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={shareLocation}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, {backgroundColor: '#1d3557', marginTop: 15}]} 
              onPress={savedLocation ? () => { setSavedLocation(null); AsyncStorage.removeItem('saved_point'); } : savePointA}
            >
              <Text style={styles.buttonText}>{savedLocation ? "🔄 TÄZE NOKAT BELLE" : "💾 NOKADY ÝATDA SAKLA"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, {backgroundColor: savedLocation ? '#457b9d' : '#ccc', marginTop: 15}]} 
              onPress={goToSavedPoint}
              disabled={!savedLocation}
            >
              <Text style={styles.buttonText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Aşyrowa Meňli Altyýewna</Text>
           <Text style={styles.footerText}>© Version 1.4.0 </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingVertical: 40, paddingHorizontal: 20 },
  header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { fontSize: 28, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  mapWrapper: { height: 320, width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 25 },
  map: { flex: 1 },
  aboutCard: { padding: 20, borderRadius: 20, marginBottom: 25, elevation: 3 },
  aboutHeader: { fontSize: 18, fontWeight: 'bold' },
  aboutText: { fontSize: 15, lineHeight: 22 },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 16, borderRadius: 15, width: '100%', alignItems: 'center', elevation: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 13 },
  footerText: { marginTop: 30, color: '#888', fontSize: 11, textAlign: 'center' },
});
