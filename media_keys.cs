using System;
using System.Runtime.InteropServices;

public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);

    public static void Main(string[] args) {
        if (args.Length > 0) {
            byte key = 0;
            if (args[0] == "playpause") key = 0xB3;
            else if (args[0] == "next") key = 0xB0;
            else if (args[0] == "prev") key = 0xB1;
            
            if (key != 0) {
                keybd_event(key, 0, 0, 0);
                keybd_event(key, 0, 2, 0);
            }
        }
    }
}
