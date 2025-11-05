# 🔥 Configuración de Firebase - Finzi v3.3

Guía paso a paso para configurar Firebase y habilitar sincronización multi-dispositivo.

---

## 📋 Índice

- [¿Por qué Firebase?](#por-qué-firebase)
- [Prerequisitos](#prerequisitos)
- [Paso 1: Crear Proyecto](#paso-1-crear-proyecto-firebase)
- [Paso 2: Configurar Firestore](#paso-2-configurar-firestore)
- [Paso 3: Configurar Authentication](#paso-3-configurar-authentication)
- [Paso 4: Obtener Credenciales](#paso-4-obtener-credenciales)
- [Paso 5: Configurar Reglas de Seguridad](#paso-5-configurar-reglas-de-seguridad)
- [Costos y Límites](#costos-y-límites)

---

## 🎯 ¿Por qué Firebase?

### Ventajas para Finzi

- ✅ **Sincronización en tiempo real**: Cambios instantáneos entre dispositivos
- ✅ **Gratis para uso personal**: Hasta 1GB de datos y 50K lecturas/día
- ✅ **Offline-first**: Funciona sin internet, sincroniza después
- ✅ **Autenticación simple**: Google Sign-In con 2 clics
- ✅ **Seguridad**: Reglas de acceso a nivel de documento
- ✅ **Escalable**: Si creces, Firebase escala automáticamente

### Arquitectura

```
Antes (v3.2):
Tu celular → IndexedDB local
Celular esposa → IndexedDB local (independiente)

Después (v3.3):
Tu celular ←→ Firebase (nube) ←→ Celular esposa
      ↓                              ↓
   Cache local                  Cache local
   (offline)                    (offline)
```

---

## ✅ Prerequisitos

- Cuenta de Google (Gmail)
- 10 minutos de tiempo
- Acceso a internet

---

## 🚀 Paso 1: Crear Proyecto Firebase

### 1.1 Ir a Firebase Console

```
https://console.firebase.google.com/
```

### 1.2 Crear Nuevo Proyecto

1. Click en **"Agregar proyecto"** o **"Add project"**
2. Nombre del proyecto: `finzi-gastos-tc` (o el que prefieras)
3. Click **"Continuar"**

### 1.3 Google Analytics (Opcional)

- **Recomendación**: Desactivar (no es necesario para uso personal)
- Toggle OFF
- Click **"Crear proyecto"**

⏳ Espera ~30 segundos mientras Firebase crea el proyecto.

### 1.4 Confirmar

✅ Verás: "Tu nuevo proyecto está listo"
Click **"Continuar"**

---

## 🗄️ Paso 2: Configurar Firestore

### 2.1 Ir a Firestore Database

```
Panel izquierdo → Build → Firestore Database
```

### 2.2 Crear Base de Datos

1. Click **"Create database"**
2. Seleccionar ubicación:
   - **Recomendado para Chile**: `southamerica-east1` (São Paulo)
   - **Alternativa**: `us-central1` (Iowa)
3. Click **"Siguiente"**

### 2.3 Reglas de Seguridad (Temporal)

**Importante**: Por ahora, selecciona **"Modo de prueba"**

```
Permitir lecturas/escrituras durante 30 días
```

⚠️ **Nota**: Cambiaremos esto después por reglas seguras.

Click **"Crear"**

⏳ Espera ~30 segundos.

### 2.4 Verificar

✅ Verás una interfaz con:
- Pestaña "Datos"
- Botón "+ Iniciar colección"

---

## 🔐 Paso 3: Configurar Authentication

### 3.1 Ir a Authentication

```
Panel izquierdo → Build → Authentication
```

### 3.2 Empezar

Click **"Get started"** o **"Comenzar"**

### 3.3 Habilitar Google Sign-In

1. En la pestaña **"Sign-in method"**
2. Buscar **"Google"** en la lista
3. Click en **"Google"**
4. Toggle **ON** para habilitarlo
5. Seleccionar email de soporte: tu email
6. Click **"Guardar"**

### 3.4 Agregar Usuarios Autorizados (Opcional)

Por ahora no es necesario. Lo haremos con reglas de seguridad.

---

## 🔑 Paso 4: Obtener Credenciales

### 4.1 Registrar App Web

```
Página principal del proyecto → Ícono </>  (Web)
```

1. Click en el ícono **</>** ("Web")
2. Nickname de la app: `finzi-web`
3. ✅ Marcar **"También configurar Firebase Hosting"**
4. Click **"Registrar app"**

### 4.2 Copiar Configuración

Verás algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "finzi-gastos-tc.firebaseapp.com",
  projectId: "finzi-gastos-tc",
  storageBucket: "finzi-gastos-tc.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**🔥 IMPORTANTE**: Guarda esta configuración, la necesitaremos.

### 4.3 Copiar a Archivo

Crea un archivo temporal en tu computadora:

```
firebase-config.txt
```

Y pega la configuración ahí.

### 4.4 Continuar

Click **"Continuar a la consola"**

---

## 🛡️ Paso 5: Configurar Reglas de Seguridad

### 5.1 Reglas de Firestore

```
Firestore Database → Reglas (pestaña superior)
```

Reemplaza el contenido con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Función helper: usuario autenticado
    function isSignedIn() {
      return request.auth != null;
    }

    // Función helper: es el propietario del documento
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Función helper: email autorizado
    function isAuthorizedUser() {
      return request.auth.token.email in [
        'tu-email@gmail.com',        // ← CAMBIAR por tu email
        'email-esposa@gmail.com'     // ← CAMBIAR por email de tu esposa
      ];
    }

    // Colección de usuarios (metadata)
    match /users/{userId} {
      allow read, write: if isSignedIn() && isOwner(userId) && isAuthorizedUser();
    }

    // Colección de gastos compartidos
    match /gastos/{docId} {
      allow read, write: if isSignedIn() && isAuthorizedUser();
    }

    // Subcolecciones de gastos
    match /gastos/{gastoId}/{subcollection}/{docId} {
      allow read, write: if isSignedIn() && isAuthorizedUser();
    }
  }
}
```

**⚠️ MUY IMPORTANTE**:
- Reemplaza `'tu-email@gmail.com'` con tu email real
- Reemplaza `'email-esposa@gmail.com'` con el email de tu esposa

### 5.2 Publicar Reglas

Click **"Publicar"**

### 5.3 Reglas de Storage (Opcional)

Si planeas agregar imágenes después:

```
Storage → Reglas
```

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.email in [
          'tu-email@gmail.com',
          'email-esposa@gmail.com'
        ];
    }
  }
}
```

---

## 💰 Costos y Límites

### Plan Spark (Gratuito)

**Firestore**:
- ✅ 1 GB de almacenamiento
- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día
- ✅ 20,000 eliminaciones/día

**Authentication**:
- ✅ Ilimitados usuarios
- ✅ Google Sign-In gratis

**Hosting**:
- ✅ 10 GB de almacenamiento
- ✅ 360 MB/día de transferencia

### ¿Es suficiente para 2 personas?

**SÍ, de sobra.**

Ejemplo de uso mensual (2 personas):
- Lecturas: ~5,000/mes (~167/día) ✅
- Escrituras: ~1,000/mes (~33/día) ✅
- Almacenamiento: ~50 MB ✅

**Nunca llegarás a los límites** con uso personal.

### ¿Qué pasa si excedo?

1. Firebase te avisa por email
2. Puedes:
   - Esperar al día siguiente (cuota se resetea)
   - Upgrade a plan Blaze (pay-as-you-go)

**Plan Blaze** (si creces):
- $0.18 por 100,000 lecturas
- $0.18 por 100,000 escrituras
- $0.02 por GB/mes de almacenamiento

Para 2 personas: ~$0.00 - $0.10/mes

---

## 🔍 Verificar Configuración

### Checklist

- ✅ Proyecto Firebase creado
- ✅ Firestore Database habilitada
- ✅ Authentication con Google habilitada
- ✅ Credenciales (firebaseConfig) guardadas
- ✅ Reglas de seguridad configuradas

### Probar Authentication

```
Authentication → Users → Agregar usuario (opcional)
```

O espera a que la app lo haga automáticamente.

---

## 📝 Próximos Pasos

Ahora que Firebase está configurado:

1. ✅ Integrar Firebase SDK en Finzi
2. ✅ Crear capa de abstracción de datos
3. ✅ Implementar login con Google
4. ✅ Migrar de IndexedDB a Firestore
5. ✅ Probar sincronización multi-dispositivo

---

## 🆘 Troubleshooting

### Error: "Firebase project not found"

**Solución**: Verifica que copiaste bien el `projectId` del firebaseConfig.

### Error: "Permission denied"

**Solución**:
1. Verifica que agregaste tu email en las reglas
2. Verifica que estás logueado con ese email

### Error: "Billing required"

**Solución**: No debería pasar con uso personal. Si pasa, verifica que no estés en modo de producción con tráfico alto.

### Firestore no guarda datos

**Solución**:
1. Verifica reglas de seguridad
2. Abre Console → Network para ver errores
3. Verifica que el usuario esté autenticado

---

## 📚 Recursos

- [Documentación Firestore](https://firebase.google.com/docs/firestore)
- [Documentación Auth](https://firebase.google.com/docs/auth)
- [Reglas de Seguridad](https://firebase.google.com/docs/firestore/security/get-started)
- [Precios Firebase](https://firebase.google.com/pricing)

---

**¿Listo?** Una vez completados estos pasos, estarás preparado para integrar Firebase en Finzi.

---

*Documento creado: Noviembre 2025*
*Versión: 3.3*
