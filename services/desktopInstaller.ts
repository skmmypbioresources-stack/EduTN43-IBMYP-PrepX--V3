// Desktop Software Installer Service
// Generates native desktop shortcuts and standalone window launchers for Windows & Mac

export const downloadWindowsDesktopInstaller = (appUrl: string, appName: string = 'GSIS PrepX Attendance') => {
  // Batch + PowerShell script that creates a desktop shortcut with standalone app window flags
  const scriptContent = `@echo off
title Installing ${appName}...
echo ========================================================
echo   Installing ${appName} to your Desktop
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\\"$desktop\\\\${appName}.lnk\\"); $chrome = (Get-ItemProperty 'HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\chrome.exe' -ErrorAction SilentlyContinue).'(default)'; $msedge = (Get-ItemProperty 'HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\msedge.exe' -ErrorAction SilentlyContinue).'(default)'; if ($msedge) { $s.TargetPath = $msedge; $s.Arguments = '--app=\\"${appUrl}\\" --window-size=1280,850'; } elseif ($chrome) { $s.TargetPath = $chrome; $s.Arguments = '--app=\\"${appUrl}\\" --window-size=1280,850'; } else { $s.TargetPath = '${appUrl}'; }; $s.Description = '${appName}'; $s.Save();"

echo [SUCCESS] ${appName} has been installed to your Desktop!
echo Look on your Desktop for the "${appName}" icon.
echo.
timeout /t 3
exit
`;

  const blob = new Blob([scriptContent], { type: 'application/bat' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Install-${appName.replace(/\s+/g, '-')}-Desktop.cmd`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const downloadDirectDesktopShortcut = (appUrl: string, appName: string = 'GSIS PrepX Attendance') => {
  const shortcutContent = `[InternetShortcut]\nURL=${appUrl}\nIconIndex=0\nIconFile=${appUrl}/favicon.ico\n`;
  const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${appName}.url`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
