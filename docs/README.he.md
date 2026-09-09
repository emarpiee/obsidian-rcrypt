# Obsidian RCrypt

[English](../README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | עברית

---

הצפנת קבצים ותיקיות בצד-לקוח עבור [Obsidian](https://obsidian.md), תואמת לחלוטין לתקן הרשמי של [Rclone Crypt](https://rclone.org/crypt/).

`obsidian-rcrypt` פועל 100% אופליין באמצעות פרימיטיבי קריפטוגרפיה של ווב (`@noble/ciphers` ו-`@noble/hashes`). הוא אינו דורש התקנה מקומית של קובץ `rclone` ופועל ללא בעיות בכל הפלטפורמות (Android, iOS, macOS, Windows, Linux).

> **הבהרה / פטור מאחריות**: תוסף זה הוא פרויקט קוד פתוח עצמאי ואינו קשור, מתוחזק או מומלץ על ידי פרויקט [Rclone](https://rclone.org) הרשמי.

---

## תכונות עיקריות

- **תאימות 1:1 עם Rclone**: הצפן קבצים בתוך Obsidian ופענח או טען אותם ישירות באמצעות Rclone CLI (`rclone cat`, `rclone mount`, `rclone copy`).
- **ניהול פרופילי הצפנה**: הגדר פרופילי הצפנה מרובים עם סיסמאות מותאמות אישית, מלח (salt), מצבי הצפנת שמות קבצים וקידודים.
- **אינטגרציה עם תפריט הקשר ופלטת פקודות**: לחץ לחיצה ימנית על הערות, קבצים מצורפים או תיקיות שלמות כדי להצפין או לפענח. הפקודות מתעדכנות באופן דינמי בהתאם לפרופיל הפעיל.
- **מצבי הצפנת שמות קבצים גמישים**: תומך ב-**Standard** (AES-256-EME), ב-**Obfuscate** (סיבוב תווים של Rclone), וב-**Off** (טקסט גלוי עם סיומת מותאמת אישית).
- **הצפנה מקוננת (רב-שכבתית)**: הצפנת קבצים מוצפנים מחדש באופן רקורסיבי באמצעות פרופילים שונים או תואמים. כולל בדיקת ביתים חכמה להודעה כאשר נותרות שכבות הצפנה פנימיות בעת הפענוח.
- **אבטחת זיכרון RAM בלבד ולוקליזציה**: שומר אישורים אך ורק בזיכרון הנדיף כברירת מחדל. מתורגם במלואו ל-11 שפות עם תמיכה אוטומטית ב-RTL (מימין לשמאל).

---

## התקנה

### אפשרות 1: חנות התוספים הרשמית של קהילת Obsidian
1. פתח את Obsidian **הגדרות** $\rightarrow$ **תוספי קהילה**.
2. לחץ על **עיון** וחפש **RCrypt**.
3. לחץ על **התקן**, ולאחר מכן **הפעל**.

### אפשרות 2: דרך BRAT (מומלץ לבדיקות בטא)
1. התקן את [BRAT](https://github.com/TfTHacker/obsidian-42-brat) ב-Obsidian (**הגדרות** $\rightarrow$ **תוספי קהילה** $\rightarrow$ חפש **BRAT**).
2. פתח את הגדרות BRAT ולחץ על **Add Beta plugin**.
3. הזן את כתובת ה-URL של המאגר: `https://github.com/emarpiee/obsidian-rcrypt`

---

## מדריך שימוש

### 1. הגדרת פרופיל הצפנה
1. עבור אל **הגדרות** $\rightarrow$ **RCrypt**.
2. צור פרופיל חדש או ערוך את פרופיל ברירת המחדל.
3. הזן את **הסיסמה (Passphrase)** ו-**Salt** אופציונלי (שקול ל-`password2` ב-Rclone).
4. בחר **מצב הצפנת שמות קבצים**:
   - **Standard** (מומלץ): שמות קבצים מוצפנים ב-AES-256 EME.
   - **Obfuscate**: סיבוב תווים בסיסי.
   - **Off**: שמירת שמות קבצים בטקסט גלוי עם סיומת `.bin`.

### 2. הצפנה ופענוח
- **פלטת פקודות**: לחץ על `Ctrl+P` (או `Cmd+P` ב-macOS) והקלד `RCrypt: Encrypt File` או `RCrypt: Decrypt File`.
- **תפריט הקשר**: לחץ לחיצה ימנית על קובץ או תיקייה בסייר הקבצים של Obsidian ובחר **Encrypt** או **Decrypt**.

---

## תאימות ל-Rclone CLI

כדי לפענח או לטעון קבצי Obsidian RCrypt באמצעות CLI של `rclone`, הוסף את התצורה הבאה ל-`rclone.conf`:

```ini
[my-rcrypt-vault]
type = crypt
remote = /path/to/obsidian/vault
password = <your_obscured_passphrase>
password2 = <your_obscured_salt>
filename_encryption = standard
filename_encoding = base32
```

> [!IMPORTANT]
> הגדרות `filename_encryption` ו-`filename_encoding` ב-`rclone.conf` חייבות להתאים בדיוק להגדרות פרופיל ה-RCrypt שנעשה בהן שימוש במהלך ההצפנה.
