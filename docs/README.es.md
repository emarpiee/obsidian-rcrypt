# Obsidian RCrypt

[English](../README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | Español | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [עברית](./README.he.md)

---

Cifrado de archivos y carpetas del lado del cliente para [Obsidian](https://obsidian.md), totalmente compatible con el estándar oficial [Rclone Crypt](https://rclone.org/crypt/).

`obsidian-rcrypt` funciona 100% sin conexión usando primitivas criptográficas web puras (`@noble/ciphers` y `@noble/hashes`). No requiere instalación local del binario `rclone` y opera sin problemas en plataformas de escritorio y móvil (Android, iOS, macOS, Windows, Linux).

---

## Características Principales

- **Interoperabilidad 1:1 con Rclone**: Cifra archivos en Obsidian y descíbralos o móntelos directamente usando el Rclone CLI oficial (`rclone cat`, `rclone mount`, `rclone copy`).
- **Gestión de Perfiles de Cifrado**: Configura múltiples perfiles de cifrado con frases de contraseña personalizadas, sales, modos de cifrado de nombres de archivo y codificaciones.
- **Integración con Menú Contextual y Paleta**: Haz clic derecho en notas, adjuntos o carpetas enteras para cifrar o descifrar. Los comandos se actualizan dinámicamente según tu perfil activo.
- **Modos de Nombre de Archivo Flexibles**: Admite los modos **Estándar** (AES-256-EME), **Ofuscar** (rotación de caracteres de Rclone) y **Desactivado** (nombres de archivo en texto plano con sufijo de extensión opcional).
- **Cifrado Anidado (Multicapa)**: Cifra archivos ya cifrados de forma recursiva usando perfiles diferentes o coincidentes. Incluye inspección inteligente de bytes de carga para notificarte cuando quedan capas de cifrado internas al descifrar.
- **Seguridad Solo en RAM e i18n**: Mantiene las credenciales estrictamente en memoria volátil por defecto. Completamente localizado en 11 idiomas con soporte RTL automático.

---

## Instalación

### Opción 1: Tienda Oficial de Plugins de la Comunidad de Obsidian
1. Abre Obsidian **Ajustes** $\rightarrow$ **Plugins de la comunidad**.
2. Haz clic en **Explorar** y busca **RCrypt**.
3. Haz clic en **Instalar** y luego en **Activar**.

### Opción 2: Vía BRAT (Recomendado para Prelanzamientos / Pruebas Beta)
1. Instala [BRAT](https://github.com/TfTHacker/obsidian-42-brat) en Obsidian (**Ajustes** $\rightarrow$ **Plugins de la comunidad** $\rightarrow$ Busca **BRAT**).
2. Abre los ajustes de BRAT y haz clic en **Añadir plugin Beta**.
3. Ingresa la URL del repositorio: `https://github.com/emarpiee/obsidian-rcrypt`
4. Haz clic en **Añadir Plugin** y activa **RCrypt** en tu lista de Plugins de la comunidad.

### Opción 3: Instalación Manual
1. Descarga `main.js`, `manifest.json` y `styles.css` (si está disponible) desde la última [versión de GitHub](https://github.com/emarpiee/obsidian-rcrypt/releases).
2. Crea el directorio `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
3. Mueve los archivos descargados a `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
4. Recarga Obsidian y activa **RCrypt** en **Ajustes** $\rightarrow$ **Plugins de la comunidad**.

### Opción 4: Compilar desde el Código Fuente
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## Guía de Uso

### 1. Configuración de Perfil
1. Abre **Ajustes de Obsidian** $\rightarrow$ **RCrypt**.
2. Crea o selecciona un **Perfil de Cifrado**.
3. Establece tu **Frase de contraseña** y **Sal** (correspondientes a `password` y `password2` en `rclone.conf`).
4. Selecciona tu **Modo de Cifrado de Nombre de Archivo** (`Estándar`, `Ofuscar` o `Desactivado`).
   - Si usas el modo **Estándar**: también selecciona una **Codificación de Nombre de Archivo** (`Base32` *(predeterminada)*, `Base64` o `Base32768`).
   - Si usas el modo **Desactivado**: establece tu **Sufijo de archivo cifrado** (predeterminado: `.bin`, coincidiendo con el predeterminado `--crypt-suffix` de Rclone).

### 2. Cifrado y Descifrado Básico
- **Menú Contextual**: Haz clic derecho en cualquier archivo, selección de archivos o carpeta en el Explorador de Archivos de Obsidian y elige **Cifrar** o **Descifrar**.
- **Paleta de Comandos**: Presiona `Ctrl/Cmd + P` y busca comandos de **RCrypt** para procesar archivos activos o rutas específicas.

### 3. Flujo de Trabajo de Cifrado Anidado (Multicapa)
- **Añadir Capas Externas**: Haz clic derecho en un archivo o carpeta ya cifrado y selecciona **Cifrar**. Elige un perfil externo o ingresa credenciales personalizadas.
- **Desenvolver la Capa Externa**: Haz clic derecho en el archivo multicapa y selecciona **Descifrar** usando las credenciales del perfil externo.
- **Detección de Capa Interna**: Al descifrar la capa externa, `obsidian-rcrypt` inspecciona los bytes de salida y te alerta:
  > 🔓 *Capa exterior descifrada para 1 elemento(s). ¡Se detectó una capa de cifrado interior!*
- **Desenvolver la Capa Interna**: Haz clic derecho en el archivo restante y selecciona **Descifrar** usando las credenciales del perfil interno para restaurar el texto plano.

> [!TIP]
> **Casos de Uso para el Cifrado Multicapa**:
> - **Control de Acceso por Niveles**: Aplica una frase de contraseña interna privada para notas confidenciales, luego envuélvelas con un perfil externo secundario para respaldo o protección adicional.
> - **Ofuscación de Metadatos**: Envuelve archivos cifrados con modo `Desactivado` u `Ofuscar` dentro de un perfil `Estándar` externo para desordenar la estructura de directorios y las extensiones.

> [!CAUTION]
> Evita abrir o modificar archivos de texto cifrado binario sin procesar en editores de texto entre pasadas, ya que la conversión de texto corrompe las estructuras de encabezado binario (`RCLONE\x00\x00`).

---

## Arquitectura Criptográfica

| Primitiva / Componente | Implementación | Estándar Técnico y Parámetros |
| :--- | :--- | :--- |
| **Derivación de Clave** | `scrypt` | Deriva un buffer de clave de 80 bytes (`N=16384`, `r=8`, `p=1`). Dividido en `dataKey` (bytes 0–31), `nameKey` (bytes 32–63) y `nameTweak` (bytes 64–79). Por defecto usa la sal fija de 16 bytes de Rclone si está vacío. |
| **Cifrado de Carga** | `NaCl SecretBox` | Cifrado de flujo XSalsa20 con etiquetas MAC Poly1305 (16 bytes por bloque de 64 KiB). Prefijado por un encabezado mágico de 8 bytes (`RCLONE\x00\x00`) y un nonce base de 24 bytes. |
| **Cifrado de Nombre de Archivo** | `EME (AES-256)` / `Ofuscar` / `Desactivado` | **Estándar**: Cifrado de bloque ancho AES-256 EME con relleno PKCS#7 usando `nameKey` y `nameTweak` (`Base32`, `Base64` o `Base32768`). **Ofuscar**: Cifrado de rotación de caracteres de Rclone. **Desactivado**: Texto plano con sufijo de extensión opcional. |
| **Cifrado Multicapa** | `Multi-Pass XSalsa20` | Envolvimiento de carga a nivel de bytes recursivo que coincide con el CLI de Rclone. La inspección inteligente de bytes detecta encabezados `RCLONE\x00\x00` internos post-descifrado. |
| **Almacén de Credenciales en Disco** | `AES-256-CTR Oscurecer` | AES-256 en modo CTR usando la clave de 256 bits fija interna de Rclone e IV aleatorio de 16 bytes (Base64 URL-safe). |

---

## Modelo de Seguridad y Descargos de Responsabilidad

### Almacenamiento de Sesión Solo en RAM (Recomendado)
- **Cero Huella en Disco**: Cuando **Guardar contraseña en disco** está desactivado, las frases de contraseña y sales residen estrictamente en memoria volátil (RAM).
- **Purga Automática**: Las credenciales en RAM se limpian automáticamente cuando Obsidian se cierra, reinicia o descarga el plugin.
- **Purga Manual**: Ejecuta **Limpiar contraseña y sal de sesión de la memoria** desde la Paleta de Comandos (`Ctrl/Cmd + P`) para limpiar las credenciales al instante.

### Almacenamiento Oscurecido en Disco (`data.json`)
- Activar **Guardar contraseña en disco** cifra las credenciales usando el algoritmo `rclone obscure` de Rclone.
- *Nota de Seguridad*: Las contraseñas oscurecidas están protegidas contra visualización casual, pero cualquier persona con acceso local al disco a `data.json` y la clave Rclone de código abierto puede revertirlas. Usa el modo Solo RAM para máxima seguridad.

> [!WARNING]
> **Advertencias Importantes y Limitación de Responsabilidad**:
> - **Pérdida de Datos Irrecuperable**: El cifrado opera directamente en archivos del disco. Si se pierden o desconfigura las credenciales, los datos **no pueden** ser recuperados por nadie. Siempre mantén copias de seguridad sin cifrar de notas críticas.
> - **Orden de Descifrado Multicapa**: El descifrado de archivos anidados **debe** proceder en orden inverso exacto (Exterior $\rightarrow$ Interior). Perder las credenciales de *cualquier* capa intermedia bloquea permanentemente todos los contenidos internos.
> - **Sincronización de Vault de Terceros**: Verifica si tu solución de sincronización (Obsidian Sync, Git, iCloud) está sincronizando archivos fuente en texto plano o salidas cifradas.
> - **Sin Garantía**: Proporcionado "tal cual" bajo la Licencia MIT sin garantía de ningún tipo. Los desarrolladores no aceptan responsabilidad por pérdida o corrupción de datos resultante del uso.

---

## Referencias y Recursos Oficiales
- [Documentación de Rclone Crypt](https://rclone.org/crypt/) — Descripción general de configuración oficial y uso del CLI.
- [Especificación Técnica de Rclone](https://rclone.org/crypt/#technical-specification) — Análisis profundo de la derivación de claves scrypt y el diseño de bloques.
- [Comando Rclone Obscure](https://rclone.org/commands/rclone_obscure/) — Documentación para la herramienta CLI `rclone obscure`.
- [Código Fuente de Rclone (`backend/crypt`)](https://github.com/rclone/rclone/tree/master/backend/crypt) — Repositorio oficial de implementación en Go.
