# Chatbot UI Interaction Design
## University Face Recognition System

### Core Interaction Flow

**Main Interface**: Touch-optimized chatbot for 7-inch Raspberry Pi screen
- **Primary Function**: Provide instant feedback and assistance for face recognition access system
- **Target Users**: University students, staff, and visitors
- **Environment**: Main gate entrance with touchscreen display

### Interactive Components

#### 1. **Chat Interface** (Primary Interaction)
- **Message Display Area**: Scrollable conversation history with system messages and user queries
- **Quick Response Buttons**: Pre-defined touch buttons for common questions
  - "Access Denied - What should I do?"
  - "How does face recognition work?"
  - "Report an issue"
  - "Contact security"
- **Virtual Keyboard**: On-screen keyboard for custom text input
- **Voice Input Toggle**: Optional voice-to-text functionality

#### 2. **System Status Dashboard** (Secondary Interaction)
- **Real-time Recognition Feed**: Live camera preview with detection overlay
- **Access Statistics**: Today's access granted/denied counts with animated counters
- **System Health Indicators**: Connection status, database sync, camera status
- **Recent Activity Log**: Scrollable list of recent access attempts with timestamps

#### 3. **Help & Support Center** (Tertiary Interaction)
- **FAQ Accordion**: Expandable sections for common issues
- **Troubleshooting Wizard**: Step-by-step guided problem resolution
- **Emergency Contacts**: Quick-dial buttons for security and IT support
- **User Guide**: Interactive tutorial for face recognition best practices

### Multi-turn Interaction Loops

#### Access Denied Scenario:
1. User approaches gate → System displays "Access Denied" message
2. Chatbot automatically activates → "I see your access was denied. Let me help you."
3. User selects reason from quick buttons → Bot provides specific guidance
4. If "Face not recognized" → Bot guides through positioning, lighting checks
5. If "Database issue" → Bot offers to contact IT support
6. Follow-up: "Would you like me to notify security staff?"

#### System Information Request:
1. User asks "How accurate is this system?"
2. Bot responds with statistics and confidence metrics
3. User can drill down: "What about in different lighting?"
4. Bot provides detailed technical information
5. Option to view real-time performance data

#### Emergency Contact:
1. User indicates emergency situation
2. Bot immediately displays emergency contact options
3. One-touch calling for security, medical, or fire department
4. Bot can share location and system status with responders

### Touchscreen Optimization Features

- **Large Touch Targets**: Minimum 44px touch areas for all interactive elements
- **Gesture Support**: Swipe for message history, pinch for camera zoom
- **Haptic Feedback**: Vibration confirmation for button presses
- **Accessibility Mode**: High contrast, larger text, audio descriptions
- **Idle Timeout**: Returns to welcome screen after 30 seconds of inactivity

### Data Integration Points

- **Live Recognition Data**: Real-time face embedding comparison results
- **Database Connectivity**: Student/staff directory integration
- **Access Log Sync**: Continuous update of entry/exit records
- **System Monitoring**: Hardware status, network connectivity, performance metrics