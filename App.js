import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, Linking, Image } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Network from 'expo-network'; // Täze: Internet barlagy üçin
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { ChevronDown, ChevronUp, WifiOff } from 'lucide-react-native';

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [savedPoint, setSavedPoint] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    (async () => {
      // 1. Internet barlagy we duýduryş
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        setIsOfflineMode(true);
        Alert.alert(
          "Karta barada maslahat",
          "Haýyş edýän, ilki internede çatylyp, kartada gezim ediň. Soňra şol gezen ýerleriňizi offline hem görüp bilersiňiz.",
          [{ text: "Düşnükli", style: "default" }]
        );
      }

      // 2. GPS rugsady
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus("GPS rugsady ýok");
        return;
      }

      // 3. Saklanan nokady ýükle
      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

      // 4. GPS yzarlamak
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (newLocation) => {
          setLocation(newLocation.coords);
          if (!networkState.isConnected) setStatus("Offline: GPS işleýär");
        }
      );
    })();
  }, []);

  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    setLoading(true);
    try {
      const { latitude, longitude } = location;
      // 🟢 1000% IŞLEÝÄN LINKIŇ (Asla üýtgedilmedi):
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        // Nomer meselesi: [] goýsak, ulanyjy özi saýlaýar we 8/+993 meselesi döremeýär
        await SMS.sendSMSAsync([], messageBody);
      } else {
        await Share.share({ message: messageBody });
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "SMS taýýarlap bolmady.");
    } finally {
      setLoading(false);
    }
  };

  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Nokat Saklandy", "Başlangyç nokadyňyz ýatda saklandy.");
      setStatus("Nokat saklandy");
    } else {
      Alert.alert("Hata", "GPS tapylmady.");
    }
  };

  const goToSavedPoint = () => {
    if (!savedPoint) {
      Alert.alert("Nokat ýok", "Ilki nokady saklamaly.");
      return;
    }
    // 🟢 SIZIŇ 1000% IŞLEÝÄN LINKIŇIZ:
    const url = `https://Maps.google.com/?q=${savedPoint.latitude},${savedPoint.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert("Hata", "Karta açylmady."));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setIsExpanded(!isExpanded)} 
        style={styles.collapsibleHeader}
      >
        <View style={styles.headerRow}>
          <Image source={require('./assets/icon.png')} style={styles.miniIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.logoTextSmall}>📍 ÝOLBELET</Text>
            <Text style={styles.subTitleSmall} numberOfLines={isExpanded ? 0 : 1}>
               {isExpanded ? "Meňli Aşyrowa Altyýewna (v4 Offline)" : "Meňli Aşyrowa... (Doly görmek üçin basyň)"}
            </Text>
          </View>
          <View style={styles.chevronIcon}>
            {isExpanded ? <ChevronUp size={24} color="#1d3557" /> : <ChevronDown size={24} color="#1d3557" />}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedInfo}>
            <Text style={styles.aboutText}>
              Salam! Men <Text style={styles.highlightText}>Meňli Aşyrowa</Text>.
              {"\n\n"}
              <Text style={{fontWeight: 'bold', color: '#e63946'}}>🌍 OFFLINE GID:</Text>
              {"\n"}• Ilki internetde kartany bir gezek geziň.
              {"\n"}• Soňra şol ýerleri internetsiz görüp bilersiňiz.
              {"\n\n"}
              • <Text style={{fontWeight: 'bold'}}>Nokady Sakla:</Text> Offline nokat goýýar.
              {"\n"}• <Text style={{fontWeight: 'bold'}}>Yzyna Ýol:</Text> Saklanan nokada elter.
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 38.4333,
            longitude: 54.3667,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          mapType="none"
        >
          <UrlTile urlTemplate={OSM_URL} shouldReplaceMapContent={true} />
          {location && <Marker coordinate={location} title="Siziň ýeriňiz" />}
          {savedPoint && <Marker coordinate={savedPoint} pinColor="blue" title="Saklanan Nokat" />}
        </MapView>
        
        {/* Offline belgisi */}
        {isOfflineMode && (
          <View style={styles.offlineBadge}>
            <WifiOff size={14} color="white" />
            <Text style={styles.offlineBadgeText}>Offline Mode</Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={[styles.button, styles.btnBlue]} onPress={freezeLocation}>
          <Text style={styles.buttonText}>📍 NOKADY SAKLA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, {backgroundColor: savedPoint ? '#457b9d' : '#ccc'}]} 
          onPress={goToSavedPoint}
          disabled={!savedPoint}
        >
          <Text style={styles.buttonText}>🔙 YZYNA ÝOL</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={shareLocation}>
            <Text style={styles.buttonText}>✉️ SMS UGRAT</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
    elevation: 3, zIndex: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  miniIcon: { width: 40, height: 40, marginRight: 12, borderRadius: 8 },
  logoTextSmall: { fontSize: 20, fontWeight: '900', color: '#1d3557' },
  subTitleSmall: { fontSize: 12, color: '#457b9d', marginTop: 2 },
  chevronIcon: { flex: 1, alignItems: 'flex-end' },
  expandedInfo: { marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f1f1' },
  mapWrapper: { flex: 1 },
  map: { width: '100%', height: '100%' },
  offlineBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(29, 53, 87, 0.7)',
    flexDirection: 'row', padding: 6, borderRadius: 12, alignItems: 'center'
  },
  offlineBadgeText: { color: 'white', fontSize: 10, marginLeft: 5 },
  actionContainer: {
    padding: 20, backgroundColor: '#fff',
    borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 10,
  },
  button: { 
    backgroundColor: '#e63946', paddingVertical: 15, 
    borderRadius: 15, alignItems: 'center', marginBottom: 10,
    elevation: 3
  },
  btnBlue: { backgroundColor: '#1d3557' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  aboutText: { fontSize: 14, color: '#444', lineHeight: 22 },
  highlightText: { fontWeight: 'bold', color: '#e63946' },
  statusText: { textAlign: 'center', color: '#457b9d', fontSize: 12, marginTop: 5 },
  footerText: { textAlign: 'center', color: '#999', fontSize: 10, paddingBottom: 10, backgroundColor: '#fff' }
});
