import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native';
import * as Location from "expo-location"

export default function App() {
  //Location. LocationObject É a interface do TYPESCRIPT fornecida pela biblioteca expo-Location
  // Ela define o formato exato que o objeto (informações) chegae.
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  // Controlar o carregamento das operações
  const [loading, setLoading] = useState<boolean>(false);
  // Identificar qual ação especifica está carregando
  const [loadingAction, setLoadingAction] = useState<"cache" | "gps" | null>(null);
  // Guarda a origem do dado exibido na tela
  const [sourceType, setSourceType] = useState<"cache" | "gps" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Função responsável por solicitar e venificar permissões
  const requestPermission= async():Promise<boolean> => {
    try {
     //Solicite ao sistema a per issão de localização
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    // Verificando se a resposta foi diferente de GRANTED (concedida)
    if (status !== Location.PermissionStatus.GRANTED) {
    const msg = "Permissão de localização foi negada pelo usuário.";
    setErrorMessage(msg);
    Alert.alert(msg);
    // Retorna falso indicando que a permissão foi negada.
    return false;
    }

    setErrorMessage(null);
    return true;

  } catch (error) {
      const msg = "Falha ao solicitar permissão: " + (error instanceof Error ? error.message : String(error));
      setErrorMessage(msg);
      return false;
    }
  }

  //função para buscar a última localização salva no cache do dispositivo
  const handleGetQuickLocation = async () => {
    //chama a verificação de permissão e interrompe a execução caso seja negada
      const granted = await requestPermission();
      if (!granted) return;
    try {
      //Ativa o estado de carregamento
      setLoading(true);
      setLoadingAction("cache");
      setErrorMessage(null);

      // Consulta a última posição conhecida gravada no cache do SISTEMA OPERACIONAL
      const cachedLocation = await Location.getLastKnownPositionAsync({});

      //Verificar se resultado do cache é nulo ou indefinido
      if(!cachedLocation){
        setErrorMessage("Nenhuma localização em cache encontrada, utiliza CALIBRAR GPS para registrar posição")
        setLocation(null);
        setSourceType(null);
      } else{
        setLocation(cachedLocation);
        setSourceType("cache");
      }

    } catch (error) {
      const msg = "Erro ao consultar cache: " + (error instanceof Error ? error.message : String(error));
      setErrorMessage(msg);
      return false;
    }finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  // função para obter a localição atual diretamente via HADWARE GPS
  const handleGetPreciseLocation = async() => {
     const granted = await requestPermission();
      if (!granted) return;
  try {
    setLoading(true);
    setLoadingAction("gps");
    setErrorMessage(null);

    const preciseLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    })

    setLocation(preciseLocation);
    setSourceType("gps");

  } catch (error) {
    const msg = "Erro ao consultar cache: " + (error instanceof Error ? error.message : String(error));
    setErrorMessage(msg);
  } finally {
    setLoading(false);
    setLoadingAction(null);
  }}

  // Função para formatar a data
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

    return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Posicionamento</Text>
          <Text style={styles.subtitle}>
            Demonstração de localização em cache vs GPS de alta precisão
          </Text>
          <Image
            source={ require("../assets/imgHome.jpg")}
            style={styles.cardImage}
          />
        </View>
        

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.quickButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGetQuickLocation}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading && loadingAction === "cache" ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}> Obter Local Rápido</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.preciseButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGetPreciseLocation}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading && loadingAction === "gps" ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}> Calibrar GPS Preciso</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>
              {loadingAction === "cache"
                ? "Buscando posição no cache..."
                : "Calibrando satélites GPS com alta precisão..."}
            </Text>
          </View>
        )}

        {errorMessage && !loading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Aviso / Erro</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </View>
        )}

        {location && !loading && (
          <View style={styles.resultCard}>
            <View style={styles.badgeRow}>
              <Text style={styles.cardHeader}>Dados de Localização</Text>
              <View
                style={[
                  styles.badge,
                  sourceType === "cache" ? styles.cacheBadge : styles.gpsBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    sourceType === "cache"
                      ? styles.cacheBadgeText
                      : styles.gpsBadgeText,
                  ]}
                >
                  {sourceType === "cache" ? "⚡ Cache" : "🎯 GPS Preciso"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Latitude:</Text>
              <Text style={styles.value}>
                {location.coords.latitude.toFixed(6)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Longitude:</Text>
              <Text style={styles.value}>
                {location.coords.longitude.toFixed(6)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Precisão (Accuracy):</Text>
              <Text style={styles.value}>
                {location.coords.accuracy !== null &&
                location.coords.accuracy !== undefined
                  ? `± ${location.coords.accuracy.toFixed(2)} m`
                  : "Indisponível"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Timestamp:</Text>
              <View style={styles.timestampContainer}>
                <Text style={styles.value}>
                  {formatTimestamp(location.timestamp)}
                </Text>
                <Text style={styles.subValue}>({location.timestamp})</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: "#C7DFDA",
  card: "#FFFFFF",
  text: "#1E2B26",
  muted: "#7E928E",
  accent: "#E0542B",
  green: "#2F6F62",
};

const serif = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });

const shadow = "0px 6px 18px rgba(30, 60, 52, 0.12)";

const styles = StyleSheet.create({
  cardImage: {
    width: 300,
    height: 250,
    borderRadius: 22,
    borderWidth:5,
    borderColor: colors.green,
    marginTop: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 22,
    paddingTop: 28,
    minHeight: "100%",
  },
  header: {
    marginBottom: 24,
    alignItems:"center",
    justifyContent: "center",
    flexDirection: "column",
    width: "100%",
  },
  title: {
    fontFamily: serif,
    fontSize: 34,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: shadow,
  },
  quickButton: {
    backgroundColor: colors.green,
  },
  preciseButton: {
    backgroundColor: colors.green,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: "700",
  },
  loadingBox: {
    marginVertical: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
  },
  errorCard: {
    width: "100%",
    backgroundColor: "#FBE7E0",
    borderColor: "#F2B8A6",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B23A1C",
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: "#8A2E16",
    lineHeight: 18,
  },
  resultCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
    boxShadow: "0px 10px 24px rgba(30, 60, 52, 0.16)",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHeader: {
    fontFamily: serif,
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cacheBadge: {
    backgroundColor: "#DCEBE7",
  },
  cacheBadgeText: {
    color: colors.green,
  },
  gpsBadge: {
    backgroundColor: "#FBE3DA",
  },
  gpsBadgeText: {
    color: colors.accent,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EFED",
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "600",
  },
  value: {
    fontFamily: serif,
    fontSize: 16,
    color: colors.text,
    fontWeight: "700",
  },
  timestampContainer: {
    alignItems: "flex-end",
  },
  subValue: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  emptyState: {
    marginTop: 24,
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 300,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 22,
  },
  emptyStateIcon: {
    fontSize: 42,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
