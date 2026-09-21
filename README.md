# Hipsbook App

แอปมือถือ (iOS / Android) สำหรับแพลตฟอร์มคอร์สเรียนออนไลน์ Hipsbook — ดูคอร์ส เรียนวิดีโอ ไลฟ์สด รีวิว และจัดการโปรไฟล์ผู้ใช้

สร้างด้วย [React Native](https://reactnative.dev) 0.82 + TypeScript

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | React Native 0.82.1, React 19.1.1, TypeScript 5.8 |
| Navigation | React Navigation 7 (native-stack, bottom-tabs) |
| State / Data | Zustand, TanStack Query 5, Axios |
| Forms | React Hook Form + Yup |
| UI | React Native Paper, Reanimated 4, Gesture Handler, Skia, Bottom Sheet |
| Media | react-native-video, NodeMediaClient (RTMP), WebRTC (WHIP), HLS |
| Auth | Google Sign-In, Apple Authentication, LINE Login, Twitter (App Auth) |
| Payments | react-native-iap (In-App Purchase) |

---

## ความต้องการของระบบ

- **Node.js** >= 20 (แนะนำ 22.x)
- **JDK** 17 และ Android SDK (สำหรับ Android)
- **Xcode** + CocoaPods (สำหรับ iOS, ต้องใช้ macOS)

ตรวจสอบสภาพแวดล้อมได้ด้วย

```sh
npx react-native doctor
```

---

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```sh
npm install --legacy-peer-deps
```

> ต้องใส่ `--legacy-peer-deps` เพราะ `react-native-iap` ระบุ peer เป็น `react-native-nitro-modules@^0.31.1` แต่โปรเจกต์ใช้ `^0.35.0`

### 2. สร้างไฟล์ `.env`

คัดลอกจาก `.env.example` แล้วเติมค่าจริง (ไฟล์ `.env` ถูก ignore ไว้ ไม่ขึ้น git)

```sh
cp .env.example .env
```

ตัวแปรที่ต้องมี:

| ตัวแปร | คำอธิบาย |
|---|---|
| `API_BASE_URL` | URL ของ backend API |
| `RESET_PASSWORD_CALLBACK` | deep link ปลายทางหลังรีเซ็ตรหัสผ่าน |
| `VIDEO_STREAM_BASE_URL` | base URL ของไฟล์วิดีโอคอร์ส |
| `VIDEO_THUMBNAIL_BASE_URL` | base URL ของ thumbnail |
| `GOOGLE_WEB_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID` | Google Sign-In |
| `TWITTER_CLIENT_ID` | Twitter OAuth |
| `LINE_CLIENT_ID` | LINE Login |
| `STREAM_API_BASE_URL` / `STREAM_API_KEY` | บริการไลฟ์สตรีม |
| `STREAM_RTMP_SERVER` / `STREAM_HLS_SERVER` | endpoint สำหรับ push / play สตรีม |
| `STREAM_WHIP_BASE_URL` | endpoint WebRTC (WHIP) |
| `STREAM_SIGNALR_HUB` | SignalR hub สำหรับ realtime |

### 3. ติดตั้ง Pods (เฉพาะ iOS)

```sh
bundle install          # ครั้งแรกเท่านั้น
bundle exec pod install --project-directory=ios
```

### 4. รันแอป

```sh
npm start               # Metro dev server
npm run android         # หน้าต่างใหม่
npm run ios
```

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm start` | เปิด Metro dev server |
| `npm run android` | build + ติดตั้งลง Android emulator/device |
| `npm run android:debug` | build APK debug อย่างเดียว |
| `npm run ios` | build + รันบน iOS Simulator |
| `npm run lint` | ตรวจ ESLint |
| `npm run typecheck` | ตรวจ TypeScript (ไม่ emit ไฟล์) |
| `npm test` | รัน Jest |

---

## โครงสร้างโปรเจกต์

```
src/
├── assets/        # รูปภาพ ฟอนต์ ไอคอน
├── components/    # UI components ที่ใช้ซ้ำ
├── config/        # ค่าคอนฟิกและ env mapping
├── constants/     # ค่าคงที่ต่าง ๆ
├── helpers/       # ฟังก์ชันช่วยเหลือทั่วไป
├── hooks/         # custom React hooks
├── navigation/    # RootNavigator, AppStack, auth / bottom / profile stacks
├── screens/       # หน้าจอ: about, auth, class, course, home, live,
│                  #          notification, policy, profile, teacher, terms
├── services/      # เรียก API แยกตามโดเมน + http.ts (axios instance)
├── stores/        # Zustand stores
├── styles/        # theme และ style กลาง
├── types/         # TypeScript types
└── validation/    # Yup schemas
```

---

## แก้ปัญหาที่พบบ่อย

**Build Android ล้มที่ `assertWorkletsVersionTask`**

Reanimated 4.2.x รองรับ `react-native-worklets` เฉพาะสาย 0.7.x เท่านั้น ถ้าถูกอัปเป็น 0.8+ ให้ปักหมุดกลับ

```sh
npm install react-native-worklets@0.7.4 --save-exact --legacy-peer-deps
```

**Metro ใช้ cache เก่า / แก้โค้ดแล้วไม่อัปเดต**

```sh
npx react-native start --reset-cache
```

**Android build ค้างหรือ error แปลก ๆ**

```sh
cd android && ./gradlew clean && cd ..
```

**iOS build พังหลังเปลี่ยน native dependency**

```sh
bundle exec pod install --project-directory=ios
```

---

## หมายเหตุ

- ห้าม commit ไฟล์ `.env`, keystore สำหรับ release, หรือไฟล์ credential ใด ๆ
- `android/app/debug.keystore` เป็น debug key มาตรฐานของ React Native — ปลอดภัยที่จะอยู่ใน repo
