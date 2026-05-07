import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Share, 
  ActivityIndicator, ScrollView, StatusBar, Linking, useColorScheme 
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { UrlTile, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });

    async function setupApp() {
      try {
        // 1. AsyncStorage Krash Goragy
        const stored = await AsyncStorage.getItem('saved_point');
        if (stored) {
          try {
            setSavedLocation(JSON.parse(stored));
          } catch (parseError) {
            await AsyncStorage.removeItem('saved_point');
          }
        }

        // 2. GPS Rugsatlary we Takyklyk (Highest - 3-5 metr üçin)
        let { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') {
          setStatus("GPS Rugsady ýok");
          return;
        }

        // Location watcher: Ýer üýtgände kartany awtomatiki täzeleýär
        await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Highest, distanceInterval: 5 },
          (newLoc) => {
            setLocation(newLoc.coords);
            setStatus("Taýýar");
          }
        );

      } catch (e) {
        console.error("Başlangyç hatasy:", e);
        setStatus("Sistem hatasy");
      }
    }

    setupApp();
    return () => unsubscribe();
  }, []);

  // SMS Link formatyňyzy saklap, ýerleşýän ýeri paýlaşmak
  const handleShareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady. Biraz açyk asmanda garaşyň.");
      return;
    }
    setLoading(true);
    try {
      const mapLink = `Maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = "YOLBELET: Menin yerim: " + mapLink;
      
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

  // Nokady ýatda sakla - Dublikat barlagly we Krash goragly
  const handleSavePoint = async () => {
    if (!location?.latitude) {
      Alert.alert("Hata", "Häzirki GPS koordinatasy ýok.");
      return;
    }
    
    try {
      const pointToSave = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      
      await AsyncStorage.setItem('saved_point', JSON.stringify(pointToSave));
      setSavedLocation(pointToSave);
      setStatus("Nokat ýatda saklandy");
      Alert.alert("Ýolbelet", "Duran ýeriňiz ýatda saklandy.");
    } catch (e) {
      Alert.alert("Hata", "Maglumat ýazylmady.");
    }
  };

  // Yzyna ýol görkez - Linking Error Handling bilen
  const handleNavigate = async () => {
    if (!savedLocation || !location) return;
    const url = `http://maps.google.com/maps?saddr=${location.latitude},${location.longitude}&daddr=${savedLocation.latitude},${savedLocation.longitude}&directionsmode=walking`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Hata", "Siziň telefonyňyzda ugur görkeziji programma tapylmady.");
      }
    } catch (e) {
      Alert.alert("Hata", "Navigasiýa açylmady.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDarkMode ? '#FFF' : '#1D3557' }]}>📍 ÝOLBELET</Text>
          <Text style={styles.v}>v2.8 Professional</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isConnected ? '#2A9D8F' : '#E63946' }]}>
          <Text style={styles.badgeText}>{isConnected ? "Online" : "Offline"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mapBox}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            mapType="none" 
            showsUserLocation={true}
            showsMyLocationButton={true}
            initialRegion={{
              latitude: location?.latitude || 37.95,
              longitude: location?.longitude || 58.38,
              latitudeDelta: 0.005, // Has ýakyn görünüş
              longitudeDelta: 0.005,
            }}
          >
            <UrlTile 
              urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maximumZ={19}
              tileSize={256}
              shouldReplaceMapContent={true} 
            />
            {savedLocation && (
              <Marker 
                coordinate={savedLocation} 
                pinColor="red" 
                title="Ýatda saklanan ýer"
              />
            )}
          </MapView>
        </View>

        <View style={styles.btns}>
          {loading ? <ActivityIndicator size="large" color="#E63946" /> : (
            <>
              <TouchableOpacity style={styles.btn1} onPress={handleShareLocation} activeOpacity={0.8}>
                <Text style={styles.btnT}>📍 ÝERİMİ UGRAT (SMS)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btn2} onPress={handleSavePoint} activeOpacity={0.8}>
                <Text style={styles.btnT}>💾 NOKADY ÝATDA SAKLA</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn3, { opacity: savedLocation ? 1 : 0.4 }]} 
                onPress={handleNavigate}
                disabled={!savedLocation}
                activeOpacity={0.8}
              >
                <Text style={styles.btn3T}>🔙 YZYNA ÝOL GÖRKEZ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' }]}>
          <Text style={[styles.cT, { color: isDarkMode ? '#A8DADC' : '#457B9D' }]}>Düzüji: Meñli Aşyrowa Altyýewna</Text>
          <Text style={[styles.cB, { color: isDarkMode ? '#BBB' : '#666' }]}>
             Bu programmany öz ýerleşýän ýeriňizi çalt sms arkaly ugradyp bilmegiňiz üçin we nätänyş ýerlerde azaşmazlygyňyz üçin döretdim.
          </Text>
        </View>
        <Text style={styles.foot}>© 2026 Ýolbelet | Status: {status}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '900' },
  v: { fontSize: 10, color: '#999' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  mapBox: { height: 350, borderRadius: 25, overflow: 'hidden', elevation: 10, backgroundColor: '#000', marginBottom: 20 },
  map: { flex: 1 },
  btns: { marginBottom: 10 },
  btn1: { backgroundColor: '#E63946', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 12 },
  btn2: { backgroundColor: '#1D3557', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 12 },
  btn3: { padding: 18, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#457B9D' },
  btnT: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btn3T: { color: '#457B9D', fontSize: 16, fontWeight: 'bold' },
  card: { borderRadius: 20, padding: 20, marginTop: 10 },
  cT: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cB: { fontSize: 13, lineHeight: 18 },
  foot: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 11 }
});
