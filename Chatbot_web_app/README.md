# University Face Recognition Chatbot System

## Overview
A sophisticated chatbot UI designed for university face recognition access control systems. Built for 7-inch Raspberry Pi touchscreens with professional institutional styling and comprehensive functionality.

## Features
- **Real-time Chat Interface**: Interactive chatbot with quick response buttons
- **System Monitoring**: Live camera feed simulation with performance metrics
- **Help & Support**: Comprehensive troubleshooting wizard and FAQ system
- **Touchscreen Optimized**: Large touch targets and gesture-friendly interactions
- **Professional Design**: Institutional color scheme with smooth animations

## File Structure
```
├── index.html          # Main chatbot interface
├── status.html         # System monitoring dashboard
├── help.html           # Help & support center
├── main.js            # Core JavaScript functionality
├── resources/         # Image assets
│   ├── hero-security.jpg
│   ├── recognition-demo.jpg
│   └── campus-bg.jpg
├── design.md          # Design specifications
├── interaction.md     # Interaction design document
└── outline.md         # Project structure outline
```

## Deployment Instructions

### 1. Local Testing
```bash
# Navigate to project directory
cd /path/to/project

# Start local server
python -m http.server 8000

# Access in browser
http://localhost:8000
```

### 2. Raspberry Pi Deployment
```bash
# Copy files to Raspberry Pi
scp -r /path/to/project pi@raspberrypi:/home/pi/

# SSH into Raspberry Pi
ssh pi@raspberrypi

# Install web server
sudo apt update
sudo apt install nginx

# Copy files to web directory
sudo cp -r /home/pi/project/* /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# Restart nginx
sudo systemctl restart nginx
```

### 3. Touchscreen Configuration
```bash
# Install touchscreen drivers (if needed)
sudo apt install xinput-calibrator

# Calibrate touchscreen
sudo xinput_calibrator

# Configure for kiosk mode
sudo nano /etc/xdg/lxsession/LXDE/autostart
# Add: @chromium-browser --kiosk http://localhost
```

## System Requirements

### Hardware
- Raspberry Pi 3B+ or newer
- 7-inch touchscreen display (1024x600 recommended)
- Minimum 2GB RAM
- 8GB+ storage

### Software
- Raspberry Pi OS (formerly Raspbian)
- Modern web browser (Chromium recommended)
- Web server (Nginx/Apache)

### Browser Support
- Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Configuration

### 1. System Integration
Edit `main.js` to connect with your face recognition API:
```javascript
// Replace with your actual API endpoints
const API_ENDPOINTS = {
    recognition: 'http://your-api/recognize',
    status: 'http://your-api/status',
    database: 'http://your-api/database'
};
```

### 2. Customization
- Update university logo in navigation
- Modify color scheme in CSS variables
- Adjust touchscreen sensitivity in JavaScript
- Customize chatbot responses

### 3. Security Settings
```javascript
// Configure security parameters
const SECURITY_CONFIG = {
    sessionTimeout: 30000, // 30 seconds
    maxAttempts: 3,
    emergencyContact: '555-0911',
    encryptionKey: 'your-encryption-key'
};
```

## Testing Checklist

### Functionality Tests
- [ ] Chatbot responds to quick buttons
- [ ] System status updates in real-time
- [ ] Troubleshooting wizard works correctly
- [ ] FAQ accordion expands/collapses
- [ ] Contact buttons show appropriate alerts
- [ ] Search functionality filters content

### UI/UX Tests
- [ ] All touch targets are minimum 44px
- [ ] Animations are smooth (60fps)
- [ ] Text is readable on 7-inch screen
- [ ] Color contrast meets WCAG standards
- [ ] Navigation works on all pages

### Performance Tests
- [ ] Page loads within 3 seconds
- [ ] Animations don't cause lag
- [ ] Memory usage stays below 100MB
- [ ] CPU usage remains reasonable

## Troubleshooting

### Common Issues

1. **Touchscreen Not Responding**
   ```bash
   # Check touchscreen connection
   ls /dev/input/
   
   # Calibrate touchscreen
   sudo xinput_calibrator
   ```

2. **Display Resolution Issues**
   ```bash
   # Check current resolution
   fbset -s
   
   # Set custom resolution
   sudo nano /boot/config.txt
   # Add: hdmi_cvt=1024 600 60 3 0 0 0
   ```

3. **Browser Performance**
   ```bash
   # Enable hardware acceleration
   chromium-browser --enable-gpu-rasterization --enable-oop-rasterization
   ```

### Debug Mode
Enable debug logging in `main.js`:
```javascript
const DEBUG_MODE = true;
if (DEBUG_MODE) {
    console.log('Debug mode enabled');
    // Add debug logging throughout application
}
```

## Maintenance

### Regular Updates
- Check for security updates monthly
- Update browser and dependencies
- Monitor system performance metrics
- Backup configuration files

### Data Management
- Clear chat logs weekly
- Archive system logs monthly
- Update facial recognition database
- Monitor storage usage

## Support

For technical support:
- Email: support@university.edu
- Phone: 555-0912
- Emergency: 555-0911

## License

This project is licensed under the University Security Systems License. All rights reserved.

## Version History

- v2.1.0 - Initial release with full functionality
- v2.0.0 - Beta version with basic features
- v1.0.0 - Proof of concept

---

**Note**: This is a demonstration system. For production deployment, ensure all security protocols are properly implemented and tested.