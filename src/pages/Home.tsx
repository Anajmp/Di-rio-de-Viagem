import { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";

import type { RootStackParamList } from "../routes";

// Tipo simples para os dados do acelerômetro
interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

export default function Home() {
  // useNavigation() retorna a navegação da tela (navigate, goBack...)
  const navigation = useNavigation();

  // useRoute() dá acesso à foto que a Câmera manda de volta
  const route = useRoute<RouteProp<RootStackParamList, "Home">>();
  const photoUri = route.params?.photoUri;

  // Margens seguras do aparelho (barra de status)
  const insets = useSafeAreaInsets();

  // =====================================================================
  // ACELERÔMETRO (mesma estrutura do exemplo react-native-accelerometer)
  // =====================================================================

  // Estado para armazenar os valores capturados
  const [data, setData] = useState<AccelerometerData>({ x: 0, y: 0, z: 0 });

  // Estado para saber se o aparelho tem acelerômetro (no navegador/PC não tem)
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  // Referência para guardar a assinatura do sensor sem criar renderizações
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  const startListening = async () => {
    // Verifica se o sensor existe antes de ligar
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      setIsAvailable(false);
      return;
    }

    try {
      // Intervalo de leitura: 100 ms (10 leituras por segundo)
      Accelerometer.setUpdateInterval(100);

      // addListener liga o sensor e chama a função a cada nova leitura
      subscriptionRef.current = Accelerometer.addListener((sensorData) => {
        setData({
          x: sensorData.x,
          y: sensorData.y,
          z: sensorData.z,
        });
      });
    } catch (error) {
      setIsAvailable(false);
    }
  };

  // Inicia o sensor ao abrir a tela e remove a assinatura ao sair
  useEffect(() => {
    startListening();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  // =====================================================================
  // GPS (mesma estrutura do exemplo react-native-location / App1.tsx)
  // =====================================================================

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Função responsável por solicitar e verificar a permissão
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        const msg = "Permissão de localização foi negada pelo usuário.";
        setErrorMessage(msg);
        Alert.alert(msg);
        return false;
      }

      setErrorMessage(null);
      return true;
    } catch (error) {
      setErrorMessage("Falha ao solicitar permissão.");
      return false;
    }
  };

  // Obtém a localização atual pelo GPS
  const handleGetLocation = async () => {
    const granted = await requestPermission();
    if (!granted) return;

    try {
      setLoading(true);
      setErrorMessage(null);

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
    } catch (error) {
      setErrorMessage("Erro ao obter localização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
        {/* NOME DO APLICATIVO */}
        <Text style={styles.titleLight}>Diário de</Text>
        <Text style={styles.titleBold}>Viagem</Text>

        {/* CARD COM A IMAGEM (ou a foto capturada, quando existir) */}
        <View style={styles.card}>
          <Image
            source={photoUri ? { uri: photoUri } : require("../assets/imgHome.jpg")}
            style={styles.cardImage}
          />

          {/* Latitude e longitude */}
          <View style={styles.infoBox}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Latitude</Text>
              <Text style={styles.infoValue}>{location ? location.coords.latitude.toFixed(6) : "—"}</Text>
            </View>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Longitude</Text>
              <Text style={styles.infoValue}>{location ? location.coords.longitude.toFixed(6) : "—"}</Text>
            </View>
          </View>
        </View>

        {errorMessage && !loading && <Text style={styles.errorText}>{errorMessage}</Text>}

        {/* BOTÕES */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Camera")} activeOpacity={0.85}>
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Capturar fotografia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleGetLocation} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={colors.text} /> : <Ionicons name="locate" size={20} color={colors.text} />}
          <Text style={styles.secondaryButtonText}>Obter localização atual</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Localizacao")} activeOpacity={0.85}>
          <Ionicons name="map-outline" size={20} color={colors.text} />
          <Text style={styles.secondaryButtonText}>Localização</Text>
        </TouchableOpacity>

        {/* ACELERÔMETRO */}
        <Text style={styles.sectionTitle}>Acelerômetro</Text>

        {!isAvailable ? (
          <Text style={styles.mutedText}>Acelerômetro indisponível neste dispositivo.</Text>
        ) : (
          <View style={styles.axisRow}>
            <View style={styles.axisCard}>
              <Text style={styles.axisLabel}>X</Text>
              <Text style={styles.axisValue}>{data.x.toFixed(2)}</Text>
            </View>
            <View style={styles.axisCard}>
              <Text style={styles.axisLabel}>Y</Text>
              <Text style={styles.axisValue}>{data.y.toFixed(2)}</Text>
            </View>
            <View style={styles.axisCard}>
              <Text style={styles.axisLabel}>Z</Text>
              <Text style={styles.axisValue}>{data.z.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================================
// ESTILOS
// =====================================================================

const colors = {
  background: "#C7DFDA",
  card: "#FFFFFF",
  text: "#1E2B26",
  muted: "#7E928E",
  accent: "#E0542B",
};

// Fonte com serifa, parecida com a da referência
const serif = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });

const shadow = "0px 6px 18px rgba(30, 60, 52, 0.12)";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 22,
  },
  titleLight: {
    fontFamily: serif,
    fontSize: 32,
    color: colors.text,
  },
  titleBold: {
    fontFamily: serif,
    fontSize: 36,
    fontWeight: "700",
    color: colors.text,
  },
  card: {
    marginTop: 24,
    height: 360,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 7,
    boxShadow: "0px 10px 24px rgba(30, 60, 52, 0.18)",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  infoBox: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 22,
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    boxShadow: shadow,
  },
  infoLeft: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  infoValue: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: "#B23A1C",
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 22,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.card,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
  },
  mutedText: {
    fontSize: 14,
    color: colors.muted,
  },
  axisRow: {
    flexDirection: "row",
    gap: 10,
  },
  axisCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    boxShadow: shadow,
  },
  axisLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  axisValue: {
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
});
