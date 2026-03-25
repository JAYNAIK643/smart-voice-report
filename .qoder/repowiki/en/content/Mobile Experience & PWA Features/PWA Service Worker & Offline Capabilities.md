# PWA Service Worker & Offline Capabilities

<cite>
**Referenced Files in This Document**
- [service-worker.js](file://Frontend/public/service-worker.js)
- [pwaService.js](file://Frontend/src/services/pwaService.js)
- [offlineService.js](file://Frontend/src/services/offlineService.js)
- [OfflineIndicator.jsx](file://Frontend/src/components/mobile/OfflineIndicator.jsx)
- [PWAInstallPrompt.jsx](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx)
- [manifest.json](file://Frontend/public/manifest.json)
- [offline.html](file://Frontend/public/offline.html)
- [main.jsx](file://Frontend/src/main.jsx)
- [App.jsx](file://Frontend/src/App.jsx)
- [vite.config.ts](file://Frontend/vite.config.ts)
- [package.json](file://Frontend/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the Progressive Web App (PWA) service worker implementation and offline capabilities in the SmartCity GRS application. It covers service worker registration, lifecycle management, update mechanisms, offline caching strategies, background sync for complaint submissions, event handlers, message passing between worker and app, and error handling. It also documents configuration options, performance optimization techniques, and debugging approaches for service worker issues.

## Project Structure
The PWA implementation spans three primary areas:
- Service worker and static assets in the public folder
- Application-side services for PWA and offline functionality
- UI components that surface offline status and installation prompts

```mermaid
graph TB
subgraph "Public Assets"
SW["service-worker.js"]
MAN["manifest.json"]
OFFHTML["offline.html"]
end
subgraph "Application Services"
PWASVC["pwaService.js"]
OFFSVC["offlineService.js"]
end
subgraph "UI Components"
OFFIND["OfflineIndicator.jsx"]
INSTALLPROMPT["PWAInstallPrompt.jsx"]
end
subgraph "Runtime"
MAIN["main.jsx"]
APP["App.jsx"]
end
MAIN --> APP
APP --> OFFIND
APP --> INSTALLPROMPT
PWASVC --> SW
PWASVC --> OFFSVC
OFFSVC --> OFFHTML
SW --> MAN
```

**Diagram sources**
- [service-worker.js:1-175](file://Frontend/public/service-worker.js#L1-L175)
- [pwaService.js:1-171](file://Frontend/src/services/pwaService.js#L1-L171)
- [offlineService.js:1-302](file://Frontend/src/services/offlineService.js#L1-L302)
- [OfflineIndicator.jsx:1-134](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L1-L134)
- [PWAInstallPrompt.jsx:1-157](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L1-L157)
- [manifest.json:1-69](file://Frontend/public/manifest.json#L1-L69)
- [offline.html:1-111](file://Frontend/public/offline.html#L1-L111)
- [main.jsx:1-24](file://Frontend/src/main.jsx#L1-L24)
- [App.jsx:1-218](file://Frontend/src/App.jsx#L1-L218)

**Section sources**
- [service-worker.js:1-175](file://Frontend/public/service-worker.js#L1-L175)
- [pwaService.js:1-171](file://Frontend/src/services/pwaService.js#L1-L171)
- [offlineService.js:1-302](file://Frontend/src/services/offlineService.js#L1-L302)
- [OfflineIndicator.jsx:1-134](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L1-L134)
- [PWAInstallPrompt.jsx:1-157](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L1-L157)
- [manifest.json:1-69](file://Frontend/public/manifest.json#L1-L69)
- [offline.html:1-111](file://Frontend/public/offline.html#L1-L111)
- [main.jsx:1-24](file://Frontend/src/main.jsx#L1-L24)
- [App.jsx:1-218](file://Frontend/src/App.jsx#L1-L218)

## Core Components
- Service Worker: Implements install, activate, fetch, sync, push, and notification handlers. Uses a feature flag to disable PWA features globally.
- PWA Service: Registers the service worker, handles updates, background sync registration, and install prompt orchestration.
- Offline Service: Manages offline complaint drafts and queue, persistence via localStorage, retry logic, and automatic sync on connectivity restore.
- UI Components: Offline indicator and PWA install prompt provide user feedback and actions.

**Section sources**
- [service-worker.js:1-175](file://Frontend/public/service-worker.js#L1-L175)
- [pwaService.js:1-171](file://Frontend/src/services/pwaService.js#L1-L171)
- [offlineService.js:1-302](file://Frontend/src/services/offlineService.js#L1-L302)
- [OfflineIndicator.jsx:1-134](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L1-L134)
- [PWAInstallPrompt.jsx:1-157](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L1-L157)

## Architecture Overview
The PWA architecture integrates the service worker with the application runtime and offline services. The service worker enforces a network-first fetch strategy for same-origin non-API resources, caches static assets during install, and serves offline.html when offline. Background sync triggers offline complaint submissions when online. The application registers the service worker, listens for updates, and coordinates offline data sync.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant App as "App Runtime"
participant SW as "Service Worker"
participant Cache as "Cache Storage"
participant Server as "Backend API"
Browser->>App : Load application
App->>SW : Register service worker
SW->>Cache : Install : cache static assets
SW->>SW : Activate : cleanup old caches
Browser->>SW : Fetch resource
SW->>Server : Network-first request
alt Success
SW->>Cache : Cache response
SW-->>Browser : Serve response
else Failure
SW-->>Browser : Fallback to cache or offline.html
end
note over SW,App : Background sync triggers offline sync
SW->>App : PostMessage SYNC_OFFLINE_COMPLAINTS
App->>App : offlineService.syncOfflineComplaints()
App->>Server : Submit queued complaints
Server-->>App : Responses
App-->>App : Update localStorage queue
```

**Diagram sources**
- [service-worker.js:20-105](file://Frontend/public/service-worker.js#L20-L105)
- [pwaService.js:10-71](file://Frontend/src/services/pwaService.js#L10-L71)
- [offlineService.js:168-248](file://Frontend/src/services/offlineService.js#L168-L248)

## Detailed Component Analysis

### Service Worker Lifecycle and Fetch Strategy
- Install: Opens cache with a versioned name and caches static assets. Uses a feature flag to skip installation when disabled.
- Activate: Deletes old caches and claims clients to ensure new worker controls pages immediately.
- Fetch: Applies a network-first strategy for same-origin non-API requests, caches successful responses, and falls back to cache or offline.html.
- Background Sync: Listens for sync events with a specific tag and posts a message to the app to trigger offline sync.
- Push and Notification: Shows push notifications and opens the app on click.
- Message: Responds to SKIP_WAITING to accelerate activation.

```mermaid
flowchart TD
Start(["Install Event"]) --> CheckFlag{"PWA_ENABLED?"}
CheckFlag --> |No| SkipInstall["Skip installation"]
CheckFlag --> |Yes| OpenCache["Open cache with versioned name"]
OpenCache --> CacheAssets["Cache static assets"]
CacheAssets --> SkipWaiting["skipWaiting()"]
ActivateStart(["Activate Event"]) --> ListCaches["List cache keys"]
ListCaches --> FilterOld["Filter old caches"]
FilterOld --> DeleteOld["Delete old caches"]
DeleteOld --> ClaimClients["clients.claim()"]
FetchStart(["Fetch Event"]) --> OriginCheck{"Same origin?"}
OriginCheck --> |No| PassThrough["Ignore (cross-origin)"]
OriginCheck --> |Yes| ApiCheck{"API or localhost?"}
ApiCheck --> |Yes| PassThrough
ApiCheck --> |No| NetFirst["Network-first fetch"]
NetFirst --> NetOK{"Network success?"}
NetOK --> |Yes| CloneCache["Clone response and cache"]
NetOK --> |No| Fallback["Match cache or offline.html"]
```

**Diagram sources**
- [service-worker.js:20-105](file://Frontend/public/service-worker.js#L20-L105)

**Section sources**
- [service-worker.js:20-175](file://Frontend/public/service-worker.js#L20-L175)

### Service Worker Registration and Update Mechanisms
- Registration: Checks service worker support and a feature flag, then registers the worker with a scope.
- Update Detection: Listens for updatefound and statechange to detect new worker installation and prompts the user to reload.
- Message Handling: Receives SYNC_OFFLINE_COMPLAINTS and triggers offline sync.
- Controller Change: Logs controller changes for observability.

```mermaid
sequenceDiagram
participant App as "App"
participant Reg as "ServiceWorkerRegistration"
participant NewWorker as "Installing Worker"
participant User as "User"
App->>Reg : register('/service-worker.js')
Reg-->>App : updatefound
App->>NewWorker : listen statechange
NewWorker-->>App : installed
App->>User : confirm("New version available")
alt Confirmed
App->>NewWorker : postMessage(SKIP_WAITING)
App->>App : window.location.reload()
else Cancelled
App-->>App : continue with current controller
end
```

**Diagram sources**
- [pwaService.js:10-71](file://Frontend/src/services/pwaService.js#L10-L71)

**Section sources**
- [pwaService.js:10-71](file://Frontend/src/services/pwaService.js#L10-L71)

### Offline Caching Strategies and Data Persistence
- Static Assets: Cached during install for offline readiness.
- Dynamic Content: Network-first strategy ensures fresh content; successful responses are cached for reuse.
- Offline Fallback: offline.html is served when fetch fails and no cache match exists.
- Data Persistence: Complaint drafts and queued submissions are stored in localStorage with retry logic and auto-sync on reconnect.

```mermaid
flowchart TD
DraftStart(["Save Draft"]) --> CheckOffline{"Offline enabled?"}
CheckOffline --> |No| ReturnDisabled["Return disabled"]
CheckOffline --> |Yes| CreateDraft["Create draft object"]
CreateDraft --> LoadExisting["Load existing drafts from localStorage"]
LoadExisting --> AppendDraft["Append new draft"]
AppendDraft --> PersistDrafts["Persist to localStorage"]
PersistDrafts --> DoneDraft(["Done"])
QueueStart(["Queue Complaint"]) --> CheckOfflineQ{"Offline enabled?"}
CheckOfflineQ --> |No| ReturnDisabledQ["Return disabled"]
CheckOfflineQ --> |Yes| CreateQueue["Create queue item"]
CreateQueue --> LoadQueue["Load existing queue"]
LoadQueue --> AppendQueue["Append to queue"]
AppendQueue --> PersistQueue["Persist to localStorage"]
PersistQueue --> OnlineCheck{"Is online?"}
OnlineCheck --> |Yes| ImmediateSync["Schedule immediate sync"]
OnlineCheck --> |No| Pending(["Pending"])
ImmediateSync --> DoneQueue(["Done"])
```

**Diagram sources**
- [offlineService.js:31-144](file://Frontend/src/services/offlineService.js#L31-L144)

**Section sources**
- [offlineService.js:1-302](file://Frontend/src/services/offlineService.js#L1-L302)

### Background Sync for Offline Complaint Submissions
- Registration: Requests background sync permission and registers a sync tag.
- Trigger: On connectivity restore, the app attempts to sync queued complaints.
- Worker Coordination: The service worker posts a message to the app to initiate sync when online.

```mermaid
sequenceDiagram
participant App as "App"
participant SW as "Service Worker"
participant Cache as "Cache Storage"
participant Server as "Backend API"
App->>SW : register('sync-offline-complaints')
SW-->>App : ready
App->>App : on online event
App->>SW : postMessage(SYNC_OFFLINE_COMPLAINTS)
SW-->>App : message handler invoked
App->>App : offlineService.syncOfflineComplaints()
loop For each queued complaint
App->>Server : POST /api/grievances
alt Success
App->>App : remove from queue
else Failure
App->>App : increment retry count
end
end
App->>App : persist remaining queue
```

**Diagram sources**
- [pwaService.js:112-127](file://Frontend/src/services/pwaService.js#L112-L127)
- [offlineService.js:168-248](file://Frontend/src/services/offlineService.js#L168-L248)
- [service-worker.js:107-117](file://Frontend/public/service-worker.js#L107-L117)

**Section sources**
- [pwaService.js:112-127](file://Frontend/src/services/pwaService.js#L112-L127)
- [offlineService.js:168-248](file://Frontend/src/services/offlineService.js#L168-L248)
- [service-worker.js:107-117](file://Frontend/public/service-worker.js#L107-L117)

### Service Worker Event Handlers and Message Passing
- sync: Triggers offline complaint sync when online.
- push/notificationclick: Handles push notifications and opening the app.
- message: Responds to SKIP_WAITING to accelerate activation.
- fetch: Implements network-first strategy with caching and offline fallback.

```mermaid
classDiagram
class ServiceWorker {
+install(event)
+activate(event)
+fetch(event)
+sync(event)
+push(event)
+notificationclick(event)
+message(event)
-syncOfflineComplaints()
}
```

**Diagram sources**
- [service-worker.js:20-175](file://Frontend/public/service-worker.js#L20-L175)

**Section sources**
- [service-worker.js:20-175](file://Frontend/public/service-worker.js#L20-L175)

### UI Components: Offline Indicator and PWA Install Prompt
- OfflineIndicator: Shows real-time offline status, queued/draft counts, and sync progress. Automatically attempts to sync when online.
- PWAInstallPrompt: Manages the beforeinstallprompt lifecycle, presents a custom install prompt, and records user choice.

```mermaid
sequenceDiagram
participant User as "User"
participant Comp as "OfflineIndicator"
participant App as "App"
participant OffSvc as "offlineService"
User->>Comp : View app
Comp->>App : on online/offline events
App->>OffSvc : getOfflineStats()
App->>OffSvc : syncOfflineComplaints() (when online)
OffSvc-->>App : results
App-->>Comp : updated stats
participant InstallComp as "PWAInstallPrompt"
InstallComp->>User : show install prompt after delay
User->>InstallComp : accept or dismiss
InstallComp-->>InstallComp : persist choice
```

**Diagram sources**
- [OfflineIndicator.jsx:11-61](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L11-L61)
- [offlineService.js:289-301](file://Frontend/src/services/offlineService.js#L289-L301)
- [PWAInstallPrompt.jsx:12-77](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L12-L77)

**Section sources**
- [OfflineIndicator.jsx:1-134](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L1-L134)
- [PWAInstallPrompt.jsx:1-157](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L1-L157)
- [offlineService.js:289-301](file://Frontend/src/services/offlineService.js#L289-L301)

## Dependency Analysis
- Service worker depends on Cache Storage APIs and the application’s offline service for data synchronization.
- PWA service depends on the service worker registration and background sync APIs.
- Offline service depends on localStorage for persistence and the network for sync.
- UI components depend on the services for state and actions.

```mermaid
graph TB
SW["service-worker.js"] --> CACHE["Cache Storage"]
SW --> MSG["postMessage"]
PWASVC["pwaService.js"] --> SWREG["ServiceWorkerRegistration"]
PWASVC --> SYNC["Background Sync"]
OFFSVC["offlineService.js"] --> LS["localStorage"]
OFFSVC --> NET["fetch"]
OFFIND["OfflineIndicator.jsx"] --> OFFSVC
INSTALLPROMPT["PWAInstallPrompt.jsx"] --> PWASVC
```

**Diagram sources**
- [service-worker.js:1-175](file://Frontend/public/service-worker.js#L1-L175)
- [pwaService.js:1-171](file://Frontend/src/services/pwaService.js#L1-L171)
- [offlineService.js:1-302](file://Frontend/src/services/offlineService.js#L1-L302)
- [OfflineIndicator.jsx:1-134](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L1-L134)
- [PWAInstallPrompt.jsx:1-157](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L1-L157)

**Section sources**
- [service-worker.js:1-175](file://Frontend/public/service-worker.js#L1-L175)
- [pwaService.js:1-171](file://Frontend/src/services/pwaService.js#L1-L171)
- [offlineService.js:1-302](file://Frontend/src/services/offlineService.js#L1-L302)
- [OfflineIndicator.jsx:1-134](file://Frontend/src/components/mobile/OfflineIndicator.jsx#L1-L134)
- [PWAInstallPrompt.jsx:1-157](file://Frontend/src/components/mobile/PWAInstallPrompt.jsx#L1-L157)

## Performance Considerations
- Cache Busting: Build configuration adds content hashes to asset filenames to improve cache invalidation.
- Network Strategy: Network-first fetch reduces stale content risk; successful responses are cached for reuse.
- Background Sync: Queues submissions and retries with bounded attempts to avoid repeated failures.
- Feature Flags: PWA features can be disabled globally to prevent caching issues in all environments.
- IndexedDB Check: Offline features require localStorage availability; IndexedDB checks are present in code comments.

**Section sources**
- [vite.config.ts:28-36](file://Frontend/vite.config.ts#L28-L36)
- [service-worker.js:84-104](file://Frontend/public/service-worker.js#L84-L104)
- [offlineService.js:168-248](file://Frontend/src/services/offlineService.js#L168-L248)
- [pwaService.js:17-22](file://Frontend/src/services/pwaService.js#L17-L22)

## Troubleshooting Guide
Common issues and resolutions:
- Service Worker Not Installing
  - Cause: PWA_ENABLED is false or feature flag disabled.
  - Action: Enable PWA features and ensure registration succeeds.
- No Updates Detected
  - Cause: New worker not installed or user did not confirm reload.
  - Action: Confirm update prompt and reload; ensure SKIP_WAITING message is sent.
- Background Sync Not Working
  - Cause: Sync permission not granted or tag mismatch.
  - Action: Request sync permission and verify tag registration.
- Offline Mode Not Functioning
  - Cause: Cross-origin requests bypass caching; API requests are intentionally not cached.
  - Action: Ensure same-origin requests and verify offline.html availability.
- LocalStorage Persistence Issues
  - Cause: Disabled offline features or unsupported environment.
  - Action: Verify feature flags and localStorage availability.

Debugging steps:
- Inspect service worker lifecycle in browser devtools.
- Monitor console logs for PWA and offline operations.
- Verify manifest.json entries and icons.
- Test offline behavior by disabling network and reloading.

**Section sources**
- [service-worker.js:20-175](file://Frontend/public/service-worker.js#L20-L175)
- [pwaService.js:10-71](file://Frontend/src/services/pwaService.js#L10-L71)
- [offlineService.js:168-248](file://Frontend/src/services/offlineService.js#L168-L248)
- [manifest.json:1-69](file://Frontend/public/manifest.json#L1-L69)

## Conclusion
The SmartCity GRS PWA implementation provides robust offline capabilities through a network-first service worker strategy, background sync for complaint submissions, and user-facing indicators. The modular design separates concerns between the service worker, application services, and UI components, enabling maintainability and extensibility. With feature flags and resilient error handling, the system remains safe to deploy across diverse environments.