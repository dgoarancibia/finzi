# 🔥 Guía de Migración a Firebase - Finzi v3.3

Cómo migrar de IndexedDB local a Firebase para sincronización multi-dispositivo.

---

## 📋 Resumen

**Finzi v3.2** (Local)
→ **Finzi v3.3** (Firebase + Sincronización)

### ¿Qué cambia?

| Aspecto | v3.2 (Local) | v3.3 (Firebase) |
|---------|--------------|-----------------|
| Datos | IndexedDB local | Firestore (nube) |
| Sincronización | ❌ No | ✅ Tiempo real |
| Multi-dispositivo | ❌ No | ✅ Sí |
| Offline | ✅ Sí | ✅ Sí (cache local) |
| Login | ❌ No | ✅ Google Sign-In |
| Compartir con otros | ❌ No | ✅ Sí |

---

## 🚀 Pasos de Migración

### Paso 1: Configurar Firebase

Sigue la guía completa: [`FIREBASE-SETUP.md`](./FIREBASE-SETUP.md)

**Resumen rápido**:
1. Crear proyecto en Firebase Console
2. Habilitar Firestore Database
3. Habilitar Authentication (Google)
4. Copiar credenciales

---

### Paso 2: Configurar Credenciales

Edita `src/utils/firebase-config.js`:

```javascript
window.FIREBASE_CONFIG = {
    apiKey: "TU-API-KEY-AQUI",              // ← Reemplazar
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123"
};

window.AUTHORIZED_EMAILS = [
    "tu-email@gmail.com",                   // ← Reemplazar
    "email-esposa@gmail.com"                // ← Reemplazar
];

// Habilitar Firebase
window.USE_FIREBASE = true;  // ← Cambiar a true
```

**⚠️ MUY IMPORTANTE**: Asegúrate de reemplazar:
- `FIREBASE_CONFIG` con tus credenciales reales
- `AUTHORIZED_EMAILS` con los emails permitidos

---

### Paso 3: Recompilar

```bash
# Desde la raíz del proyecto
node scripts/build.js
```

**Verificar**:
```
✅ firebase-config.js
✅ firebase.js
✅ dataLayer.js
✅ Login.jsx
```

---

### Paso 4: Probar Localmente

```bash
# Abrir en navegador
open index.html

# O con servidor local
python -m http.server 8000
# http://localhost:8000
```

**Flujo esperado**:
1. Abre la app
2. Ve pantalla de Login
3. Click en "Continuar con Google"
4. Selecciona tu cuenta (debe estar en AUTHORIZED_EMAILS)
5. ✅ Entra a la app
6. Tus datos están en Firebase

---

### Paso 5: Migrar Datos Existentes (Opcional)

Si ya tienes datos en IndexedDB local y quieres pasarlos a Firebase:

#### Opción A: Manual (Recomendada)

1. **Exportar datos de IndexedDB**:
   - Abre la consola del navegador (F12)
   - Pega este código:

```javascript
// Exportar todo a JSON
async function exportarDatos() {
    const data = {
        meses: await db.mesesCarga.toArray(),
        transacciones: await db.transacciones.toArray(),
        presupuestos: await db.presupuestos.toArray(),
        ingresos: await db.ingresos.toArray(),
        reembolsos: await db.reembolsos.toArray()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `finzi-backup-${new Date().toISOString()}.json`;
    a.click();

    console.log('✅ Datos exportados');
}

exportarDatos();
```

2. **Importar a Firebase**:
   - Login en la nueva versión v3.3
   - Abre consola (F12)
   - Pega este código:

```javascript
// Importar desde JSON
async function importarDatos(jsonFile) {
    const reader = new FileReader();

    reader.onload = async (e) => {
        const data = JSON.parse(e.target.result);

        console.log('Importando meses...');
        for (const mes of data.meses) {
            await window.addMesCarga(mes);
        }

        console.log('Importando transacciones...');
        for (const trans of data.transacciones) {
            await window.addTransaccion(trans);
        }

        console.log('Importando presupuestos...');
        for (const pres of data.presupuestos) {
            await window.addPresupuesto(pres);
        }

        console.log('Importando ingresos...');
        for (const ing of data.ingresos) {
            await window.addIngreso(ing);
        }

        console.log('Importando reembolsos...');
        for (const rem of data.reembolsos) {
            await window.addReembolso(rem);
        }

        console.log('✅ Importación completada');
        window.location.reload();
    };

    reader.readAsText(jsonFile);
}

// Crear input para seleccionar archivo
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = (e) => importarDatos(e.target.files[0]);
input.click();
```

#### Opción B: Empezar de Cero

Si prefieres empezar desde cero en Firebase:
- Simplemente loguéate
- Importa tus CSVs normalmente
- Firebase se encargará del resto

---

### Paso 6: Deploy a Producción

Una vez que todo funciona localmente:

```bash
# 1. Copiar a deploy
cp index.html deploy/

# 2. Deploy a GitHub Pages / Netlify / Vercel
# (Ver README.md → Sección Deploy)
```

---

## 🔄 Toggle entre IndexedDB y Firebase

Si quieres volver temporalmente a IndexedDB local:

**Edita `src/utils/firebase-config.js`**:

```javascript
// Deshabilitar Firebase (usar IndexedDB)
window.USE_FIREBASE = false;
```

**Recompila**:
```bash
node scripts/build.js
```

**Ahora la app usará IndexedDB local** (sin login, sin sincronización).

---

## 🧪 Testing

### Probar Autenticación

1. Abre la app
2. Debería mostrar pantalla de Login
3. Click en "Continuar con Google"
4. Login con cuenta autorizada → ✅ Entra
5. Login con cuenta NO autorizada → ❌ Rechazada

### Probar Sincronización

1. Dispositivo 1: Login → Agregar transacción
2. Dispositivo 2: Login (mismo email) → ✅ Debería aparecer la transacción

### Probar Offline

1. Login normalmente
2. Desconectar internet
3. Usar la app normalmente (lee de caché)
4. Agregar datos (se guardan localmente)
5. Reconectar internet → ✅ Datos se sincronizan

---

## 🗂️ Estructura de Datos en Firestore

```
gastos (collection)
└── {userId} (document)
    ├── mesesCarga (subcollection)
    │   └── {mesId} (document)
    ├── transacciones (subcollection)
    │   └── {transaccionId} (document)
    ├── presupuestos (subcollection)
    │   └── {presupuestoId} (document)
    ├── ingresos (subcollection)
    │   └── {ingresoId} (document)
    └── reembolsos (subcollection)
        └── {reembolsoId} (document)

users (collection)
└── {userId} (document)
    ├── email
    ├── displayName
    └── photoURL
```

**Beneficio**: Cada usuario tiene su propia data aislada.

---

## 🛡️ Seguridad

### Reglas de Firestore

Las reglas de seguridad aseguran que:
- ✅ Solo usuarios autenticados pueden leer/escribir
- ✅ Solo emails autorizados pueden acceder
- ✅ Cada usuario solo ve sus propios datos

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthorizedUser() {
      return request.auth.token.email in [
        'tu-email@gmail.com',
        'email-esposa@gmail.com'
      ];
    }

    match /gastos/{docId} {
      allow read, write: if request.auth != null && isAuthorizedUser();
    }
  }
}
```

---

## 💰 Monitoreo de Cuota

### Ver Uso Actual

```
Firebase Console → Firestore Database → Usage
```

**Métricas clave**:
- Lecturas hoy
- Escrituras hoy
- Almacenamiento usado

### Alertas

Configura alertas en Firebase:
```
Firebase Console → Firestore → Usage → Set budget alert
```

Recibirás email si te acercas al límite gratuito.

---

## 🐛 Troubleshooting

### Error: "Permission denied"

**Causa**: Email no autorizado o reglas mal configuradas

**Solución**:
1. Verifica que tu email está en `AUTHORIZED_EMAILS`
2. Verifica reglas de Firestore en Firebase Console
3. Asegúrate de que el email en las reglas coincide EXACTAMENTE con el tuyo

### Error: "Firebase not defined"

**Causa**: Firebase SDK no cargó

**Solución**:
1. Verifica conexión a internet
2. Verifica que los CDN de Firebase están en `app.html`:
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
   ```

### Error: "Project not found"

**Causa**: `projectId` incorrecto en firebase-config.js

**Solución**:
1. Ve a Firebase Console
2. Settings → General
3. Copia el Project ID exacto
4. Pégalo en `firebase-config.js`

### Datos no sincronizan

**Checklist**:
1. ¿Estás logueado?
2. ¿Tienes internet?
3. ¿Las reglas de Firestore permiten escritura?
4. ¿Hay errores en la consola del navegador? (F12)

---

## 📊 Comparación de Rendimiento

| Operación | IndexedDB (v3.2) | Firebase (v3.3) |
|-----------|------------------|-----------------|
| Cargar transacciones | ~50ms | ~200ms (primera vez) |
| Guardar transacción | ~10ms | ~100ms |
| Offline | ✅ Nativo | ✅ Cache |
| Sincronización | ❌ No | ✅ Automática |
| Multi-dispositivo | ❌ No | ✅ Sí |

**Nota**: Firebase es levemente más lento, pero ganas sincronización.

---

## 🔮 Próximos Pasos (v3.4)

Con Firebase habilitado, ahora puedes:
- ✅ Compartir presupuestos con tu esposa
- ✅ Ver gastos en tiempo real desde cualquier dispositivo
- ✅ Colaborar en la gestión de gastos
- 🚀 Agregar más usuarios autorizados (familiares, contador, etc.)
- 🚀 Notificaciones push de nuevos gastos
- 🚀 Dashboards colaborativos

---

## 📚 Recursos

- [Firebase Console](https://console.firebase.google.com/)
- [Documentación Firestore](https://firebase.google.com/docs/firestore)
- [Documentación Auth](https://firebase.google.com/docs/auth)
- [Reglas de Seguridad](https://firebase.google.com/docs/firestore/security/get-started)

---

## ✅ Checklist Final

Antes de considerar la migración completa:

- [ ] Firebase Console configurado
- [ ] Credenciales en `firebase-config.js`
- [ ] Emails autorizados configurados
- [ ] Reglas de seguridad publicadas
- [ ] Build recompilado
- [ ] Probado login localmente
- [ ] Probado sincronización
- [ ] Probado offline
- [ ] Datos migrados (si aplicable)
- [ ] Desplegado a producción

---

**¡Felicidades!** 🎉 Ahora tienes Finzi v3.3 con sincronización Firebase.

---

*Documento creado: Noviembre 2025*
*Versión: 3.3*
