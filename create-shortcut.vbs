Set WshShell = CreateObject("WScript.Shell")
Set Shortcut = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Prompt Management Tool.lnk")

Shortcut.TargetPath = "cmd.exe"
Shortcut.Arguments = "/c ""cd /d D:\promptManagement\vite-react-app && start-app.bat"""
Shortcut.WorkingDirectory = "D:\promptManagement\vite-react-app"
Shortcut.IconLocation = "shell32.dll,13"
Shortcut.Description = "Stable Diffusion Prompt Management Tool"
Shortcut.WindowStyle = 7
Shortcut.Save

WScript.Echo "Desktop shortcut created successfully!"