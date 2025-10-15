# DropMate - A Delivery APP

## 1. Motivation
Parcel delivery platforms are increasingly essential in modern logistics, but most existing mobile apps are **driver- or dispatcher-centric** and fail to provide a **unified, real-time experience** for both drivers and customers. Users often face issues such as delayed status updates, lack of live driver tracking, or missing push notifications when a parcel is nearby or delayed.


**ParcelMate Mobile** aims to solve these problems by offering a **real-time and user-friendly mobile experience** that connects customers, drivers, and dispatchers seamlessly.  
The app focuses on the **driver and customer mobile experience** — enabling drivers to manage deliveries efficiently and customers to track orders live, all through an intuitive, mobile-first interface.

**Target Users:**
- **Drivers:** Who need a reliable, GPS-integrated mobile tool to view assigned deliveries, navigate routes, and update order statuses.
- **Customers:** Who want to track their packages live and receive notifications for delivery events.
- **Dispatchers:** Who benefit from live driver updates and ETA tracking on the management dashboard (external to this mobile scope).

**Existing Solutions & Limitations:**
Most courier apps (e.g., Canada Post, UPS Mobile) focus solely on customers, providing limited driver-side functionality and slow update intervals. ParcelMate combines **driver-side route tracking**, **customer-side live ETA**, and **push notifications** in one integrated app, backed by a lightweight real-time backend (Firebase).

---

## 2. Objective and Key Features

### Objective
Develop and deploy a **React Native + Expo** mobile app for Android and iOS that provides **real-time parcel delivery tracking** and **driver location updates** using Firebase, Expo Notifications, and Expo Location APIs.

The app will:
- Allow **authenticated users (drivers/customers)** to log in and access role-based features.
- Provide **real-time delivery updates**, **push notifications**, and **GPS-based tracking**.
- Serve as the **mobile frontend** of the broader ParcelMate platform.

---


### Core Features and Technologies

#### 🧭 Navigation
- Implemented using **React Navigation (Stack + Bottom Tabs)**.
- Screens:
  1. **Login / Register**
  2. **Home (Order List / Active Deliveries)**
  3. **Order Details** (with live driver tracking map)
  4. **Profile / Settings**
- Navigation includes **typed route parameters** (TypeScript) for dynamic screens (e.g., `/orders/:id`).

#### ⚙️ State Management and Persistence
- Global state handled via **Context API + useReducer** for authentication and order state.
- Persist login and order cache using **AsyncStorage** to maintain user sessions across app restarts.
- Example: user token, last known location, and recent orders saved locally.

#### 🔔 Notifications
- **Expo Notifications** for:
  - Local delivery reminders (“Your delivery is arriving soon!”).
  - Push notifications for backend-triggered updates (via Firebase Cloud Messaging).
- Notifications handle user taps → redirect to relevant order screen.

#### 🌐 Backend Integration
- **Firebase (BaaS)** for authentication, real-time database, and notifications.
  - **Firebase Authentication** for email/password login.
  - **Firebase Realtime Database** for live updates of driver locations and delivery statuses.
  - **Firebase Cloud Messaging (FCM)** for push notifications.
- Fetches and displays live data:
  - Orders assigned to drivers.
  - Real-time driver coordinates for customer tracking.
- Handles loading/error states gracefully with retry and network check.

#### 🚀 Deployment
- Built and deployed with **Expo EAS Build**.
- Android build (APK) and iOS TestFlight build available for demo and grading.
- Shared through **Expo Go link** for easy testing during presentation.

---