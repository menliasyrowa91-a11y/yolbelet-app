import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking, Image, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { UrlTile, Marker } from 'react-native-maps'; // Täze: Karta üçin
import { ChevronDown, ChevronUp } from 'lucide-react-native'; // Täze: Ikonajyklar

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [savedPoint, setSavedPoint] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false); // Täze: Header açyp-ýapmak üçin

  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus("GPS rugsady ýok");
        return;
      }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
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
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      const { latitude, longitude } = location;
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
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
    const url = `https://Maps.google.com/?q=${savedPoint.latitude},${savedPoint.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert("Hata", "Karta açylmady."));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      
      {/* 🟢 TÄZE: GIZLENÝÄN WE AÇYLYAN HEADER */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setIsExpanded(!isExpanded)} 
        style={styles.collapsibleHeader}
      >
        <View style={styles.headerRow}>
          <Image source={require('./assets/icon.png')} style={styles.miniIcon} />
          <View>
            <Text style={styles.logoTextSmall}>📍 ÝOLBELET</Text>
            <Text style={styles.subTitleSmall}>Meňli Aşyrowa (v4 Offline)</Text>
          </View>
          <View style={styles.chevronIcon}>
            {isExpanded ? <ChevronUp size={24} color="#1d3557" /> : <ChevronDown size={24} color="#1d3557" />}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedInfo}>
            <Text style={styles.aboutText}>
              Salam! Men <Text style={styles.highlightText}>Meňli Aşyrowa Altyýewna</Text>.
              {"\n\n"}
              Maksat: Azaşan ulanyjylary başlangyç nokadyna (öýine, ulagyna) durnukly dolandyrmak.
              {"\n\n"}
              • <Text style={{fontWeight: 'bold'}}>Nokady Doňdur:</Text> Offline kordinata saklaýar.
              {"\n"}• <Text style={{fontWeight: 'bold'}}>Yzyna Ýol:</Text> Google Maps arkaly gönükdirýär.
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 🔵 TÄZE: OFFLINE KARTA BÖLÜMI */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 38.4333, // Magtymguly (Garrygala)
            longitude: 54.3667,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          mapType="none"
        >
          <UrlTile urlTemplate={OSM_URL} shouldReplaceMapContent={true} />
          {location && <Marker coordinate={location} title="Siziň ýeriňiz" />}
          {savedPoint && (
            <Marker 
              coordinate={savedPoint} 
              pinColor="blue" 
              title="Saklanan Nokat" 
            />
          )}
        </MapView>
      </View>

      {/* 🔴 ACTION BUTTONS (Siziň düwmeleriňiz) */}
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
  // Header Stilleri
  collapsibleHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
    zIndex: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  miniIcon: { width: 40, height: 40, marginRight: 12, borderRadius: 8 },
  logoTextSmall: { fontSize: 20, fontWeight: '900', color: '#1d3557' },
  subTitleSmall: { fontSize: 12, color: '#457b9d' },
  chevronIcon: { flex: 1, alignItems: 'flex-end' },
  expandedInfo: { marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f1f1' },
  
  // Karta Stilleri
  mapWrapper: { flex: 1 },
  map: { width: '100%', height: '100%' },

  // Düwme Stilleri
  actionContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
  },
  button: { 
    backgroundColor: '#e63946', 
    paddingVertical: 15, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3
  },
  btnBlue: { backgroundColor: '#1d3557' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  aboutText: { fontSize: 14, color: '#444', lineHeight: 20 },
  highlightText: { fontWeight: 'bold', color: '#e63946' },
  statusText: { textAlign: 'center', color: '#457b9d', fontSize: 12, marginTop: 5 },
  footerText: { textAlign: 'center', color: '#999', fontSize: 10, paddingBottom: 10, backgroundColor: '#fff' }
});
