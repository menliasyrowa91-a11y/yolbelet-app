import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  
  // TÄZE: Ýatda saklanjak nokat üçin state
  const [savedLocation, setSavedLocation] = useState(null);

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
      // Siziň öňki goýan setiriňiz (dikeldildi):
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
      
      // Google Maps üçin halkara standart nawigasiýa salgysy:
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.coords.latitude},${currentLocation.coords.longitude}&destination=${savedLocation.latitude},${savedLocation.longitude}&travelmode=walking`;
      
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

      <View style={styles.aboutCard}>
        <Text style={styles.aboutHeader}>Programma barada:</Text>
        <Text style={styles.aboutText}>
          Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meñli Aşyrowa Altyýewna</Text>. 
          Bu programma ýoluňyzy ýitirmän, başlangyç nokada dolanmaga kömek eder.
        </Text>
      </View>

      <View style={styles.actionSection}>
        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <>
            <TouchableOpacity style={[styles.button, {marginBottom: 15}]} onPress={shareLocation}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, {backgroundColor: '#1d3557', marginBottom: 15}]} onPress={savePointA}>
              <Text style={styles.buttonText}>💾 NOKADY ÝATDA SAKLA</Text>
            </TouchableOpacity>

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
