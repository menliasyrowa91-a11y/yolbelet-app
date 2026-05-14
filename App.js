import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking
} from 'react-native';

import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const data = await AsyncStorage.getItem('savedLocation');
      if (data) {
        setSavedLocation(JSON.parse(data));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const storeLocation = async (coords) => {
    try {
      await AsyncStorage.setItem('savedLocation', JSON.stringify(coords));
    } catch (e) {
      console.log(e);
    }
  };

  // SMS ugratmak - TAKYK SENIŇ FORMATYŇDA
  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      let { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert("Rugsat ýok", "GPS rugsady gerek");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Öňünde https:// ýok, diňe seniň ulanýan formatyň
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();

      if (isAvailable) {
        // Bu ýerde takyk seniň isleýän SMS formatyň ugradylýar
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýar");
      } else {
        // SMS elýeterli däl bolsa, ulanmaga mejbur bolan ýagdaýynda brauzer linki
        const fallbackUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        await Linking.openURL(fallbackUrl);
        setStatus("Paýlaşyldy");
      }

    } catch (e) {
      Alert.alert("Hata", "GPS okalmady");
    } finally {
      setLoading(false);
    }
  };

  const savePointA = async () => {
    setLoading(true);
    setStatus("Nokat saklanylýar...");

    try {
      let { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert("Hata", "GPS rugsady gerek");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setSavedLocation(location.coords);
      await storeLocation(location.coords);

      Alert.alert("OK", "A nokat saklandy");
      setStatus("A nokat saklandy");

    } catch (e) {
      Alert.alert("Hata", "Saklap bolmady");
    } finally {
      setLoading(false);
    }
  };

  const goToSavedPoint = async () => {
    if (!savedLocation) {
      Alert.alert("Nokat ýok", "Ilki sakla");
      return;
    }

    setLoading(true);
    setStatus("Ýol açylýar...");

    try {
      let current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const url =
        `https://www.google.com/maps/dir/?api=1&origin=` +
        `${current.coords.latitude},${current.coords.longitude}` +
        `&destination=${savedLocation.latitude},${savedLocation.longitude}`;

      await Linking.openURL(url);
      setStatus("Karta açyldy");

    } catch (e) {
      Alert.alert("Hata", "Ýol tapylmady");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>📍 ÝOLBELET</Text>
        <Text style={styles.subtitle}>Seniň ynamdar kömekçiň</Text>

        <Text style={styles.creator}>
          Düzüji: Meñli Aşyrowa Altyýewna
        </Text>
      </View>

      <Text style={styles.status}>{status}</Text>

      {loading && <ActivityIndicator size="large" color="#e63946" />}

      <TouchableOpacity style={styles.btn} onPress={shareLocation}>
        <Text style={styles.btnText}>📍 ÝERIMI UGRAT</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#1d3557' }]} onPress={savePointA}>
        <Text style={styles.btnText}>💾 NOKADY SAKLA</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: savedLocation ? '#457b9d' : '#ccc' }]}
        onPress={goToSavedPoint}
        disabled={!savedLocation}
      >
        <Text style={styles.btnText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  header: {
    marginBottom: 25,
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1d3557'
  },
  subtitle: {
    fontSize: 14,
    color: '#457b9d',
    marginTop: 5
  },
  creator: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic'
  },
  status: {
    marginBottom: 20,
    color: '#457b9d'
  },
  btn: {
    backgroundColor: '#e63946',
    padding: 18,
    width: '100%',
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});
