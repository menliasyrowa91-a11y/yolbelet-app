import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Share, 
  ActivityIndicator, ScrollView, StatusBar, Linking, useColorScheme 
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [location, setLocation] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [status, setStatus] = useState("Garaşylýar...");
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });

    async function setupApp() {
      try {
        const stored = await AsyncStorage.getItem('saved_point');
        if (stored) {
          setSavedLocation(JSON.parse(stored));
        }

        let { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') {
          setStatus("GPS Rugsady ýok");
          return;
        }

        locationSubscription.current = await Location.watchPositionAsync(
          { 
            accuracy: Location.Accuracy.High, 
            distanceInterval: 5, 
            timeInterval: 10000 
          },
          (newLoc) => {
            if (newLoc.coords) {
              setLocation(newLoc.coords);
              setStatus("Taýýar");
            }
          }
        );
      } catch (e) {
        setStatus("Sistem hatasy");
      }
    }

    setupApp();

    return () => {
      unsubscribeNet();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const handleShareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    
    setLoading(true);
    try {
      // Siziň tassyklan durnukly formatyňyz
        const mapLink = `Maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = `YOLBELET: Menin yerim: ${mapLink}`;
      
      const isSms = await SMS.isAvailableAsync();
      if (isSms) {
        await SMS.sendSMSAsync([], message);
      } else {
        await Share.share({ message });
      }
    } catch (e) {
      Alert.alert("Hata", "Paýlaşyp bolmady.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePoint = async () => {
    if (!location) return;
    try {
      const pt = { latitude: location.latitude, longitude: location.longitude };
      await AsyncStorage.setItem('saved_point', JSON.stringify(pt));
      setSavedLocation(pt);
      Alert.alert("Ýolbelet", "Duran ýeriňiz ýatda saklandy.");
    } catch (e) {
      Alert.alert("Hata", "Ýatda saklap bolmady.");
    }
  };

  const handleNavigate = async () => {
    if (!savedLocation) return;
    // Yzyna ýol görkezmek üçin iň dogry Google Maps URL
    const url = `https://www.google.com/maps/dir/?api=1&destination=${savedLocation.latitude},${savedLocation.longitude}&travelmode=walking`;
    
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Hata", "Google Maps açylmady.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDarkMode ? '#FFF' : '#1D3557' }]}>📍 ÝOLBELET</Text>
          <Text style={styles.v}>v2.8 SDK 52</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isConnected ? '#2A9D8F' : '#E63946' }]}>
          <Text style={styles.badgeText}>{isConnected ? "Online" : "Offline"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mapBox}>
          {location ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              showsUserLocation={true}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <UrlTile 
                urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maximumZ={19}
              />
              {savedLocation && <Marker coordinate={savedLocation} pinColor="red" />}
            </MapView>
          ) : (
            <View style={styles.mapWait}>
              <ActivityIndicator color="#FFF" size="large" />
              <Text style={{color:'#FFF', marginTop:10}}>GPS Garaşylýar...</Text>
            </View>
          )}
        </View>

        <View style={styles.btns}>
          {loading ? (
            <ActivityIndicator size="large" color="#E63946" style={{marginVertical: 20}} />
          ) : (
            <>
              <TouchableOpacity activeOpacity={0.8} style={styles.btn1} onPress={handleShareLocation}>
                <Text style={styles.btnT}>📍 ÝERİMİ UGRAT (SMS)</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.btn2} onPress={handleSavePoint}>
                <Text style={styles.btnT}>💾 NOKADY ÝATDA SAKLA</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.btn3, { opacity: savedLocation ? 1 : 0.4 }]} 
                onPress={handleNavigate}
                disabled={!savedLocation}
              >
                <Text style={styles.btn3T}>🔙 YZYNA ÝOL GÖRKEZ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' }]}>
          <Text style={[styles.cT, { color: isDarkMode ? '#A8DADC' : '#457B9D' }]}>Düzüji: Meñli Aşyrowa</Text>
          <Text style={[styles.cB, { color: isDarkMode ? '#BBB' : '#666' }]}>
              Bu programmany öz ýerleşýän ýeriňizi çalt sms arkaly ugradyp bilmegiňiz üçin we nätänyş ýerlerde azaşmazlygyňyz üçin döretdim
          </Text>
        </View>
        <Text style={styles.foot}>© 2026 Ýolbelet | Status: {status}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  v: { fontSize: 10, color: '#999' },
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 15, paddingBottom: 40 },
  mapBox: { height: 320, borderRadius: 25, overflow: 'hidden', backgroundColor: '#333', marginBottom: 20 },
  map: { flex: 1 },
  mapWait: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btns: { marginBottom: 10 },
  btn1: { backgroundColor: '#E63946', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 12 },
  btn2: { backgroundColor: '#1D3557', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 12 },
  btn3: { padding: 18, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#457B9D' },
  btnT: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btn3T: { color: '#457B9D', fontSize: 16, fontWeight: 'bold' },
  card: { borderRadius: 20, padding: 20, marginTop: 10 },
  cT: { fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  cB: { fontSize: 13, lineHeight: 20 },
  foot: { textAlign: 'center', marginTop: 25, color: '#999', fontSize: 11 }
});
