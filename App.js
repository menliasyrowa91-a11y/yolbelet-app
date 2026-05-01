import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Asset } from 'expo-asset';

export default function App() {
  // --- PROGRAMMANYŇ ÝAGDAÝY (STATE) ---
  const [status, setStatus] = useState("Ulanmaga taýýar"); // Ekranda görünýän maglumat haty
  const [loading, setLoading] = useState(false); // Ýüklenip duran wagty (Loading) görkezmek üçin
  const [path, setPath] = useState([]); // Ulanyjynyň hakyky ýörän nokatlaryny saklaýan sanaw (Array)
  const [isTracking, setIsTracking] = useState(false); // Ýol ýazgysynyň açyk ýa-da ýapykdygyny bilmek üçin
  const mapRef = useRef(null); // Karta gönüden-göni buýruk bermek üçin (mysal üçin: kamerany süýşürmek)

  /**
   * 1. ÝERIMI SMS BILEN UGRAT
   * Bu funksiýa häzirki GPS koordinatalaryny alýar we Google Maps çyzgysy (link) görnüşinde
   * SMS ýa-da başga programmalar arkaly paýlaşmaga mümkinçilik berýär.
   */
  const shareLocation = async () => {
    setLoading(true);
    try {
      // GPS ulanmak üçin ulanyjydan rugsat soraýarys
      let { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert("Rugsat ýok", "GPS rugsady gerek.");
        return;
      }

      // Häzirki ýerimizi iň ýokary takyklykda anyklaýarys
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      
      // Google Maps linkini döredýäris
      const url = `Maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      const msg = "YOLBELET: Menin yerim: " + url;

      // SMS ugradyp bolýandygyny barlaýarys
      const isSms = await SMS.isAvailableAsync();
      if (isSms) {
        await SMS.sendSMSAsync([], msg); // SMS programmasyny açýar
      } else {
        await Share.share({ message: msg }); // Başga programmalar (WhatsApp, Telegram) arkaly paýlaşýar
      }
      setStatus("Ýerleşýän ýeriňiz paýlaşyldy");
    } catch (e) {
      Alert.alert("Hata", "GPS tapylmady.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. ÝOL ÝAZGYSYNY BAŞLAT/DURUZ
   * Bu funksiýa "Breadcrumbing" usuly bilen işleýär. Ulanyjy ýörände, 
   * her 3 metrden täze koordinatany 'path' sanawyna goşýar.
   */
  const toggleTracking = async () => {
    // Eger eýýäm ýazgy edilip duran bolsa, ony duruzýarys
    if (isTracking) {
      setIsTracking(false);
      setStatus("Ýol ýazgy edildi.");
      return;
    }

    // GPS rugsady barlanýar
    let { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert("Rugsat ýok", "Ýol ýazmak üçin GPS gerek.");
      return;
    }

    setIsTracking(true);
    setPath([]); // Täze ýazgy başlananda öňki ýoly arassalaýarys
    setStatus("Ýörän ýoluňyz ýazylýar...");

    // Ulanyjynyň hereketini yzarlamaga başlaýarys
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest, // Iň ýokary GPS takyklygy
        distanceInterval: 3, // Ulanyjy her 3 metr ýörediginden täze nokat goýar
      },
      (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        // Täze nokady öňki nokatlaryň üstüne goşýarys
        setPath((currentPath) => [...currentPath, { latitude, longitude }]);
      }
    );
  };

  /**
   * 3. OFFLINE KMZ GÖRKEZMEK
   * Internet ýok wagty öňden taýýarlanan meýdan maglumatlaryny (KMZ) 
   * kartaň üstüne gatlak hökmünde ýükleýär.
   */
  const loadOfflineKMZ = async () => {
    try {
      // Assets papkasyndaky KMZ faýlyny tapýarys
      const kmz = Asset.fromModule(require('./assets/Yolbelet-un-offline.kmz'));
      await kmz.downloadAsync(); // Faýly telefonyň ýadyna ýükleýäris
      Alert.alert("Offline Karta", "KMZ gatlagy işjeňleşdirildi.");
      setStatus("Offline gatlak açyk");
    } catch (e) {
      Alert.alert("Hata", "KMZ faýly tapylmady. 'assets' papkasynda faýlyň barlygyny barlaň.");
    }
  };

  // --- EKRAN GÖRNÜŞI (UI) ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ýokarky Logo we Sözbaşy */}
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Düzüji: Meňli Aşyrowa</Text>
      </View>

      {/* KARTA MEÝDANÇASY */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true} // Ulanyjynyň özüni kartaň üstünde görkezmek
          followsUserLocation={true} // Kameranyň ulanyjy bilen bile süýşmegi
        >
          {/* Ýazgy edilen ýoly kartaň üstünde gyzyl çyzyk hökmünde çyzýarys */}
          {path.length > 0 && (
            <Polyline
              coordinates={path}
              strokeColor="#e63946" // Çyzygyň reňki
              strokeWidth={5} // Çyzygyň galyňlygy
            />
          )}
        </MapView>
      </View>

      {/* DÜWMELER BÖLÜMI */}
      <View style={styles.actionSection}>
        {/* Ýol Ýazgysyny Başlat/Duruz Düwmesi */}
        <TouchableOpacity 
          style={[styles.button, {backgroundColor: isTracking ? '#1d3557' : '#e63946'}]} 
          onPress={toggleTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? "⏹️ ÝAZGYNY DURUZ" : "🚶 ÝOL ÝAZGYSYNY BAŞLAT"}
          </Text>
        </TouchableOpacity>

        {/* SMS Düwmesi */}
        <TouchableOpacity style={[styles.button, {backgroundColor: '#457b9d'}]} onPress={shareLocation}>
          <Text style={styles.buttonText}>📲 ÝERIMI SMS UGRAT</Text>
        </TouchableOpacity>

        {/* Offline KMZ Düwmesi */}
        <TouchableOpacity style={[styles.button, {backgroundColor: '#2a9d8f'}]} onPress={loadOfflineKMZ}>
          <Text style={styles.buttonText}>🗺️ OFFLINE KMZ ÝÜKLE</Text>
        </TouchableOpacity>

        {/* Häzirki Ýagdaýy Görkezýän Tekst */}
        <Text style={styles.statusText}>Ýagdaý: {status}</Text>
      </View>
    </ScrollView>
  );
}

// --- REŇKLER WE STIL (CSS) ---
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', paddingVertical: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d' },
  mapContainer: { width: '100%', height: 350, borderRadius: 20, overflow: 'hidden', elevation: 5, marginBottom: 20 },
  map: { width: '100%', height: '100%' },
  actionSection: { width: '100%' },
  button: { padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 12, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  statusText: { textAlign: 'center', color: '#1d3557', marginTop: 10, fontWeight: '500' }
});
