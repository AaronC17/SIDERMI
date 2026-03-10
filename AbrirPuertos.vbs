Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute "netsh", "advfirewall firewall add rule name=""SIDERMI-5173"" dir=in action=allow protocol=TCP localport=5173", "", "runas", 1
WScript.Sleep 2000
UAC.ShellExecute "netsh", "advfirewall firewall add rule name=""SIDERMI-4000"" dir=in action=allow protocol=TCP localport=4000", "", "runas", 1
