#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.
CoordMode, Mouse, Window

Key = %1%

SteamExe := "D:\Program Files (x86)\Steam\Steam.exe"
SteamArg := "steam://open/activateproduct"

SteamCmd := SteamExe . " " . SteamArg

Run, %SteamCmd%
WinWaitActive, Product Activation

Send {Enter}{Enter}
Sleep, 200
Send %Key%
Sleep, 1000
Send {Enter}
Sleep, 7000
Send {Enter}{Enter}{Enter}
Sleep, 12000
Send {Enter}