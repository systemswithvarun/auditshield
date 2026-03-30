# **Audit Shield: System Specification & PRD**

## **1. Executive Summary**

**Audit Shield** is a digital Operational Compliance OS designed to replace high-friction paper food safety logs in commercial kitchens. The system enforces accountability by automating log scheduling, detecting temperature breaches in real-time, and mandating corrective actions. It provides management with a "Single Pane of Glass" view into kitchen health, moving from reactive paper-filing to proactive, data-driven food safety.

---

## **2. User Roles**

|**Role**|**Access Level**|**Primary Responsibility**|
|---|---|---|
|**Organization Owner**|Full Admin|Manages subscription, creates Locations, and reviews high-level compliance stats.|
|**Location Manager**|Administrative|Configures Stations, sets Safety Thresholds (Min/Max), manages Staff PINs, and exports Reports.|
|**Kitchen Staff**|Operational|Performs daily logging via the Kiosk using a unique 4-digit PIN; enters Corrective Actions for breaches.|
|**Health Inspector**|View-Only (via Export)|Reviews the digital audit trail and exception reports during site visits.|

---

## **3. Core Features**

- **Station Management:** Define physical assets (Walk-ins, Prep Lines, Dishwashers) with metadata.
    
- **Custom Thresholds:** Set specific $min\_temp$ and $max\_temp$ per station to trigger automated alerts.
    
- **Staff PIN Identity:** Secure 10-key PIN pad for fast, attributable logging without shared passwords.
    
- **The Scheduled Engine:** Automatic generation of "Expected Slots" for every check window throughout the day.
    
- **Fail-Forward Validation:** Real-time lock on log submission if a reading is out of range; requires text-based explanation to proceed.
    
- **Compliance Pulse:** A 0–100% real-time completion bar on the main dashboard.
    
- **Status Indicators:** Visual traffic lights (🟢 🟡 🔴 🟠) for Completed, Pending, Missed, and Late entries.
    
- **Audit-Ready Reporting:** PDF export engine for Raw Logs and Exception Reports (breaches only).
    

---

## **4. Core Workflows**

### **A. Onboarding & Setup**

1. **Manager** signs up via Google OAuth and creates an **Organization**.
    
2. **Manager** adds a **Location** and creates **Stations** (e.g., "Main Walk-in").
    
3. **Manager** sets **Schedules** (e.g., "Morning Temp Check: 08:00 – 09:30").
    

### **B. The Daily Cycle**

1. **System** automatically populates `schedule_instances` at 12:00 AM for all active schedules.
    
2. **Staff** approaches the Tablet Kiosk, enters their **PIN**, and selects the active "Pending" slot.
    
3. **Staff** enters the physical reading.
    
    - _If Safe:_ Log is saved immediately.
        
    - _If Unsafe:_ System prompts for **Corrective Action** (e.g., "Turned down dial, re-checking in 30m").
        

### **C. Management Review**

1. **Manager** checks the **Dashboard** mid-day to see the **Compliance Pulse**.
    
2. **System** triggers an email alert via **Resend** if a window closes without a log.
    
3. **Manager** filters logs by "Breach" to verify all issues were addressed.
    

---

## **5. Business Rules**

- **Immutable Accountability:** Every single log must be linked to a `staff_id` via PIN; "Anonymous" logs are strictly prohibited.
    
- **Domain Specificity:** Safety thresholds ($Min/Max$) must be defined at the Station level, not the Organization level.
    
- **Role-Based Permissions:** Only Managers can edit station ranges or delete logs; Staff access is restricted to "Create Only."
    
- **Log Preservation:** Once a log is saved, the original reading cannot be modified; it can only be "Anonymized" or "Flagged" to preserve the audit trail.
    
- **Timestamp Integrity:** System must distinguish between `created_at` (server time) and `logged_at` (actual staff entry time) to prevent "Back-filling" of logs.
    
- **Historical Snapshotting:** Breach detection must compare the reading against the thresholds _active at the time of the log_, even if the manager changes the station's limits later.