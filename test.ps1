Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class Media { [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo); public static void Send(byte key) { keybd_event(key, 0, 0, 0); keybd_event(key, 0, 2, 0); } }'
[Media]::Send([byte]0xB3)
