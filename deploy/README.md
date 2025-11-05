# 🚀 Analizador de Gastos TC v3.2 - Versión Deploy

Esta es la versión lista para **desplegar en línea** de la aplicación. Incluye:

- ✅ **PWA (Progressive Web App)**: Se puede instalar como app nativa
- ✅ **Funciona Offline**: Una vez cargada, funciona sin conexión
- ✅ **Optimizada**: Lista para producción

---

## 📦 Contenido

```
deploy/
├── index.html           # App principal (compilada)
├── reset-completo.html  # Utilidad de reset de base de datos
├── manifest.json        # Configuración PWA
├── service-worker.js    # Cache y funcionalidad offline
└── README.md           # Este archivo
```

---

## 🌐 Opciones de Deploy

### Opción 1: GitHub Pages (Recomendada - Gratis)

**Pasos**:

1. **Crear repositorio en GitHub**:
   - Ve a https://github.com/new
   - Nombre: `app-gastos-tc` (o el que prefieras)
   - Público o Privado (ambos funcionan)
   - No inicialices con README

2. **Subir archivos** (desde la carpeta `deploy`):
   ```bash
   cd deploy
   git init
   git add .
   git commit -m "Initial commit - App Gastos TC v3.2"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/app-gastos-tc.git
   git push -u origin main
   ```

3. **Activar GitHub Pages**:
   - Ve a Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `root`
   - Save

4. **¡Listo!**
   - URL: `https://TU-USUARIO.github.io/app-gastos-tc`
   - Tarda 2-3 minutos en estar disponible

---

### Opción 2: Netlify (Fácil - Gratis)

**Pasos**:

1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `deploy` completa
3. ¡Listo! Te da una URL automática tipo: `https://random-name-123.netlify.app`

**Extra**: Puedes cambiar el nombre del sitio desde la configuración.

---

### Opción 3: Vercel (Rápido - Gratis)

**Pasos**:

1. Ve a https://vercel.com/new
2. Import Git Repository o arrastra la carpeta
3. Deploy
4. URL: `https://tu-proyecto.vercel.app`

---

## 📱 Instalar como App

Una vez desplegada en cualquier plataforma:

### En Android:
1. Abre la URL en Chrome
2. Menú (3 puntos) → "Agregar a pantalla de inicio" o "Instalar app"
3. Aparecerá el ícono 💳 en tu pantalla

### En iOS (iPhone/iPad):
1. Abre la URL en Safari
2. Botón compartir → "Agregar a pantalla de inicio"
3. Aparecerá el ícono 💳 en tu pantalla

### En Desktop (Chrome/Edge):
1. Abre la URL
2. Ícono de instalación en la barra de direcciones (o menú → "Instalar App Gastos TC")
3. Se instalará como app de escritorio

---

## 🔧 Características PWA

### ✅ Funciona Offline
- Los archivos se cachean automáticamente
- Una vez cargada, funciona sin internet
- Los CDN (React, Tailwind, etc.) también se cachean

### ✅ Instalable
- Se puede instalar como app nativa en cualquier dispositivo
- No requiere App Store ni Google Play
- Ocupa poco espacio (~2-3 MB)

### ✅ Actualizaciones Automáticas
- Detecta nuevas versiones automáticamente
- Pregunta al usuario si quiere actualizar
- No pierde datos locales (IndexedDB)

---

## 💾 Datos y Privacidad

**IMPORTANTE**:
- Todos los datos se guardan **localmente en el dispositivo** (IndexedDB)
- **NO se envía nada a ningún servidor**
- Cada dispositivo tiene sus propios datos
- Si limpias el caché del navegador, pierdes los datos

**Para sincronizar entre dispositivos**:
- Por ahora no hay sincronización automática
- Puedes exportar/importar usando la funcionalidad de la app (si la implementas)

---

## 🆕 Actualizaciones

Para actualizar la app desplegada:

1. **Modifica la versión** en `service-worker.js`:
   ```javascript
   const CACHE_NAME = 'gastos-tc-v3.2.1'; // Cambiar número
   ```

2. **Recompila** (si modificaste archivos en `/src`):
   ```bash
   cd ..
   node scripts/build.js
   cp index.html deploy/index.html
   ```

3. **Sube los cambios**:
   - **GitHub Pages**: Git push
   - **Netlify/Vercel**: Arrastra de nuevo o conecta con Git

4. Los usuarios verán un mensaje: "¡Hay una nueva versión disponible!"

---

## 🐛 Solución de Problemas

### La app no carga:
- Verifica que todos los archivos estén en la raíz del deploy
- Revisa la consola del navegador (F12)

### No funciona offline:
- La primera vez necesita internet para cachear
- Verifica que el Service Worker esté registrado (consola)

### No se instala como app:
- Solo funciona en **HTTPS** (GitHub Pages, Netlify y Vercel lo tienen)
- `localhost` también funciona para pruebas

### Perdí mis datos:
- Los datos están en IndexedDB del navegador
- Si limpiaste el caché, se pierden
- **Recomendación**: Implementar export/import de datos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que estés usando HTTPS
3. Prueba en modo incógnito para descartar caché

---

## 🎉 ¡Listo!

Tu app está lista para usar en línea. Comparte la URL con quien quieras y todos podrán usar la aplicación sin instalar nada.

**URLs de ejemplo**:
- GitHub Pages: `https://tu-usuario.github.io/app-gastos-tc`
- Netlify: `https://app-gastos-tc.netlify.app`
- Vercel: `https://app-gastos-tc.vercel.app`

---

**Desarrollado con ❤️**
v3.2 Minimalista - 2025
