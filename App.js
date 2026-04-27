import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Kml, PROVIDER_GOOGLE } from 'react-native-maps'; // TÄZE: Karta we KMZ goldawy
import { Asset } from 'expo-asset'; // TÄZE: KMZ faýlyny okamak üçin

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false); // Teksti açyp-ýapmak üçin state
  
  // TÄZE: Ýatda saklanjak nokat üçin state
  const [savedLocation, setSavedLocation] = useState(null);
  const [kmlUri, setKmlUri] = useState(null); // TÄZE: KMZ faýlynyň ýoly

  // MÖHÜM: Awtomatiki ýatda saklamak habary we KMZ taýýarlamak
  useEffect(() => {
    // TÄZE: KMZ faýlyny assets içinden okatmak
    async function prepareKml() {
      try {
        const asset = Asset.fromModule(require('./assets/Yolbelet-un-offline.kmz'));
        await asset.downloadAsync();
        setKmlUri(asset.localUri);
      } catch (e) {
        console.log("KMZ ýüklenip bilinmedi");
      }
    }
    prepareKml();

    Alert.alert(
      "YOLBELET: AWTOMATIKI ÝATDA SAKLAMAK 📱",
      "Seniň gezelenç edýän meýdanlaryň awtomatiki usulda telefonyň ýadyna (cache) ýazylýar.\n\n" +
      "MÖHÜM: Karta doly ýazylar ýaly, gezelenje başlamazdan ozal internet bar wagty barjak meýdanyňyza bir gezek göz aýlaň. Şondan soň interneti öçürseňiz hem 'Ýolbelet' ýoluňyzy tapar!",
      [{ text: "Düşünikli, dowam et!" }]
    );
  }, []);

  // BAR BOLAN FUNKSIÝA (Öňki formatyňyz dikeldildi)
  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("Rugsat berilmedi", "GPS rugsady bolmasa, Ýolbelet işlemäp biler.");
        setLoading(false);
        setStatus("Rugsat ýok");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
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

  // TÄZE: Nokady doňdurmak (A nokady)
  const savePointA = async () => {
    setLoading(true);
    setStatus("A nokady ýatda saklanylýar...");
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Hata", "GPS rugsady gerek!");
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setSavedLocation(location.coords);
      Alert.alert("Success", "A nokady (başlangyç) ýatda saklandy!");
      setStatus("A nokady saklandy");
    } catch (error) {
      Alert.alert("Hata", "Nokady saklap bolmady.");
    } finally {
      setLoading(false);
    }
  };

  // TÄZE: Ýatdaky nokada ýol görkezmek (Tehniki hatasy düzedildi)
  const goToSavedPoint = async () => {
    if (!savedLocation) {
      Alert.alert("Nokat ýok", "Ilki nokat ýatda saklaň!");
      return;
    }

    setLoading(true);
    setStatus("Ýol hasaplanýar...");
    try {
      let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      const url = `http://googleusercontent.com/maps.google.com/6{currentLocation.coords.latitude},${currentLocation.coords.longitude}&destination=${savedLocation.latitude},${savedLocation.longitude}&travelmode=walking`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        setStatus("Karta açyldy");
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert("Hata", "Ugur hasaplananda ýalňyşlyk boldy.");
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

      {/* TÄZE: KARTA WE KMZ BÖLÜMI (Seniň dizaýnyňda saklandy) */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={true}
          loadingEnabled={true}
        >
          {kmlUri && <Kml kmlAsset={kmlUri} />}
        </MapView>
      </View>

      {/* TÄZELENEN BÖLÜM: Basylanda açylýan tekst (Seniň tekstleriňe degilmedi) */}
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => setShowFullText(!showFullText)} 
        style={styles.aboutCard}
      >
        <Text style={styles.aboutHeader}>Programma barada:</Text>
        <Text style={styles.aboutText}>
          Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meñli Aşyrowa</Text>. 
          Bu ulgam siziň gerekli ýeriňizi tiz tapmagyňyz üçin,azaşmazlygyňyz üçin,azaşaýan ýagdaýyňyzda hem yzyňyza ýoluňyzy tapmak üçin niýetlenendir...
          {showFullText && (
            <Text>
              {"\n\n"}
              1. <Text style={{fontWeight: 'bold'}}>Ýeriňi ugrat:</Text> Adyňyzy ýa-da ýeriňizi aýdyp bilmedik wagtyňyz, duran nokadyňyzy SMS bilen ugradyň.{"\n\n"}
              2. <Text style={{fontWeight: 'bold'}}>Nokady ýatda sakla:</Text> Eger ýere beletligiňiz ýok bolsa, bilýän ýeriňizde nokady, ýagny duran ýeriňizi belleýärsiňiz. Bu soňra "Yzyna ýol görkez" düwmäniň kömegi arkaly yzyňyzy tapmaga kömek eder.
            </Text>
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
            <TouchableOpacity style={[styles.button, {marginBottom: 15}]} onPress={shareLocation}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>

            {!savedLocation ? (
              <TouchableOpacity 
                style={[styles.button, {backgroundColor: '#1d3557', marginBottom: 15}]} 
                onPress={savePointA}
              >
                <Text style={styles.buttonText}>💾 NOKADY ÝATDA SAKLA</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.button, {backgroundColor: '#e63946', marginBottom: 15}]} 
                onPress={() => setSavedLocation(null)}
              >
                <Text style={styles.buttonText}>🔄 TÄZE NOKAT BELLE</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
               style={[styles.button, {backgroundColor: savedLocation ? '#457b9d' : '#ccc'}]} 
               onPress={goToSavedPoint}
               disabled={!savedLocation}
            >
              <Text style={styles.buttonText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
            </TouchableOpacity>
          </>
        )}
        
        <Text style={styles.statusText}>{status}</Text>
        
        {savedLocation && (
          <Text style={{fontSize: 10, color: '#999', marginTop: 5}}>
            Ýatdaky nokat: {savedLocation.latitude.toFixed(4)}, {savedLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Mengli</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1d3557',
  },
  subTitle: {
    fontSize: 16,
    color: '#457b9d',
    marginTop: 5,
  },
  // KARTA ÜÇIN STIL
  mapWrapper: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 3,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  aboutHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d3557',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#e63946',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusText: {
    marginTop: 15,
    color: '#457b9d',
    fontSize: 14,
  },
  footerText: {
    marginTop: 40,
    color: '#a8dadc',
    fontSize: 12,
  },
});
