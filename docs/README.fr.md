# Obsidian RCrypt

[English](../README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [Español](./README.es.md) | Français | [Deutsch](./README.de.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [עברית](./README.he.md)

---

Chiffrement de fichiers et de dossiers côté client pour [Obsidian](https://obsidian.md), entièrement compatible avec la norme officielle [Rclone Crypt](https://rclone.org/crypt/).

`obsidian-rcrypt` fonctionne 100% hors ligne en utilisant des primitives cryptographiques Web pures (`@noble/ciphers` et `@noble/hashes`). Il ne nécessite aucune installation locale du binaire `rclone` et fonctionne de manière transparente sur les plateformes de bureau et mobiles (Android, iOS, macOS, Windows, Linux).

---

## Fonctionnalités Clés

- **Interopérabilité 1:1 avec Rclone** : Chiffrez des fichiers dans Obsidian et déchiffrez-les ou montez-les directement en utilisant le Rclone CLI officiel (`rclone cat`, `rclone mount`, `rclone copy`).
- **Gestion de Profils de Chiffrement** : Configurez plusieurs profils de chiffrement avec des phrases de passe personnalisées, des sels, des modes de chiffrement de noms de fichier et des encodages.
- **Intégration Menu Contextuel & Palette** : Faites un clic droit sur des notes, des pièces jointes ou des dossiers entiers pour chiffrer ou déchiffrer. Les commandes se mettent à jour dynamiquement selon votre profil actif.
- **Modes de Nom de Fichier Flexibles** : Supporte les modes **Standard** (AES-256-EME), **Offusquer** (rotation de caractères Rclone) et **Désactivé** (noms de fichier en texte clair avec suffixe d'extension optionnel).
- **Chiffrement Imbriqué (Multi-couches)** : Chiffrez des fichiers déjà chiffrés de manière récursive en utilisant des profils différents ou identiques. Inclut une inspection intelligente des octets de charge pour vous notifier quand des couches de chiffrement internes subsistent lors du déchiffrement.
- **Sécurité RAM uniquement & i18n** : Maintient les identifiants strictement en mémoire volatile par défaut. Entièrement localisé en 11 langues avec support RTL automatique.

---

## Installation

### Option 1 : Boutique Officielle de Plugins Communautaires d'Obsidian
1. Ouvrez Obsidian **Paramètres** $\rightarrow$ **Plugins communautaires**.
2. Cliquez sur **Parcourir** et recherchez **RCrypt**.
3. Cliquez sur **Installer**, puis sur **Activer**.

### Option 2 : Via BRAT (Recommandé pour les Pré-versions / Tests Bêta)
1. Installez [BRAT](https://github.com/TfTHacker/obsidian-42-brat) dans Obsidian (**Paramètres** $\rightarrow$ **Plugins communautaires** $\rightarrow$ Recherchez **BRAT**).
2. Ouvrez les paramètres BRAT et cliquez sur **Ajouter un plugin Bêta**.
3. Entrez l'URL du dépôt : `https://github.com/emarpiee/obsidian-rcrypt`
4. Cliquez sur **Ajouter le Plugin** et activez **RCrypt** dans votre liste de Plugins communautaires.

### Option 3 : Installation Manuelle
1. Téléchargez `main.js`, `manifest.json` et `styles.css` (si disponible) depuis la dernière [version GitHub](https://github.com/emarpiee/obsidian-rcrypt/releases).
2. Créez le répertoire `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
3. Déplacez les fichiers téléchargés dans `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
4. Rechargez Obsidian et activez **RCrypt** sous **Paramètres** $\rightarrow$ **Plugins communautaires**.

### Option 4 : Compiler depuis les Sources
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## Guide d'Utilisation

### 1. Configuration du Profil
1. Ouvrez **Paramètres Obsidian** $\rightarrow$ **RCrypt**.
2. Créez ou sélectionnez un **Profil de Chiffrement**.
3. Définissez votre **Phrase de passe** et votre **Sel** (correspondant à `password` et `password2` dans `rclone.conf`).
4. Sélectionnez votre **Mode de Chiffrement de Nom de Fichier** (`Standard`, `Offusquer` ou `Désactivé`).
   - En mode **Standard** : sélectionnez également un **Encodage de Nom de Fichier** (`Base32` *(défaut)*, `Base64` ou `Base32768`).
   - En mode **Désactivé** : définissez votre **Suffixe de fichier chiffré** (défaut : `.bin`, correspondant au défaut `--crypt-suffix` de Rclone).

### 2. Chiffrement & Déchiffrement de Base
- **Menu Contextuel** : Faites un clic droit sur n'importe quel fichier, sélection de fichiers ou dossier dans l'Explorateur de Fichiers d'Obsidian et choisissez **Chiffrer** ou **Déchiffrer**.
- **Palette de Commandes** : Appuyez sur `Ctrl/Cmd + P` et recherchez des commandes **RCrypt** pour traiter des fichiers actifs ou des chemins spécifiques.

### 3. Flux de Travail de Chiffrement Imbriqué (Multi-couches)
- **Ajout de Couches Externes** : Faites un clic droit sur un fichier ou dossier déjà chiffré et sélectionnez **Chiffrer**. Choisissez un profil externe ou entrez des identifiants personnalisés.
- **Déverrouillage de la Couche Externe** : Faites un clic droit sur le fichier multi-couches et sélectionnez **Déchiffrer** en utilisant les identifiants du profil externe.
- **Détection de Couche Interne** : Lors du déchiffrement de la couche externe, `obsidian-rcrypt` inspecte les octets de sortie et vous alerte :
  > 🔓 *Couche externe déchiffrée pour 1 élément(s). Couche de chiffrement interne détectée !*
- **Déverrouillage de la Couche Interne** : Faites un clic droit sur le fichier restant et sélectionnez **Déchiffrer** en utilisant les identifiants du profil interne pour restaurer le texte clair.

> [!TIP]
> **Cas d'utilisation pour le Chiffrement Multi-couches** :
> - **Contrôle d'Accès par Niveaux** : Appliquez une phrase de passe interne privée pour les notes confidentielles, puis enveloppez-les avec un profil externe secondaire pour une sauvegarde ou une protection secondaire.
> - **Obfuscation de Métadonnées** : Enveloppez des fichiers chiffrés avec le mode `Désactivé` ou `Offusquer` dans un profil `Standard` externe pour brouiller la structure des répertoires et les extensions.

> [!CAUTION]
> Évitez d'ouvrir ou de modifier des fichiers de texte chiffré binaire brut dans des éditeurs de texte entre les passes, car la conversion de texte corrompt les structures d'en-tête binaire (`RCLONE\x00\x00`).

---

## Architecture Cryptographique

| Primitive / Composant | Implémentation | Norme Technique & Paramètres |
| :--- | :--- | :--- |
| **Dérivation de Clé** | `scrypt` | Dérive un tampon de clé de 80 octets (`N=16384`, `r=8`, `p=1`). Divisé en `dataKey` (octets 0–31), `nameKey` (octets 32–63) et `nameTweak` (octets 64–79). Par défaut utilise le sel fixe de 16 octets de Rclone si vide. |
| **Chiffrement de Charge** | `NaCl SecretBox` | Chiffrement de flux XSalsa20 avec des étiquettes MAC Poly1305 (16 octets par bloc de 64 KiB). Préfixé par un en-tête magique de 8 octets (`RCLONE\x00\x00`) et un nonce de base de 24 octets. |
| **Chiffrement de Nom de Fichier** | `EME (AES-256)` / `Offusquer` / `Désactivé` | **Standard** : Chiffrement à bloc large AES-256 EME avec rembourrage PKCS#7 utilisant `nameKey` & `nameTweak` (`Base32`, `Base64` ou `Base32768`). **Offusquer** : Chiffrement par rotation de caractères de Rclone. **Désactivé** : Texte clair avec suffixe d'extension optionnel. |
| **Chiffrement Multi-couches** | `Multi-Pass XSalsa20` | Enveloppement de charge récursif au niveau des octets correspondant au CLI Rclone. L'inspection intelligente des octets détecte les en-têtes `RCLONE\x00\x00` internes post-déchiffrement. |
| **Stockage de Clés sur Disque** | `AES-256-CTR Obscurcir` | AES-256 en mode CTR utilisant la clé fixe interne de 256 bits de Rclone et un IV aléatoire de 16 octets (Base64 URL-safe). |

---

## Modèle de Sécurité & Avertissements

### Stockage de Session RAM Uniquement (Recommandé)
- **Zéro Empreinte Disque** : Quand **Enregistrer le mot de passe sur le disque** est désactivé, les phrases de passe et sels résident strictement en mémoire volatile (RAM).
- **Purge Automatique** : Les identifiants en RAM sont automatiquement effacés à la fermeture, au redémarrage d'Obsidian ou au déchargement du plugin.
- **Purge Manuelle** : Exécutez **Effacer le mot de passe et le sel de la mémoire** depuis la Palette de Commandes (`Ctrl/Cmd + P`) pour effacer instantanément les identifiants.

### Stockage Obscurci sur Disque (`data.json`)
- L'activation de **Enregistrer le mot de passe sur le disque** chiffre les identifiants à l'aide de l'algorithme `rclone obscure` de Rclone.
- *Note de Sécurité* : Les mots de passe obscurcis sont protégés contre la consultation accidentelle, mais toute personne ayant accès local au disque à `data.json` et à la clé Rclone open-source peut les inverser. Utilisez le mode RAM uniquement pour une sécurité maximale.

> [!WARNING]
> **Avertissements Importants & Limitation de Responsabilité** :
> - **Perte de Données Irrécupérable** : Le chiffrement opère directement sur les fichiers du disque. Si les identifiants sont perdus ou mal configurés, les données **ne peuvent pas** être récupérées par quiconque. Maintenez toujours des sauvegardes non chiffrées des notes critiques.
> - **Ordre de Déchiffrement Multi-couches** : Le déchiffrement des fichiers imbriqués **doit** procéder dans l'ordre inverse exact (Externe $\rightarrow$ Interne). Perdre les identifiants de *n'importe quelle* couche intermédiaire verrouille définitivement tous les contenus internes.
> - **Synchronisation de Coffre Tiers** : Vérifiez si votre solution de synchronisation (Obsidian Sync, Git, iCloud) synchronise des fichiers source en texte clair ou des sorties chiffrées.
> - **Sans Garantie** : Fourni « tel quel » sous la Licence MIT sans garantie d'aucune sorte. Les développeurs n'acceptent aucune responsabilité pour la perte ou la corruption de données résultant de l'utilisation.

---

## Références & Ressources Officielles
- [Documentation Rclone Crypt](https://rclone.org/crypt/) — Vue d'ensemble de la configuration officielle et utilisation du CLI.
- [Spécification Technique de Rclone](https://rclone.org/crypt/#technical-specification) — Analyse approfondie de la dérivation de clés scrypt et de la disposition des blocs.
- [Commande Rclone Obscure](https://rclone.org/commands/rclone_obscure/) — Documentation pour l'outil CLI `rclone obscure`.
- [Code Source Rclone (`backend/crypt`)](https://github.com/rclone/rclone/tree/master/backend/crypt) — Dépôt officiel d'implémentation Go.
