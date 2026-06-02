# BarberApp — Especificação Técnica Frontend

> Gerado em 2026-06-02. Atualizar sempre que arquitetura ou dependências mudarem.

---

## 1. Stack e Dependências Principais

| Tecnologia | Versão | Função |
|---|---|---|
| React Native | 0.79.5 | Framework mobile |
| Expo | ~53.0.20 | Toolchain e runtime |
| expo-router | ~5.1.4 | Navegação baseada em arquivos (file-based routing) |
| React | 19.0.0 | Biblioteca de UI |
| TypeScript | ~5.8.3 | Tipagem estática |
| @tanstack/react-query | ^5.100.14 | Cache e gerenciamento de requisições |
| @react-native-async-storage/async-storage | 2.1.2 | Persistência local (tokens JWT) |
| expo-notifications | ~0.31.5 | Push notifications via Expo |
| expo-secure-store | ~14.2.4 | Armazenamento seguro |
| expo-constants | ~17.1.7 | Acesso a configurações do app (projectId) |
| react-native-webview | 13.13.5 | Renderização de HTML/Markdown |
| react-native-safe-area-context | ^5.4.0 | Áreas seguras de tela |
| react-native-reanimated | ~3.17.4 | Animações nativas |
| zod | ^4.4.3 | Validação de formulários |
| react-native-keyboard-aware-scroll-view | ^0.9.5 | Scroll com teclado aberto |
| @expo/vector-icons | ^14.1.0 | Ícones (Ionicons) |

---

## 2. Estrutura de Pastas

```
barberApp/
├── app/                        # Rotas — cada arquivo = uma tela (expo-router)
│   ├── _layout.tsx             # Root layout: providers globais (Query, Auth, Notifications)
│   ├── (tabs)/                 # Grupo de tabs (navegação inferior)
│   │   ├── _layout.tsx         # Configuração das tabs + badges de pendentes
│   │   ├── index.tsx           # Redirect → /login
│   │   ├── login.tsx           # Tela de login (pública)
│   │   ├── register.tsx        # Cadastro de cliente ou barbeiro (pública)
│   │   ├── home.tsx            # Dashboard do barbeiro (autenticada)
│   │   ├── client-home.tsx     # Home do cliente com listagem de barbearias (autenticada)
│   │   ├── schedule.tsx        # Agenda completa do barbeiro (autenticada)
│   │   ├── my-appointments.tsx # Meus agendamentos — cliente (autenticada)
│   │   ├── coupons.tsx         # Cupons — placeholder (autenticada)
│   │   ├── profile.tsx         # Perfil + serviços do barbeiro (autenticada)
│   │   └── sobre.tsx           # Tela sobre — placeholder
│   ├── booking.tsx             # Fluxo de agendamento 3 etapas (autenticada)
│   ├── all-shops.tsx           # Lista completa de melhores barbearias (autenticada)
│   ├── notifications.tsx       # Central de notificações do cliente (autenticada)
│   ├── changePass.tsx          # Alterar senha — placeholder
│   └── spec.tsx                # Spec técnica — apenas __DEV__
│
├── components/                 # Componentes reutilizáveis
│   ├── PlaceholderImage.tsx    # Imagem placeholder com logo
│   ├── AccountType.jsx         # Seletor cliente/barbeiro
│   ├── Checkbox.jsx            # Checkbox customizado
│   ├── CnpjInput.jsx           # Input com máscara de CNPJ
│   ├── EmailInput.jsx          # Input de e-mail
│   ├── FullNameInput.jsx       # Input de nome completo
│   ├── PasswordInput.jsx       # Input de senha com toggle visibilidade
│   └── PasswordConfirm.jsx     # Confirmação de senha
│
├── context/                    # Contextos React globais
│   ├── AuthContext.tsx         # Usuário autenticado, login, logout, refresh
│   └── NotificationsContext.tsx# Lista de notificações recebidas + unreadCount
│
├── hooks/                      # Hooks customizados
│   ├── useNotifications.ts     # Registro de push token + listeners de notificação
│   ├── useColorScheme.ts       # Detecção de tema claro/escuro
│   └── useThemeColor.ts        # Utilitário de cor por tema
│
├── services/                   # Camada de acesso à API
│   ├── api.ts                  # Cliente HTTP com interceptor de 401/refresh
│   ├── authService.ts          # Login, register, logout, me, updateBarberProfile
│   ├── barberService.ts        # Listar barbearias, serviços, slots disponíveis
│   └── appointmentService.ts   # Criar, listar, atualizar status de agendamentos
│
├── constants/
│   └── Colors.ts               # Design tokens (objeto C com todas as cores do app)
│
└── docs/
    └── frontend-spec.md        # Este arquivo
```

---

## 3. Fluxo de Autenticação

### Login
1. `authService.login(email, password)` → `POST /auth/login` (sem auth)
2. Backend retorna `{ access_token, refresh_token, user }`
3. Ambos os tokens são salvos no `AsyncStorage` via `saveTokens()`
4. `authService.me()` é chamado para obter o perfil completo
5. `router.replace('/home')` (barbeiro) ou `router.replace('/client-home')` (cliente)

### Restauração de sessão
- No mount do `AuthProvider`, `restoreSession()` verifica se há `accessToken` no AsyncStorage
- Se houver, chama `authService.me()` para validar e popular `user`
- Se falhar (token inválido/expirado), chama `clearTokens()` e redireciona para login

### Refresh automático de token
- Implementado em `services/api.ts`
- Se qualquer request retorna 401:
  1. Chama `tryRefreshToken()` → `POST /auth/refresh` com `{ refresh_token }`
  2. Salva o novo `accessToken` (e `refreshToken` se vier na resposta)
  3. Reexecuta a request original com o novo token
  4. Se refresh também falhar: remove ambos os tokens do AsyncStorage e lança `"Sessão expirada"`

### Logout
1. `authService.logout(userId)` → `POST /auth/logout`
2. `clearTokens()` remove ambos tokens do AsyncStorage
3. `setUser(null)` + `router.replace('/login')`

---

## 4. Navegação

### Stack raiz (`app/_layout.tsx`)
Stack com `headerShown: false`. Todos os arquivos em `app/` são rotas do Stack.

### Tabs (`app/(tabs)/_layout.tsx`)
Visibilidade por tipo de conta (`isBarber`):

| Tab | Rota | Visível para |
|---|---|---|
| Home | `/home` | Barbeiro |
| Home | `/client-home` | Cliente |
| Cupons | `/coupons` | Ambos |
| Agenda | `/schedule` | Barbeiro |
| Agendamentos | `/my-appointments` | Cliente |
| Perfil | `/profile` | Ambos |

Telas sem tab (ocultas da navegação inferior):
`/index`, `/login`, `/register`, `/sobre`

### Telas do Stack (fora das tabs)

| Rota | Origem | Parâmetros |
|---|---|---|
| `/booking` | `client-home`, `all-shops` | `barberId: string`, `barberName: string` |
| `/all-shops` | `client-home` (botão "Ver todas") | — |
| `/notifications` | `client-home` (sino) | — |
| `/changePass` | `profile` → Configurações | — |
| `/spec` | URL direta (apenas `__DEV__`) | — |

### Badges na tab bar
- **Barbeiro / Agenda**: contagem de agendamentos com `status === 'PENDING'` via query `['appointments-all']`
- **Cliente / Agendamentos**: contagem de `status === 'PENDING'` via query `['appointments-mine']`
- Ambas as queries vivem em `(tabs)/_layout.tsx` com `refetchInterval` de 30s/15s

---

## 5. Integração com a API

### Configuração base
```
BASE_URL = http://localhost:3001/api
Content-Type: application/json
Authorization: Bearer <accessToken>  (quando useAuth = true)
```

### Interceptor de 401
Implementado em `services/api.ts`. Ver seção 3 (Refresh automático).

### Endpoints consumidos

#### Auth (`authService.ts`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | ✗ | Login com email/senha |
| POST | `/auth/register` | ✗ | Cadastro de usuário |
| POST | `/auth/logout` | ✓ | Invalida sessão no backend |
| GET | `/auth/me` | ✓ | Retorna usuário autenticado |
| PATCH | `/barbers/me` | ✓ | Atualiza perfil da barbearia |
| POST | `/auth/refresh` | ✗ | Renova accessToken com refreshToken |

#### Barbeiros (`barberService.ts`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/barbers` | ✗ | Lista todas as barbearias |
| GET | `/barbers/:id/services` | ✗ | Serviços de uma barbearia |
| GET | `/barbers/:id/available-slots?date=` | ✗ | Horários disponíveis |
| GET | `/services/mine` | ✓ | Serviços do barbeiro autenticado |
| POST | `/services` | ✓ | Cria serviço |
| PATCH | `/services/:id` | ✓ | Edita serviço |
| DELETE | `/services/:id` | ✓ | Remove serviço |

#### Agendamentos (`appointmentService.ts`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/appointments` | ✓ | Lista todos (barbeiro) com filtros opcionais |
| GET | `/appointments?date=hoje` | ✓ | Agendamentos de hoje (barbeiro) |
| GET | `/appointments/mine` | ✓ | Agendamentos do cliente autenticado |
| POST | `/appointments` | ✓ | Cria agendamento |
| PATCH | `/appointments/:id/status` | ✓ | Atualiza status |

#### Notificações
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/users/push-token` | ✓ | Registra Expo Push Token do dispositivo |

---

## 6. Notificações Push

### Registro do token (`hooks/useNotifications.ts`)
1. Hook `useNotifications(enabled: boolean)` é chamado em `AppStack` (dentro do `AuthProvider`)
2. `enabled = !!user` — só registra quando há usuário logado
3. Solicita permissão via `Notifications.requestPermissionsAsync()`
4. No Android, cria canal `default` com importância MAX
5. Obtém `ExpoPushToken` via `Notifications.getExpoPushTokenAsync({ projectId })`
   - `projectId` vem de `Constants.expoConfig?.extra?.eas?.projectId`
   - **Requer configuração em `app.json`** — ver seção 9
6. Envia token ao backend: `POST /users/push-token { TOKEN: token }`

### Recebimento de notificações
- `addNotificationReceivedListener` → chama `addNotification()` do `NotificationsContext`
  - Popula a lista de notificações e incrementa `unreadCount`
- `addNotificationResponseReceivedListener` → toque do usuário na notificação (navegação futura)

### Gatilhos no backend
- **Novo agendamento** (`POST /appointments`) → notifica o barbeiro
- **Status CONFIRMED ou CANCELLED** (`PATCH /appointments/:id/status`) → notifica o cliente

### Exibição
- Sino no header do `client-home` exibe badge com `unreadCount` (vermelho, máx `9+`)
- Ao abrir `/notifications`, `markAllRead()` é chamado automaticamente
- Cada notificação não-lida tem borda esquerda amarela (`C.primary`)

---

## 7. Gerenciamento de Estado

### Estado global (Contextos React)

| Contexto | Dados | Onde usado |
|---|---|---|
| `AuthContext` | `user`, `loading`, funções auth | Todas as telas autenticadas |
| `NotificationsContext` | `notifications[]`, `unreadCount` | `client-home` (badge), `notifications` (lista) |

### Cache de requisições (TanStack React Query)

Configuração global em `app/_layout.tsx`:
- `staleTime: 10_000` (10s) — dado considerado fresco
- `refetchOnWindowFocus: true`
- `retry: 1`

| Query Key | Dados | Onde | Intervalo |
|---|---|---|---|
| `['barbers']` | Lista de barbearias | `client-home`, `all-shops` | staleTime 5min |
| `['barber-services', barberId]` | Serviços de uma barbearia | `booking` | — |
| `['slots', barberId, date]` | Horários disponíveis | `booking` | — |
| `['appointments-today']` | Agendamentos de hoje | `home` (barbeiro) | 30s |
| `['appointments-all']` | Todos os agendamentos | `schedule`, `_layout` (badge) | 30s |
| `['appointments-mine']` | Agendamentos do cliente | `my-appointments`, `_layout` (badge) | 15s |
| `['services-mine']` | Serviços do barbeiro | `profile` | sob demanda |

### Invalidações após mutações
- `updateStatus` em `home` → invalida `['appointments-today']` + `['appointments-all']`
- `updateStatus` em `schedule` → invalida `['appointments-all']`
- `create appointment` em `booking` → invalida `['appointments-mine']`
- `create/update/delete service` → invalida `['services-mine']`

### Estado local
- Filtros de serviço, tab ativa, campo de busca → `useState` em `client-home`
- Formulários de edição de perfil e serviços → `useState` em `profile`
- Passo do fluxo de agendamento, serviços/data/hora selecionados → `useState` em `booking`
- Filtro de status → `useState` em `my-appointments`

---

## 8. Componentes Principais

### Reutilizáveis (`components/`)

| Componente | Descrição | Props principais |
|---|---|---|
| `PlaceholderImage` | View centralizada com logo da app como placeholder de imagem | `style`, `logoSize`, `children` |
| `EmailInput` | Input com label e validação de e-mail | `value`, `onChangeText` |
| `PasswordInput` | Input de senha com ícone de toggle de visibilidade | `value`, `onChangeText` |
| `PasswordConfirm` | Input para confirmação de senha | `value`, `onChangeText` |
| `FullNameInput` | Input de nome completo | `value`, `onChangeText` |
| `CnpjInput` | Input com máscara `00.000.000/0000-00` | `value`, `onChangeText` |
| `AccountType` | Seletor visual entre `CLIENT` e `BARBER` | `value`, `onChange` |
| `Checkbox` | Checkbox customizado (RememberMe) | — |

### Componentes de tela notáveis

| Componente | Arquivo | Detalhe |
|---|---|---|
| `PulsingBadge` | `my-appointments.tsx` | Badge animado (pulsante) por status de agendamento |
| `AppointmentCard` | `schedule.tsx` | Card de agendamento com ações de confirmar/concluir/cancelar |

---

## 9. Variáveis de Ambiente

| Variável | Onde configurar | Descrição |
|---|---|---|
| `BASE_URL` | `services/api.ts` (linha 3) | URL base da API. Trocar `localhost` pelo IP da máquina em dispositivo físico |
| `projectId` | `app.json` → `extra.eas.projectId` | ID do projeto Expo para push notifications. Obter via `npx eas init` ou em expo.dev |

Não há uso de `EXPO_PUBLIC_*` atualmente — a URL da API está hardcoded em `api.ts`.

> **Próximo passo recomendado:** extrair `BASE_URL` para `EXPO_PUBLIC_API_URL` em um arquivo `.env` usando `expo-constants` ou `process.env`.

---

## 10. Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- App **Expo Go** no dispositivo físico (iOS/Android) ou simulador configurado

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar a URL da API
# Editar services/api.ts linha 3:
# const BASE_URL = 'http://<SEU_IP_LOCAL>:3001/api';
# Ex: 'http://192.168.1.100:3001/api'
# ⚠️ localhost não funciona em dispositivo físico

# 3. (Para push notifications) Configurar projectId
# Editar app.json, dentro de "expo": { ... }:
# "extra": { "eas": { "projectId": "seu-uuid-aqui" } }
# Obter o UUID em: expo.dev → seu projeto → Project settings

# 4. Iniciar o servidor de desenvolvimento
npm run dev
# ou para plataformas específicas:
npm run android
npm run ios
```

### Acessar a spec em desenvolvimento
Navegue para a rota `/spec` no app enquanto `__DEV__ === true`.
A tela não aparece na tab bar — acesse diretamente via deep link ou botão oculto.
