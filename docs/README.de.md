# Obsidian RCrypt

[English](../README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [Español](./README.es.md) | [Français](./README.fr.md) | Deutsch | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [עברית](./README.he.md)

---

Client-seitige Datei- und Ordnerverschlüsselung für [Obsidian](https://obsidian.md), vollständig kompatibel mit dem offiziellen [Rclone Crypt](https://rclone.org/crypt/) Standard.

`obsidian-rcrypt` läuft zu 100 % offline mit reinen Web-Kryptographie-Primitiven (`@noble/ciphers` und `@noble/hashes`). Es erfordert keine lokale `rclone`-Binärinstallation und funktioniert nahtlos auf Desktop- und Mobilplattformen (Android, iOS, macOS, Windows, Linux).

> **Haftungsausschluss**: Dieses Plugin ist ein unabhängiges Open-Source-Projekt und steht in keiner Verbindung zum offiziellen [Rclone](https://rclone.org)-Projekt, wird von diesem weder verwaltet noch unterstützt.

---

## Hauptfunktionen

- **1:1 Rclone-Interoperabilität**: Dateien in Obsidian verschlüsseln und direkt mit dem offiziellen Rclone CLI entschlüsseln oder einbinden (`rclone cat`, `rclone mount`, `rclone copy`).
- **Crypt-Profilverwaltung**: Mehrere Verschlüsselungsprofile mit benutzerdefinierten Passphrasen, Salts, Dateinamen-Verschlüsselungsmodi und Kodierungen konfigurieren.
- **Kontextmenü- & Paletten-Integration**: Rechtsklick auf Notizen, Anhänge oder ganze Ordner zum Verschlüsseln oder Entschlüsseln. Befehle werden dynamisch basierend auf dem aktiven Profil aktualisiert.
- **Flexible Dateinamen-Modi**: Unterstützt die Modi **Standard** (AES-256-EME), **Obfuskieren** (Rclone-Zeichenrotation) und **Aus** (Klartext-Dateinamen mit optionalem Erweiterungssuffix).
- **Verschachtelte (Mehrschichtige) Verschlüsselung**: Bereits verschlüsselte Dateien rekursiv mit verschiedenen oder übereinstimmenden Profilen verschlüsseln. Intelligente Nutzlast-Byte-Inspektion benachrichtigt Sie, wenn beim Entschlüsseln innere Verschlüsselungsschichten verbleiben.
- **Nur-RAM-Sicherheit & i18n**: Hält Anmeldedaten standardmäßig streng im flüchtigen Speicher. Vollständig in 11 Sprachen lokalisiert mit automatischer RTL-Unterstützung.

---

## Installation

### Option 1: Offizieller Obsidian Community Plugin Store
1. Öffnen Sie Obsidian **Einstellungen** $\rightarrow$ **Community Plugins**.
2. Klicken Sie auf **Durchsuchen** und suchen Sie nach **RCrypt**.
3. Klicken Sie auf **Installieren**, dann auf **Aktivieren**.

### Option 2: Via BRAT (Empfohlen für Vorabversionen / Beta-Tests)
1. Installieren Sie [BRAT](https://github.com/TfTHacker/obsidian-42-brat) in Obsidian (**Einstellungen** $\rightarrow$ **Community Plugins** $\rightarrow$ Suchen Sie nach **BRAT**).
2. Öffnen Sie die BRAT-Einstellungen und klicken Sie auf **Beta-Plugin hinzufügen**.
3. Geben Sie die Repository-URL ein: `https://github.com/emarpiee/obsidian-rcrypt`
4. Klicken Sie auf **Plugin hinzufügen** und aktivieren Sie **RCrypt** in Ihrer Community-Plugins-Liste.

### Option 3: Manuelle Installation
1. Laden Sie `main.js`, `manifest.json` und `styles.css` (falls verfügbar) vom neuesten [GitHub Release](https://github.com/emarpiee/obsidian-rcrypt/releases) herunter.
2. Erstellen Sie das Verzeichnis `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
3. Verschieben Sie die heruntergeladenen Dateien nach `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
4. Laden Sie Obsidian neu und aktivieren Sie **RCrypt** unter **Einstellungen** $\rightarrow$ **Community Plugins**.

### Option 4: Aus dem Quellcode erstellen
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## Benutzerhandbuch

### 1. Profilkonfiguration
1. Öffnen Sie **Obsidian-Einstellungen** $\rightarrow$ **RCrypt**.
2. Erstellen oder wählen Sie ein **Crypt-Profil**.
3. Legen Sie Ihre **Passphrase** und Ihr **Salt** fest (entsprechend `password` und `password2` in `rclone.conf`).
4. Wählen Sie Ihren **Dateinamen-Verschlüsselungsmodus** (`Standard`, `Obfuskieren` oder `Aus`).
   - Im **Standard**-Modus: Wählen Sie auch eine **Dateinamen-Kodierung** (`Base32` *(Standard)*, `Base64` oder `Base32768`).
   - Im **Aus**-Modus: Legen Sie Ihr **Verschlüsseltes Dateisuffix** fest (Standard: `.bin`, entsprechend Rclones `--crypt-suffix`-Standard).

### 2. Grundlegendes Verschlüsseln & Entschlüsseln
- **Kontextmenü**: Rechtsklicken Sie auf eine beliebige Datei, Dateiauswahl oder Ordner im Obsidian-Datei-Explorer und wählen Sie **Verschlüsseln** oder **Entschlüsseln**.
- **Befehlspalette**: Drücken Sie `Ctrl/Cmd + P` und suchen Sie nach **RCrypt**-Befehlen, um aktive Dateien oder bestimmte Pfade zu verarbeiten.

### 3. Verschachtelte (Mehrschichtige) Verschlüsselung
- **Äußere Schichten hinzufügen**: Rechtsklicken Sie auf eine bereits verschlüsselte Datei oder einen Ordner und wählen Sie **Verschlüsseln**. Wählen Sie ein äußeres Profil oder geben Sie benutzerdefinierte Anmeldedaten ein.
- **Äußere Schicht entfernen**: Rechtsklicken Sie auf die mehrschichtige Datei und wählen Sie **Entschlüsseln** mit den Anmeldedaten des äußeren Profils.
- **Erkennung innerer Schichten**: Beim Entschlüsseln der äußeren Schicht prüft `obsidian-rcrypt` die Ausgabe-Bytes und warnt Sie:
  > 🔓 *Äußere Schicht entschlüsselt für 1 Element(e). Innere Verschlüsselungsschicht erkannt!*
- **Innere Schicht entfernen**: Rechtsklicken Sie auf die verbleibende Datei und wählen Sie **Entschlüsseln** mit den Anmeldedaten des inneren Profils, um den Klartext wiederherzustellen.

> [!TIP]
> **Anwendungsfälle für Mehrschichtige Verschlüsselung**:
> - **Gestufte Zugriffskontrolle**: Wenden Sie eine private innere Passphrase für vertrauliche Notizen an und umhüllen Sie diese mit einem sekundären äußeren Profil für Backup oder zusätzlichen Schutz.
> - **Metadaten-Obfuskierung**: Umhüllen Sie Dateien, die mit dem `Aus`- oder `Obfuskieren`-Modus verschlüsselt wurden, in einem äußeren `Standard`-Profil, um die Verzeichnisstruktur und Erweiterungen zu verschleiern.

> [!CAUTION]
> Vermeiden Sie es, rohe binäre Chiffretext-Dateien zwischen Durchläufen in Texteditoren zu öffnen oder zu ändern, da die Textkonvertierung die binären Header-Strukturen (`RCLONE\x00\x00`) beschädigt.

---

## Kryptographische Architektur

| Primitive / Komponente | Implementierung | Technischer Standard & Parameter |
| :--- | :--- | :--- |
| **Schlüsselableitung** | `scrypt` | Leitet einen 80-Byte-Schlüsselpuffer ab (`N=16384`, `r=8`, `p=1`). Aufgeteilt in `dataKey` (Bytes 0–31), `nameKey` (Bytes 32–63) und `nameTweak` (Bytes 64–79). Verwendet standardmäßig Rclones festen 16-Byte-Standard-Salt, wenn leer. |
| **Nutzlast-Chiffre** | `NaCl SecretBox` | XSalsa20-Stromchiffre mit Poly1305-MAC-Tags (16 Bytes pro 64 KiB-Block). Vorangestellt durch einen 8-Byte-Magic-Header (`RCLONE\x00\x00`) und einen 24-Byte-Basis-Nonce. |
| **Dateinamen-Verschlüsselung** | `EME (AES-256)` / `Obfuskieren` / `Aus` | **Standard**: AES-256 EME-Breitblock-Chiffre mit PKCS#7-Padding unter Verwendung von `nameKey` & `nameTweak` (`Base32`, `Base64` oder `Base32768`). **Obfuskieren**: Rclone-Zeichenrotations-Chiffre. **Aus**: Klartext mit optionalem Erweiterungssuffix. |
| **Mehrschichtige Verschlüsselung** | `Multi-Pass XSalsa20` | Rekursives bytebasiertes Nutzlast-Umhüllen, das dem Rclone CLI entspricht. Intelligente Byte-Inspektion erkennt innere `RCLONE\x00\x00`-Header nach dem Entschlüsseln. |
| **Festplatten-Anmeldedaten-Speicher** | `AES-256-CTR Obscure` | AES-256 im CTR-Modus mit Rclones internem festen 256-Bit-Schlüssel und zufälligem 16-Byte-IV (Base64 URL-sicher). |

---

## Sicherheitsmodell & Haftungsausschlüsse

### Nur-RAM-Sitzungsspeicher (Empfohlen)
- **Kein Festplatten-Fußabdruck**: Wenn **Passwort auf der Festplatte speichern** deaktiviert ist, befinden sich Passphrasen und Salts streng im flüchtigen Speicher (RAM).
- **Automatische Bereinigung**: Anmeldedaten im RAM werden automatisch gelöscht, wenn Obsidian geschlossen, neu gestartet oder das Plugin entladen wird.
- **Manuelle Bereinigung**: Führen Sie **Sitzungspasswort & Salt aus dem Speicher löschen** aus der Befehlspalette (`Ctrl/Cmd + P`) aus, um Anmeldedaten sofort zu löschen.

### Verschleierter Festplatten-Speicher (`data.json`)
- Die Aktivierung von **Passwort auf der Festplatte speichern** verschlüsselt Anmeldedaten mit Rclones `rclone obscure`-Algorithmus.
- *Sicherheitshinweis*: Verschleierte Passwörter sind gegen zufälliges Ansehen geschützt, aber jeder mit lokalem Festplattenzugang zu `data.json` und dem Open-Source-Rclone-Schlüssel kann sie umkehren. Verwenden Sie den Nur-RAM-Modus für maximale Sicherheit.

> [!WARNING]
> **Wichtige Warnungen & Haftungsbeschränkung**:
> - **Unwiederbringlicher Datenverlust**: Verschlüsselung operiert direkt auf Festplattendateien. Wenn Anmeldedaten verloren gehen oder falsch konfiguriert sind, können Daten von niemandem wiederhergestellt werden. Halten Sie immer unverschlüsselte Backups kritischer Notizen.
> - **Mehrschichtige Entschlüsselungsreihenfolge**: Die Entschlüsselung verschachtelter Dateien muss in genau umgekehrter Reihenfolge erfolgen (Außen $\rightarrow$ Innen). Das Verlieren von Anmeldedaten für *jede* Zwischenschicht sperrt alle inneren Inhalte dauerhaft.
> - **Drittanbieter-Vault-Synchronisierung**: Überprüfen Sie, ob Ihre Synchronisierungslösung (Obsidian Sync, Git, iCloud) Klartext-Quelldateien oder verschlüsselte Ausgaben synchronisiert.
> - **Keine Garantie**: Bereitgestellt "wie es ist" unter der MIT-Lizenz ohne jegliche Garantie. Entwickler übernehmen keine Haftung für Datenverlust oder -beschädigung durch die Verwendung.

---

## Offizielle Referenzen & Ressourcen
- [Rclone Crypt Dokumentation](https://rclone.org/crypt/) — Offizielle Konfigurationsübersicht und CLI-Verwendung.
- [Rclone Technische Spezifikation](https://rclone.org/crypt/#technical-specification) — Detaillierte Analyse der scrypt-Schlüsselableitung und des Block-Layouts.
- [Rclone Obscure Befehl](https://rclone.org/commands/rclone_obscure/) — Dokumentation für das `rclone obscure` CLI-Tool.
- [Rclone Quellcode (`backend/crypt`)](https://github.com/rclone/rclone/tree/master/backend/crypt) — Offizielles Go-Implementierungs-Repository.
