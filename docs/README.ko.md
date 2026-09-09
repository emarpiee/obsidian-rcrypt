# Obsidian RCrypt

[English](../README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [日本語](./README.ja.md) | 한국어 | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [עברית](./README.he.md)

---

[Obsidian](https://obsidian.md)을 위한 클라이언트 측 파일 및 폴더 암호화 플러그인으로, 공식 [Rclone Crypt](https://rclone.org/crypt/) 표준과 완전히 호환됩니다.

`obsidian-rcrypt`는 순수 Web 암호화 기본 요소(`@noble/ciphers` 및 `@noble/hashes`)를 사용하여 100% 오프라인으로 실행됩니다. 로컬 `rclone` 바이너리 설치가 필요 없으며 데스크탑 및 모바일 플랫폼(Android, iOS, macOS, Windows, Linux)에서 원활하게 작동합니다.

---

## 주요 기능

- **Rclone과의 1:1 상호 운용성**: Obsidian에서 파일을 암호화하고 공식 Rclone CLI(`rclone cat`, `rclone mount`, `rclone copy`)를 사용하여 직접 복호화하거나 마운트합니다.
- **Crypt 프로필 관리**: 사용자 지정 암호문, 솔트, 파일명 암호화 모드 및 인코딩으로 여러 암호화 프로필을 구성합니다.
- **컨텍스트 메뉴 및 팔레트 통합**: 노트, 첨부 파일 또는 전체 폴더를 우클릭하여 암호화 또는 복호화합니다. 명령은 활성 프로필에 따라 동적으로 업데이트됩니다.
- **유연한 파일명 모드**: **표준**(AES-256-EME), **혼동**(Rclone 문자 회전), **끄기**(선택적 확장자 접미사가 있는 일반 텍스트 파일명)의 세 가지 모드를 지원합니다.
- **중첩(다층) 암호화**: 다른 또는 일치하는 프로필을 사용하여 이미 암호화된 파일을 재귀적으로 암호화합니다. 복호화 시 내부 암호화 레이어가 남아 있을 때 스마트 페이로드 바이트 검사로 알림을 제공합니다.
- **RAM 전용 보안 및 i18n**: 기본적으로 자격 증명을 휘발성 메모리에만 유지합니다. 자동 RTL 지원과 함께 11개 언어로 완전히 현지화되었습니다.

---

## 설치

### 옵션 1: 공식 Obsidian 커뮤니티 플러그인 스토어
1. Obsidian **설정** $\rightarrow$ **커뮤니티 플러그인**을 엽니다.
2. **찾아보기**를 클릭하고 **RCrypt**를 검색합니다.
3. **설치**를 클릭한 다음 **활성화**를 클릭합니다.

### 옵션 2: BRAT 경유 (프리릴리스 / 베타 테스트에 권장)
1. Obsidian에 [BRAT](https://github.com/TfTHacker/obsidian-42-brat)를 설치합니다(**설정** $\rightarrow$ **커뮤니티 플러그인** $\rightarrow$ **BRAT** 검색).
2. BRAT 설정을 열고 **Beta 플러그인 추가**를 클릭합니다.
3. 저장소 URL을 입력합니다: `https://github.com/emarpiee/obsidian-rcrypt`
4. **플러그인 추가**를 클릭하고 커뮤니티 플러그인 목록에서 **RCrypt**를 활성화합니다.

### 옵션 3: 수동 설치
1. 최신 [GitHub Release](https://github.com/emarpiee/obsidian-rcrypt/releases)에서 `main.js`, `manifest.json` 및 `styles.css`(있는 경우)를 다운로드합니다.
2. 디렉토리 `<vault>/.obsidian/plugins/obsidian-rcrypt/`를 만듭니다.
3. 다운로드한 파일을 `<vault>/.obsidian/plugins/obsidian-rcrypt/`로 이동합니다.
4. Obsidian을 다시 로드하고 **설정** $\rightarrow$ **커뮤니티 플러그인**에서 **RCrypt**를 활성화합니다.

### 옵션 4: 소스에서 빌드
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## 사용 가이드

### 1. 프로필 구성
1. **Obsidian 설정** $\rightarrow$ **RCrypt**를 엽니다.
2. **Crypt 프로필**을 만들거나 선택합니다.
3. **암호문**과 **솔트**를 설정합니다(`rclone.conf`의 `password`와 `password2`에 해당).
4. **파일명 암호화 모드**(`표준`, `혼동` 또는 `끄기`)를 선택합니다.
   - **표준** 모드 사용 시: **파일명 인코딩**(`Base32` *(기본값)*, `Base64` 또는 `Base32768`)도 선택합니다.
   - **끄기** 모드 사용 시: **암호화된 파일 접미사**(기본값: `.bin`, Rclone의 `--crypt-suffix` 기본값과 일치)를 설정합니다.

### 2. 기본 암호화 및 복호화
- **컨텍스트 메뉴**: Obsidian 파일 탐색기에서 파일, 파일 선택 또는 폴더를 우클릭하고 **암호화** 또는 **복호화**를 선택합니다.
- **명령 팔레트**: `Ctrl/Cmd + P`를 누르고 **RCrypt** 명령을 검색하여 활성 파일 또는 특정 경로를 처리합니다.

### 3. 중첩(다층) 암호화 워크플로우
- **외부 레이어 추가**: 이미 암호화된 파일 또는 폴더를 우클릭하고 **암호화**를 선택합니다. 외부 프로필을 선택하거나 사용자 지정 자격 증명을 입력합니다.
- **외부 레이어 제거**: 다층 파일을 우클릭하고 외부 프로필의 자격 증명을 사용하여 **복호화**를 선택합니다.
- **내부 레이어 감지**: 외부 레이어를 복호화하면 `obsidian-rcrypt`가 출력 바이트를 검사하고 경고합니다:
  > 🔓 *외부 레이어 복호화 완료: 1개 항목. 내부 암호화 레이어가 감지되었습니다!*
- **내부 레이어 제거**: 남은 파일을 우클릭하고 내부 프로필의 자격 증명을 사용하여 **복호화**를 선택하여 일반 텍스트를 복원합니다.

> [!TIP]
> **다층 암호화 사용 사례**:
> - **계층적 접근 제어**: 기밀 노트에 개인 내부 암호문을 적용한 다음 백업 또는 보조 보호를 위해 보조 외부 프로필로 래핑합니다.
> - **메타데이터 난독화**: `끄기` 또는 `혼동` 모드로 암호화된 파일을 외부 `표준` 프로필 안에 래핑하여 디렉토리 구조와 확장자를 혼합합니다.

> [!CAUTION]
> 텍스트 변환이 바이너리 헤더 구조(`RCLONE\x00\x00`)를 손상시킬 수 있으므로, 패스 간에 텍스트 편집기에서 원시 바이너리 암호문 파일을 열거나 수정하지 마세요.

---

## 암호학적 아키텍처

| 기본 요소 / 구성 요소 | 구현 | 기술 표준 및 매개변수 |
| :--- | :--- | :--- |
| **키 파생** | `scrypt` | 80바이트 키 버퍼를 파생합니다(`N=16384`, `r=8`, `p=1`). `dataKey`(바이트 0–31), `nameKey`(바이트 32–63), `nameTweak`(바이트 64–79)으로 분할. 비어 있으면 Rclone의 고정 16바이트 기본 솔트를 사용합니다. |
| **페이로드 암호** | `NaCl SecretBox` | Poly1305 MAC 태그를 포함한 XSalsa20 스트림 암호(64 KiB 블록당 16바이트). 8바이트 매직 헤더(`RCLONE\x00\x00`)와 24바이트 베이스 nonce가 접두사로 붙습니다. |
| **파일명 암호화** | `EME (AES-256)` / `혼동` / `끄기` | **표준**: `nameKey` 및 `nameTweak`을 사용한 PKCS#7 패딩이 있는 AES-256 EME 와이드 블록 암호(`Base32`, `Base64` 또는 `Base32768`). **혼동**: Rclone 문자 회전 암호. **끄기**: 선택적 확장자 접미사가 있는 일반 텍스트. |
| **다층 암호화** | `멀티 패스 XSalsa20` | Rclone CLI와 일치하는 재귀적 바이트 수준 페이로드 래핑. 스마트 바이트 검사로 복호화 후 내부 `RCLONE\x00\x00` 헤더를 감지합니다. |
| **디스크 자격 증명 저장소** | `AES-256-CTR Obscure` | Rclone의 내부 고정 256비트 키와 랜덤 16바이트 IV(Base64 URL 안전)를 사용한 AES-256 CTR 모드. |

---

## 보안 모델 및 면책 조항

### RAM 전용 세션 저장소 (권장)
- **제로 디스크 풋프린트**: **디스크에 비밀번호 저장**이 비활성화된 경우 암호문과 솔트는 휘발성 메모리(RAM)에만 보관됩니다.
- **자동 제거**: Obsidian이 닫히거나 재시작되거나 플러그인이 언로드될 때 RAM의 자격 증명이 자동으로 삭제됩니다.
- **수동 제거**: 명령 팔레트(`Ctrl/Cmd + P`)에서 **메모리에서 세션 비밀번호 및 솔트 지우기**를 실행하여 자격 증명을 즉시 삭제합니다.

### 디스크 난독화 저장소 (`data.json`)
- **디스크에 비밀번호 저장**을 활성화하면 Rclone의 `rclone obscure` 알고리즘을 사용하여 자격 증명이 암호화됩니다.
- *보안 참고*: 난독화된 비밀번호는 우연한 열람으로부터 보호되지만, `data.json`에 로컬 디스크 액세스 권한이 있고 오픈 소스 Rclone 키를 아는 사람은 누구든지 되돌릴 수 있습니다. 최대 보안을 위해 RAM 전용 모드를 사용하세요.

> [!WARNING]
> **중요 경고 및 책임 제한**:
> - **복구 불가능한 데이터 손실**: 암호화는 디스크 파일에 직접 작동합니다. 자격 증명이 손실되거나 잘못 구성된 경우 누구도 데이터를 복구할 수 없습니다. 중요한 노트의 암호화되지 않은 백업을 항상 유지하세요.
> - **다층 복호화 순서**: 중첩된 파일의 복호화는 정확히 역순(외부 $\rightarrow$ 내부)으로 진행해야 합니다. 중간 레이어의 자격 증명을 잃으면 모든 내부 콘텐츠가 영구적으로 잠깁니다.
> - **타사 Vault 동기화**: 동기화 솔루션(Obsidian Sync, Git, iCloud)이 일반 텍스트 소스 파일을 동기화하는지 아니면 암호화된 출력을 동기화하는지 확인하세요.
> - **무보증**: MIT 라이선스에 따라 어떠한 종류의 보증도 없이 "있는 그대로" 제공됩니다. 개발자는 사용으로 인한 데이터 손실 또는 손상에 대해 어떠한 책임도 지지 않습니다.

---

## 공식 참조 및 리소스
- [Rclone Crypt 문서](https://rclone.org/crypt/) — 공식 구성 개요 및 CLI 사용법.
- [Rclone 기술 사양](https://rclone.org/crypt/#technical-specification) — scrypt 키 파생 및 블록 레이아웃에 대한 심층 분석.
- [Rclone Obscure 명령](https://rclone.org/commands/rclone_obscure/) — `rclone obscure` CLI 도구 설명서.
- [Rclone 소스 코드(`backend/crypt`)](https://github.com/rclone/rclone/tree/master/backend/crypt) — 공식 Go 구현 저장소.
