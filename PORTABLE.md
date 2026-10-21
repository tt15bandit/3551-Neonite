# Neonite portable - port 3551

Copy this entire folder to a writable location on a Windows x64 PC, then
double-click Start Neonite.bat. No Node.js installation or administrator
installation is needed. Keep runtime and node_modules with the application.

Point your launcher at http://localhost:3551.

Saved profiles, lockers, and per-player cloud storage are kept in profile.
This folder starts with no saved accounts; new profiles are created from
profile_template when requested by the game. To reset accounts again, stop
Neonite and delete the contents of profile, leaving profile_template alone.

Stop Neonite with Ctrl+C before moving or copying the folder. The runtime and
dependencies are bundled for offline startup; game assets and external services
may still require an internet connection. Upstream automatic updates are disabled
to preserve the port changes.