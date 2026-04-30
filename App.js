import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Share, 
  ActivityIndicator, ScrollView, StatusBar, useColorScheme, Linking, Platform 
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Kml, Polyline, Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Asset } from 'expo-asset';
import * as Updates from 'expo-updates'; // Howada täzeleme üçin

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
      // 1. Howada täzeleme (OTA) barlagy
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log("Täzeleme barlanyp bilinmedi");
      }

      // 2. Asset içindäki KMZ-ni ýüklemek
      try {
        const asset = Asset.fromModule(require('./assets/Yolbelet-un-offline.kmz'));
        await asset.downloadAsync();
        setKmlUri(asset.localUri);
      } catch (e) {
        console.log("KMZ ýüklenip bilinmedi");
      }

      // 3. Başlangyç maslahat bildirişi
      Alert.alert(
        "Ýolbelet Maslahaty",
        "Ýolbelediň offline hem işlemegini isleseňiz, hökman internete bagly ýagdaýda kartada gezmeläň. Siz nirede gezseňiz şol ýerler offline hem görüner.",
        [{ text: "Düşnükli" }]
      );

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
    return () => unsubscribeNet();
  }, []);

  // 4. SMS Nomerini Formatlamak (8 we +993 üçin)
  const formatPhoneNumber = (number) => {
    let cleaned = number.replace(/\D/g, ''); 
    if (cleaned.startsWith('8')) {
      return '+993' + cleaned.substring(1);
    } else if (cleaned.startsWith('993')) {
      return '+' + cleaned;
    }
    return number;
  };

  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");
    try {
      // SENIŇ ÖZ İŞLEÝÄN LİNKİŇ (GÖNÜMEL GAÝTARYLDY)
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
      Alert.alert("Netije", "Nokat ýatda saklandy!");
      setStatus("Nokat saklandy");
    } else {
      Alert.alert("Hata", "GPS anyklanmady.");
    }
  };

  const goToSavedPoint = async () => {
    if (!savedLocation || !location) {
      Alert.alert("Nokat ýok", "Ilki nokat ýatda saklaň!");
      return;
    }
    setLoading(true);
    try {
      // SENIŇ ÖZ İŞLEÝÄN UGUR GÖRKEZİJİ LİNKİŇ (GÖNÜMEL GAÝTARYLDY)
      const url = `http://googleusercontent.com/maps.google.com/6{location.latitude},${location.longitude}&destination=${savedLocation.latitude},${savedLocation.longitude}&travelmode=walking`;
      await Linking.openURL(url);
      setStatus("Karta açyldy");
    } catch (error) {
      // Ätiýaçlyk usul
      const backupUrl = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${savedLocation.latitude},${savedLocation.longitude}`;
      await Linking.openURL(backupUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: isDarkMode ? '#121212' : '#f8f9fa' }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        <View style={styles.header}>
          <Text style={[styles.logoText, { color: isDarkMode ? '#fff' : '#1d3557' }]}>📍 ÝOLBELET</Text>
          <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#2a9d8f' : '#e63946' }]}>
            <Text style={styles.statusBadgeText}>{isConnected ? "Online" : "Offline Mode"}</Text>
          </View>
        </View>

        <View style={[styles.mapWrapper, { elevation: isDarkMode ? 0 : 4 }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
            showsMyLocationButton={true}
            initialRegion={{
              latitude: 38.45,
              longitude: 56.30,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            // 5. OFFLINE KEŞ SAZLAMALARY
            mapCacheConfig={{
              maxAge: 30, // 30 gün
              maxSize: 500, // 500 MB
            }}
          >
            <UrlTile 
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />
            {kmlUri && <Kml kmlAsset={kmlUri} />}
            <Polyline coordinates={routeCoordinates} strokeColor="#457b9d" strokeWidth={5} />
            {savedLocation && <Marker coordinate={savedLocation} pinColor="#e63946" title="Galan ýerim" />}
          </MapView>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowFullText(!showFullText)} style={[styles.aboutCard, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <Text style={[styles.aboutHeader, { color: isDarkMode ? '#a8dadc' : '#1d3557' }]}>Programma barada:</Text>
          <Text style={[styles.aboutText, { color: isDarkMode ? '#eee' : '#333' }]}>
             Düzüji: <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meñli Aşyrowa</Text>. Bu ulgam offline we online kartalar arkaly siziň iň ygtybarly ýolbelediňizdir.
            {showFullText && (
              <Text>{"\n\n"}1. Ýeriňi ugrat: SMS formaty awtomatiki düzedilýär.{"\n"}2. Offline: Gezilen ýerler ýatda saklanýar.</Text>
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

        <Text style={styles.footerText}>© 2026 Ýolbelet - Version 1.5.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  container: { paddingVertical: 40, paddingHorizontal: 20 },
  header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { fontSize: 28, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  mapWrapper: { height: 350, width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 25 },
  map: { flex: 1 },
  aboutCard: { padding: 20, borderRadius: 20, marginBottom: 25, elevation: 3 },
  aboutHeader: { fontSize: 18, fontWeight: 'bold' },
  aboutText: { fontSize: 15, lineHeight: 22 },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 16, borderRadius: 15, width: '100%', alignItems: 'center', elevation: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 13 },
  footerText: { marginTop: 30, color: '#888', fontSize: 11, textAlign: 'center', paddingBottom: 20 },
});
