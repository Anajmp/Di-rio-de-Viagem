import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import {CameraView, useCameraPermissions, useMicrophonePermissions, CameraType, CameraMode} from "expo-camera"
import {MaterialIcons} from "@expo/vector-icons";
// [ALTERADO] No Expo SDK 58 o createAssetAsync fica em "/legacy" (sem isso dá erro ao salvar)
import * as MediaLibrary from "expo-media-library/legacy"
// [ADICIONADO] Navegação para voltar para a Home levando a foto
import { useNavigation } from "@react-navigation/native";

type FlashMode = "off" | "on" | "auto";

export default function App() {
  // [ADICIONADO] Navegação da tela
  const navigation = useNavigation();

  // Permissões do dispositivo
  // A expo fornece hooks que retornar statusAtual e função para solicitar 

  const [cameraPermissios, requestCameraPermission] = useCameraPermissions();

  //Permissão de acesso ao microfone
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  //Permissão para acessar e salvar arquivos na geleria
  //writeOnly: true -> solicita apenas permissão de escrita (salvar).
  // [CORRIGIDO] granularPermissions: pede só foto e vídeo. Sem isso o Android também
  // pede permissão de ÁUDIO, que o Expo Go não tem, e salvar na galeria falha.
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true, granularPermissions: ["photo", "video"] });

  // facing -> controla se estamos usando a câmera traseira ou frontal
  const [facing, setFacing] = useState<CameraType>("back");

  // cameraMode -> alterna o modo entre foto ou gravar vídeo
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");

  // isRecording -> flag para saber se a gravação de vídeo está ativa no momento
  const [isRecording, setIsRecording] = useState(false);

  // isSaving -> evita que o usuário clqiue repetidas vezes no botão enquanto a mídia é salva
  const [isSalving, setIsSaving] = useState(false);

  // flashMode -> armazena o status ao flash
  const [ flashMode, setFlashMode] = useState<FlashMode>("off");

  // REFERENCIA DA Câmera 
  // useREf ->  cria a ligação direta com o componente CameraView e nos permite atraves de current chamar os métodos navitos takePictureAsync(), recordAsync() e stopRecording()
  //chamar os métodos navitos takePictureAsync(), recordAsync() e stopRecording()
  const cameraRef = useRef<CameraView>(null);
  //SOLICITAÇÃO INCIAL DAS PERMISSÕES
  useEffect(() => {
    (async () => {
      if(!cameraPermissios?.granted) await requestCameraPermission();
      if(!micPermission?.granted) await requestMicPermission();
      if(!mediaPermission?.granted) await requestMediaPermission();
    })();
  }, [])

  //Inverter entre câmera front e traseira
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const toggleFlashMode = () => {
    // [CORRIGIDO] era "setFlashMode = (...)", o que quebrava o app ao tocar no flash
    setFlashMode((current) => {
      if (current === "off") return "on";
      if (current === "on") return "auto";
      return "off";
    })
  }

  // [CORRIGIDO] tipo de retorno para o TypeScript aceitar no MaterialIcons
  const getFlashIcon = (): "flash-on" | "flash-auto" | "flash-off" => {
    if (flashMode === "on") return "flash-on"
    if (flashMode === "auto") return "flash-auto"
    return "flash-off"
  }

  // Muda o modo câmera(Foto ou Vídeo)
  const handleCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);

    if (isRecording) {
      setIsRecording(false);
      cameraRef.current?.stopRecording();
    }
  }

  const takeMedia = async () => {
    //Se a referência da câmera não estiver pronta ou se já estiver salvando algo, ignore o toque
    if(!cameraRef.current || isSalving) return;

    try {
      if ( cameraMode === "picture") {
        setIsSaving(true);

        //Tira a foto usando a câmera nativa e retorna o caminho temporário "uri";
        const foto = await cameraRef.current.takePictureAsync({quality: 1, skipProcessing: false})

        if(foto?.uri) {
          let hasPermission = mediaPermission?.granted;
          
          if(!hasPermission) {
            const permissionResult = await requestMediaPermission();
            hasPermission = permissionResult.granted;
          }

          if(!hasPermission) {
            Alert.alert("Aviso", "Permissão negada para salvar a foto na galeria.")

            setIsSaving(false);
            return;
          }

          await MediaLibrary.createAssetAsync(foto.uri);
          Alert.alert("Sucesso", "Foto salva na galeria");

          // [ADICIONADO] Volta para a Home (que já está na pilha) levando a foto.
          // pop: true -> volta para a Home existente em vez de abrir uma nova.
          navigation.navigate("Home", { photoUri: foto.uri }, { pop: true });
        }
        setIsSaving(false);
      } else {
  // Se já estiver gravando, o novo clique do usuário serve para PARAR a gravação
  if (isRecording) {
    cameraRef.current.stopRecording();
    return;
  }

  // Se não estiver gravando, INICIA a gravação
  setIsRecording(true);

  // A promise de recordAsync() se resolve quando stopRecording() for chamado.
  const video = await cameraRef.current.recordAsync();
  setIsRecording(false);

  if (video?.uri) {
    await MediaLibrary.saveToLibraryAsync(video.uri);
    Alert.alert("Sucesso", "Video salvo na galeria!");
  }
}
    } catch(error) {
      setIsSaving(false);
      setIsRecording(false);
      Alert.alert("Erro", "Não foi possível capturar ou salvar a mídia.")
    }
  }

  if (!cameraPermissios) {
    return <View style={styles.container}/>
  }

  if(!cameraPermissios.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>
          Precisamos de permissão para acessar a câmera
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>

    )
  }
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing={facing} flash={flashMode} mode={cameraMode}/>

      {/* Barra superior */}
      <View style={styles.overlayContainer}>
        <View style={styles.topContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlashMode}>
            <MaterialIcons name={getFlashIcon()} size={30} color={flashMode !== "off" ? "#FFD700" : "white"} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
            <MaterialIcons name="cameraswitch" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra inferior */}
    <View style={styles.bottomContainer}>
      <View style={styles.controlsContainer}>
        <View style={styles.modeSelector}>
          <TouchableOpacity onPress={() => handleCameraMode("picture")}>
            <Text style={[styles.modeText, cameraMode === "picture" && styles.modeTextSelected]}>Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleCameraMode("video")}>
            <Text style={[styles.modeText, cameraMode === "video" && styles.modeTextSelected]}>Video</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
              style={[
                styles.captureButton,
                isRecording && styles.captureButtonRecording,
              ]}
              onPress={takeMedia}
            >
              <View
                style={[
                  styles.captureInner,
                  isRecording && styles.captureInnerRecording,
                ]}
              />
            </TouchableOpacity>

      </View>
    </View>

    
        <StatusBar style="auto" />
  </View>
  );
}


// Cores do app (mesmas da Home)
const colors = {
  background: "#C7DFDA",
  card: "#FFFFFF",
  text: "#1E2B26",
  muted: "#7E928E",
  accent: "#E0542B",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: colors.background,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 43, 38, 0.45)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: 40,
  },
  controlsContainer: {
    alignItems: "center",
  },
  modeSelector: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 22,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modeText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  modeTextSelected: {
    color: colors.accent,
    fontWeight: "800",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 4,
    borderColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonRecording: {
    backgroundColor: "rgba(224, 84, 43, 0.35)",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
  },
  captureInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  permissionText: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" }),
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: "700",
  },
});
