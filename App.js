import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  StatusBar,
  Dimensions
} from 'react-native';

import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

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
        accuracy: Location.Accuracy.Highest,
      });

      const { latitude, longitude } = location.coords;
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();

      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýar");
      } else {
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
        accuracy: Location.Accuracy.Highest,
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
        accuracy: Location.Accuracy.Highest,
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
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Ýokarky gök dizaýn şekili */}
      <View style={styles.topShape} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>📍 ÝOLBELET</Text>
            <View style={styles.titleLine} />
            <Text style={styles.subtitle}>Seniň ynamdar kömekçiň</Text>
          </View>

          {/* Seniň goşmak islän täze tekstiň */}
          <View style={styles.aboutBox}>
            <Text style={styles.aboutText}>
              Bu programmany öz ýerleşýän ýeriňizi çalt SMS arkaly ugradyp bilmegiňiz we nätänyş ýerlerde azaşmazlygyňyz üçin döretdim.
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          {loading && <ActivityIndicator size="large" color="#1E3C72" style={{ marginBottom: 20 }} />}

          <View style={styles.buttonList}>
            <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={shareLocation}>
              <Text style={styles.btnText}>🚀 ÝERIMI UGRAT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={savePointA}>
              <Text style={styles.btnText}>💾 NOKADY SAKLA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, savedLocation ? styles.btnRed : styles.btnDisabled]}
              onPress={goToSavedPoint}
              disabled={!savedLocation}
            >
              <Text style={styles.btnText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Düzüji bölümi - Indi has dury we owadan */}
      <View style={styles.footerContainer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerLabel}>PROGRAMMANY DÜZÜJI</Text>
        <Text style={styles.footerName}>Meñli Aşyrowa Altyýewna</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  topShape: {
    position: 'absolute',
    top: 0,
    width: width,
    height: height * 0.4,
    backgroundColor: '#1E3C72',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: height * 0.08,
    paddingBottom: 140, 
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 30,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 12,
    alignItems: 'center',
  },
  header: {
    marginBottom: 15,
    alignItems: 'center'
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1E3C72',
    letterSpacing: 1
  },
  titleLine: {
    width: 50,
    height: 4,
    backgroundColor: '#1E3C72',
    borderRadius: 2,
    marginVertical: 8
  },
  subtitle: {
    fontSize: 13,
    color: '#546E7A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  aboutBox: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 15,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1E3C72'
  },
  aboutText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  statusBadge: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 25,
  },
  statusText: {
    color: '#1E3C72',
    fontWeight: '800',
    fontSize: 12
  },
  buttonList: {
    width: '100%'
  },
  btn: {
    height: 62,
    borderRadius: 16,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnBlue: { backgroundColor: '#2563EB' },
  btnGreen: { backgroundColor: '#10B981' },
  btnRed: { backgroundColor: '#EF4444' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  footerLine: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 10
  },
  footerLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 2
  },
  footerName: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '900',
    marginTop: 2
  }
});
