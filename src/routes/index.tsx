// Stack Navigation (mesma estrutura do exemplo rotaStack do professor)
import { NavigationContainer } from "@react-navigation/native"; // Envolve toda a navegação da aplicação.
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // Cria o navegador de pilha.

// Páginas
import Home from "../pages/Home";
import Camera from "../pages/Camera";
import Localizacao from "../pages/Localizacao";

// TypeScript: lista das rotas do app e os parâmetros de cada uma.
// undefined = a tela não recebe nenhum parâmetro.
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Localizacao: undefined;
};

// Registra as rotas de forma global. Assim o useNavigation() funciona
// igual ao exemplo do professor (sem precisar tipar em cada página)
// e o TypeScript avisa se você digitar o nome de uma rota errado.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Cria o navegador de pilha e guarda na constante Stack.
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Routes() {
  return (
    <NavigationContainer>
      {/* initialRouteName define qual tela abre primeiro */}
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} options={{ title: "Diário de Viagem" }} />
        <Stack.Screen name="Camera" component={Camera} options={{ title: "Câmera" }} />
        <Stack.Screen name="Localizacao" component={Localizacao} options={{ title: "Localização" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
